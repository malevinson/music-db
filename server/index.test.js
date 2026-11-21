import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// ---- mocks (hoisted) -------------------------------------------------------

const spotify = vi.hoisted(() => ({
  clientCredentialsGrant: vi.fn(),
  setAccessToken: vi.fn(),
  searchArtists: vi.fn(),
}));
vi.mock('spotify-web-api-node', () => ({ default: vi.fn(() => spotify) }));

vi.mock('./utils/notifications.js', () => ({
  notifyDemoAccountChange: vi.fn(() => Promise.resolve()),
  notifyNewUser: vi.fn(() => Promise.resolve()),
  getIpInfo: vi.fn(() => Promise.resolve({ ip: '1.2.3.4', location: 'Somewhere' })),
}));

vi.mock('../User.js', () => ({ default: { findById: vi.fn(), findOne: vi.fn() } }));

vi.mock('../Artist.js', () => {
  const Artist = vi.fn(function (data) {
    Object.assign(this, data);
    this._id = 'new-artist-id';
    this.pinnedMeta = {};
    this.save = Artist.saveMock;
  });
  Artist.saveMock = vi.fn();
  Artist.find = vi.fn();
  Artist.findOne = vi.fn();
  Artist.deleteOne = vi.fn();
  return { default: Artist };
});

spotify.clientCredentialsGrant.mockResolvedValue({ body: { access_token: 'spotify-token', expires_in: 3600 } });

const { default: Artist } = await import('../Artist.js');
const { default: User } = await import('../User.js');
const notifications = await import('./utils/notifications.js');
const { default: app } = await import('./index.js');

// Snapshot import-time calls before clearMocks wipes them between tests.
const startupCalls = {
  connect: [...mongoose.connect.mock.calls],
  grant: spotify.clientCredentialsGrant.mock.calls.length,
  setAccessToken: [...spotify.setAccessToken.mock.calls],
};

// ---- helpers ---------------------------------------------------------------

const USER = { _id: 'user-1', email: 'me@x.com' };
const DEMO = { _id: 'demo-1', email: 'demo@test.com' };
const tokenFor = (user) => jwt.sign({ userId: user._id, email: user.email }, 'test-jwt-secret');
const actAs = (user) => {
  User.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(user) });
  return `Bearer ${tokenFor(user)}`;
};
const spotifyImage = (url) => ({
  body: { artists: { items: [{ images: [{ url: 'big' }, { url: 'medium' }, { url }] }] } },
});

// ---- tests -----------------------------------------------------------------

describe('startup', () => {
  it('connects to the playlistq database with serverless-friendly options', () => {
    expect(startupCalls.connect).toEqual([[
      'mongodb://127.0.0.1:27017/playlistq',
      expect.objectContaining({ dbName: 'playlistq', maxPoolSize: 1, serverSelectionTimeoutMS: 5000 }),
    ]]);
  });

  it('fetches a Spotify client-credentials token', () => {
    expect(startupCalls.grant).toBe(1);
    expect(startupCalls.setAccessToken).toEqual([['spotify-token']]);
  });
});

describe('GET /api', () => {
  it('responds with a hello message', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Hello from the custom server!' });
  });
});

describe('artist routes require authentication', () => {
  it.each([
    ['get', '/api/artists'],
    ['post', '/api/artists'],
    ['get', '/api/artist/abc'],
    ['put', '/api/artist/abc'],
    ['delete', '/api/artist/abc'],
  ])('%s %s → 401 without a token', async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/artists', () => {
  it("returns only the current user's artists", async () => {
    Artist.find.mockResolvedValue([{ _id: 'a', name: 'Muse' }]);
    const res = await request(app).get('/api/artists').set('Authorization', actAs(USER));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ _id: 'a', name: 'Muse' }]);
    expect(Artist.find).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('returns 500 on database errors', async () => {
    Artist.find.mockRejectedValue(new Error('db down'));
    const res = await request(app).get('/api/artists').set('Authorization', actAs(USER));
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error fetching artists.');
  });
});

describe('POST /api/artists', () => {
  beforeEach(() => {
    Artist.saveMock.mockResolvedValue();
    spotify.searchArtists.mockResolvedValue(spotifyImage('small.jpg'));
  });

  it('creates an artist for the current user with a Spotify image', async () => {
    const res = await request(app).post('/api/artists').set('Authorization', actAs(USER))
      .send({ name: 'Muse', rating: 80 });

    expect(res.status).toBe(200);
    expect(Artist).toHaveBeenCalledWith({ name: 'Muse', rating: 80, userId: 'user-1' });
    expect(spotify.searchArtists).toHaveBeenCalledWith('Muse');
    expect(Artist.saveMock).toHaveBeenCalled();
    expect(res.body.artist).toMatchObject({ _id: 'new-artist-id', name: 'Muse', rating: 80, image: 'small.jpg' });
  });

  it('defaults the rating to 100', async () => {
    await request(app).post('/api/artists').set('Authorization', actAs(USER)).send({ name: 'Muse' });
    expect(Artist).toHaveBeenCalledWith(expect.objectContaining({ rating: 100 }));
  });

  it('still saves the artist when Spotify has no image', async () => {
    spotify.searchArtists.mockResolvedValue({ body: { artists: { items: [] } } });
    const res = await request(app).post('/api/artists').set('Authorization', actAs(USER)).send({ name: 'Nobody' });
    expect(res.status).toBe(200);
    expect(res.body.artist.image).toBeUndefined();
    expect(Artist.saveMock).toHaveBeenCalled();
  });

  it('still saves the artist when Spotify errors', async () => {
    spotify.searchArtists.mockRejectedValue(new Error('rate limited'));
    const res = await request(app).post('/api/artists').set('Authorization', actAs(USER)).send({ name: 'Muse' });
    expect(res.status).toBe(200);
    expect(Artist.saveMock).toHaveBeenCalled();
  });

  it('returns 500 when saving fails', async () => {
    Artist.saveMock.mockRejectedValue(new Error('db down'));
    const res = await request(app).post('/api/artists').set('Authorization', actAs(USER)).send({ name: 'Muse' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error creating artist.');
  });

  it('does not notify for regular users', async () => {
    await request(app).post('/api/artists').set('Authorization', actAs(USER)).send({ name: 'Muse' });
    expect(notifications.notifyDemoAccountChange).not.toHaveBeenCalled();
  });

  it('notifies when the demo account adds an artist', async () => {
    await request(app).post('/api/artists').set('Authorization', actAs(DEMO)).send({ name: 'Muse', rating: 70 });
    expect(notifications.notifyDemoAccountChange).toHaveBeenCalledWith(
      'Artist Created',
      { artistName: 'Muse', rating: 70, artistId: 'new-artist-id' },
      { ip: '1.2.3.4', location: 'Somewhere' }
    );
  });

  it('does not fail if the demo notification fails', async () => {
    notifications.notifyDemoAccountChange.mockRejectedValueOnce(new Error('smtp down'));
    const res = await request(app).post('/api/artists').set('Authorization', actAs(DEMO)).send({ name: 'Muse' });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/artist/:id', () => {
  it('returns the artist if it belongs to the user', async () => {
    Artist.findOne.mockResolvedValue({ _id: 'a', name: 'Muse' });
    const res = await request(app).get('/api/artist/a').set('Authorization', actAs(USER));
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Muse');
    expect(Artist.findOne).toHaveBeenCalledWith({ _id: 'a', userId: 'user-1' });
  });

  it("404s for missing or someone else's artist", async () => {
    Artist.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/artist/a').set('Authorization', actAs(USER));
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Artist not found or access denied.');
  });

  it('returns 500 on errors (e.g. invalid id)', async () => {
    Artist.findOne.mockRejectedValue(new Error('CastError'));
    const res = await request(app).get('/api/artist/bad').set('Authorization', actAs(USER));
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/artist/:id', () => {
  const existing = () => ({
    _id: 'a', name: 'Muse', rating: 80, pinned: false,
    pinnedMeta: { artist: true, radio: false, album: false },
    save: vi.fn().mockResolvedValue(),
  });

  it('updates name, rating, pinned state and pinned meta', async () => {
    const artist = existing();
    Artist.findOne.mockResolvedValue(artist);
    const res = await request(app).put('/api/artist/a').set('Authorization', actAs(USER)).send({
      name: 'Muse', rating: 95, pinned: true, pinnedMeta: { artist: false, radio: true, album: true },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Artist updated!' });
    expect(Artist.findOne).toHaveBeenCalledWith({ _id: 'a', userId: 'user-1' });
    expect(artist).toMatchObject({
      rating: 95, pinned: true, pinnedMeta: { artist: false, radio: true, album: true },
    });
    expect(artist.save).toHaveBeenCalled();
  });

  it("404s for missing or someone else's artist", async () => {
    Artist.findOne.mockResolvedValue(null);
    const res = await request(app).put('/api/artist/a').set('Authorization', actAs(USER)).send({ rating: 1 });
    expect(res.status).toBe(404);
  });

  it('returns 500 when saving fails', async () => {
    const artist = existing();
    artist.save.mockRejectedValue(new Error('db down'));
    Artist.findOne.mockResolvedValue(artist);
    const res = await request(app).put('/api/artist/a').set('Authorization', actAs(USER)).send({ rating: 1 });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error updating artist.');
  });

  it('notifies on demo account updates', async () => {
    Artist.findOne.mockResolvedValue(existing());
    await request(app).put('/api/artist/a').set('Authorization', actAs(DEMO))
      .send({ name: 'Muse', rating: 90, pinned: true, pinnedMeta: { artist: true } });
    expect(notifications.notifyDemoAccountChange).toHaveBeenCalledWith(
      'Artist Updated',
      expect.objectContaining({ artistName: 'Muse', rating: 90, pinned: true, artistId: 'a' }),
      expect.anything()
    );
  });
});

describe('DELETE /api/artist/:id', () => {
  it("deletes only the user's own artist", async () => {
    Artist.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const res = await request(app).delete('/api/artist/a').set('Authorization', actAs(USER));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ _id: 'a' });
    expect(Artist.deleteOne).toHaveBeenCalledWith({ _id: 'a', userId: 'user-1' });
  });

  it('404s when nothing was deleted', async () => {
    Artist.deleteOne.mockResolvedValue({ deletedCount: 0 });
    const res = await request(app).delete('/api/artist/a').set('Authorization', actAs(USER));
    expect(res.status).toBe(404);
  });

  it('returns 500 on errors', async () => {
    Artist.deleteOne.mockRejectedValue(new Error('db down'));
    const res = await request(app).delete('/api/artist/a').set('Authorization', actAs(USER));
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error deleting artist.');
  });

  it('notifies on demo account deletes', async () => {
    Artist.deleteOne.mockResolvedValue({ deletedCount: 1 });
    await request(app).delete('/api/artist/a').set('Authorization', actAs(DEMO));
    expect(notifications.notifyDemoAccountChange).toHaveBeenCalledWith(
      'Artist Deleted', { artistId: 'a' }, expect.anything()
    );
  });
});

describe('static React build', () => {
  it('serves index.html for client-side routes', async () => {
    const res = await request(app).get('/some/client/route');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });
});
