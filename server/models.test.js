import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Artist from '../Artist.js';
import User from '../User.js';

// Run a document's pre-save middleware without a database.
const runPreSave = (doc) =>
  new Promise((resolve, reject) =>
    doc.constructor.schema.s.hooks.execPre('save', doc, [], (err) => (err ? reject(err) : resolve()))
  );

describe('Artist model', () => {
  const userId = new mongoose.Types.ObjectId();

  it('applies defaults', () => {
    const artist = new Artist({ name: 'Muse', userId });
    expect(artist.rating).toBe(100);
    expect(artist.createdAt).toBeInstanceOf(Date);
    expect(artist.pinnedMeta.toObject()).toEqual({
      artist: true, radio: false, album: false, pandora: false, spotify: false, googleMusic: false, input: '',
    });
    expect(artist.validateSync()).toBeUndefined();
  });

  it('requires a userId', () => {
    const err = new Artist({ name: 'Muse' }).validateSync();
    expect(err.errors.userId.kind).toBe('required');
  });

  it('casts ratings to numbers and rejects non-numbers', () => {
    expect(new Artist({ name: 'A', userId, rating: '42' }).rating).toBe(42);
    const err = new Artist({ name: 'A', userId, rating: 'lots' }).validateSync();
    expect(err.errors.rating).toBeDefined();
  });

  it('keeps an explicit rating', () => {
    expect(new Artist({ name: 'A', userId, rating: 7 }).rating).toBe(7);
  });
});

describe('User model', () => {
  it('lowercases and trims the email', () => {
    const user = new User({ email: '  Me@Example.COM ', password: 'secret1' });
    expect(user.email).toBe('me@example.com');
  });

  it('requires email and password', () => {
    const err = new User({}).validateSync();
    expect(err.errors.email.kind).toBe('required');
    expect(err.errors.password.kind).toBe('required');
  });

  it('enforces a 6 character minimum password', () => {
    const err = new User({ email: 'a@b.com', password: '12345' }).validateSync();
    expect(err.errors.password.kind).toBe('minlength');
  });

  it('defaults createdAt', () => {
    expect(new User({ email: 'a@b.com', password: 'secret1' }).createdAt).toBeInstanceOf(Date);
  });

  it('marks email as unique', () => {
    expect(User.schema.path('email').options.unique).toBe(true);
  });

  it('hashes a new password before saving', async () => {
    const user = new User({ email: 'a@b.com', password: 'secret1' });
    await runPreSave(user);
    expect(user.password).not.toBe('secret1');
    expect(user.password).toMatch(/^\$2[aby]\$10\$/);
    expect(await bcrypt.compare('secret1', user.password)).toBe(true);
  });

  it('does not re-hash an unchanged password', async () => {
    const hash = await bcrypt.hash('secret1', 4);
    const user = User.hydrate({ _id: new mongoose.Types.ObjectId(), email: 'a@b.com', password: hash });
    await runPreSave(user);
    expect(user.password).toBe(hash);
  });

  it('passes hashing errors to save', async () => {
    vi.spyOn(bcrypt, 'genSalt').mockRejectedValueOnce(new Error('boom'));
    const user = new User({ email: 'a@b.com', password: 'secret1' });
    await expect(runPreSave(user)).rejects.toThrow('boom');
  });

  it('comparePassword checks against the stored hash', async () => {
    const user = new User({ email: 'a@b.com', password: await bcrypt.hash('secret1', 4) });
    await expect(user.comparePassword('secret1')).resolves.toBe(true);
    await expect(user.comparePassword('wrong')).resolves.toBe(false);
  });
});
