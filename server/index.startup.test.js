import mongoose from 'mongoose';

// Module-level startup logic (Mongo URI handling, Spotify token refresh), exercised by
// re-importing server/index.js under different conditions.
const spotify = vi.hoisted(() => ({
  clientCredentialsGrant: vi.fn(),
  setAccessToken: vi.fn(),
  searchArtists: vi.fn(),
}));
vi.mock('spotify-web-api-node', () => ({ default: vi.fn(() => spotify) }));
// Re-importing the real models would re-register them with mongoose.
vi.mock('../Artist.js', () => ({ default: {} }));
vi.mock('../User.js', () => ({ default: {} }));

const loadServer = async (mongoUri) => {
  vi.resetModules();
  vi.stubEnv('MONGODB_URI', mongoUri);
  mongoose.connect.mockClear();
  return import('./index.js');
};

describe('MongoDB URI handling', () => {
  beforeEach(() => {
    spotify.clientCredentialsGrant.mockResolvedValue({ body: { access_token: 't', expires_in: 3600 } });
  });

  it.each([
    ['mongodb://host:27017', 'mongodb://host:27017/playlistq'],
    ['mongodb://host:27017?retryWrites=true', 'mongodb://host:27017/playlistq?retryWrites=true'],
    ['mongodb+srv://u:p@cluster.mongodb.net/?retryWrites=true', 'mongodb+srv://u:p@cluster.mongodb.net/?retryWrites=true'],
    ['mongodb://host:27017/playlistq', 'mongodb://host:27017/playlistq'],
  ])('%s → %s', async (input, expected) => {
    await loadServer(input);
    expect(mongoose.connect).toHaveBeenCalledWith(expected, expect.objectContaining({ dbName: 'playlistq' }));
  });

  it('logs (and does not crash on) a failed connection', async () => {
    mongoose.connect.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await loadServer('mongodb://host:27017');
    await new Promise((r) => setTimeout(r, 0));
    expect(console.error).toHaveBeenCalledWith(expect.anything(), 'ECONNREFUSED');
  });
});

describe('Spotify token', () => {
  it('logs and keeps running if the initial token request fails', async () => {
    spotify.clientCredentialsGrant.mockRejectedValue(new Error('bad credentials'));
    const { default: app } = await loadServer('mongodb://host:27017');
    await new Promise((r) => setTimeout(r, 0));
    expect(app).toBeDefined();
    expect(console.error).toHaveBeenCalledWith('Failed to obtain initial Spotify token:', expect.any(Error));
  });

  const runRefreshScenario = async (expiresIn, checkpointsMinutes) => {
    vi.useFakeTimers();
    try {
      spotify.clientCredentialsGrant.mockResolvedValue({ body: { access_token: 't', expires_in: expiresIn } });
      await loadServer('mongodb://host:27017');
      await vi.advanceTimersByTimeAsync(0);
      const counts = [spotify.clientCredentialsGrant.mock.calls.length];
      let elapsed = 0;
      for (const minute of checkpointsMinutes) {
        await vi.advanceTimersByTimeAsync((minute - elapsed) * 60 * 1000);
        elapsed = minute;
        counts.push(spotify.clientCredentialsGrant.mock.calls.length);
      }
      return counts;
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  };

  it('re-fetches a 1-hour token on every 50-minute check', async () => {
    // expiry is stored as (expires_in - 5 min) and checked with another 5 min margin → stale at 50 min
    expect(await runRefreshScenario(3600, [50, 100])).toEqual([1, 2, 3]);
  });

  it('skips the refresh while a longer-lived token is still fresh', async () => {
    // 2h token → treated as fresh for 110 min: kept at the 50 and 100 min checks, refreshed at 150
    expect(await runRefreshScenario(7200, [50, 100, 150])).toEqual([1, 1, 1, 2]);
  });

  it('logs refresh failures without throwing', async () => {
    vi.useFakeTimers();
    try {
      spotify.clientCredentialsGrant.mockResolvedValueOnce({ body: { access_token: 't', expires_in: 3600 } });
      await loadServer('mongodb://host:27017');
      await vi.advanceTimersByTimeAsync(0);
      spotify.clientCredentialsGrant.mockRejectedValue(new Error('spotify down'));
      await vi.advanceTimersByTimeAsync(50 * 60 * 1000);
      expect(console.error).toHaveBeenCalledWith('Error during auto-refresh of Spotify token:', expect.any(Error));
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
