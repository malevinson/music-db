import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../utils/notifications.js', () => ({
  notifyNewUser: vi.fn(() => Promise.resolve()),
  getIpInfo: vi.fn(() => Promise.resolve({ ip: '1.2.3.4', location: 'Somewhere' })),
}));

vi.mock('../../User.js', () => {
  const User = vi.fn(function (data) {
    Object.assign(this, data);
    this._id = 'new-user-id';
    this.save = User.saveMock;
  });
  User.saveMock = vi.fn();
  User.findOne = vi.fn();
  User.findById = vi.fn();
  return { default: User };
});

const { default: User } = await import('../../User.js');
const notifications = await import('../utils/notifications.js');
const { default: authRoutes } = await import('./auth.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const NINETY_DAYS = 90 * 24 * 60 * 60;

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    User.findOne.mockResolvedValue(null);
    User.saveMock.mockResolvedValue();
  });

  it.each([
    [{ password: 'secret1' }],
    [{ email: 'a@b.com' }],
    [{}],
  ])('requires email and password (%o)', async (body) => {
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email and password are required.');
  });

  it('rejects short passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Password must be at least 6 characters.');
  });

  it('rejects an email that is already registered', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing' });
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'secret1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User with this email already exists.');
    expect(User.saveMock).not.toHaveBeenCalled();
  });

  it('creates the user and returns a 90-day token', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'secret1' });

    expect(res.status).toBe(201);
    expect(User).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret1' });
    expect(User.saveMock).toHaveBeenCalled();
    expect(res.body.user).toEqual({ id: 'new-user-id', email: 'a@b.com' });
    expect(res.body).not.toHaveProperty('user.password');

    const payload = jwt.verify(res.body.token, 'test-jwt-secret');
    expect(payload).toMatchObject({ userId: 'new-user-id', email: 'a@b.com' });
    expect(payload.exp - payload.iat).toBe(NINETY_DAYS);
  });

  it('sends a new-user notification with location info', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'secret1' });
    expect(notifications.notifyNewUser).toHaveBeenCalledWith('a@b.com', { ip: '1.2.3.4', location: 'Somewhere' });
  });

  it('still registers if the notification fails', async () => {
    notifications.notifyNewUser.mockRejectedValueOnce(new Error('smtp down'));
    notifications.getIpInfo.mockRejectedValueOnce(new Error('lookup failed'));
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'secret1' });
    expect(res.status).toBe(201);
    expect(notifications.notifyNewUser).toHaveBeenCalledWith('a@b.com', null);
  });

  it('returns 500 when saving fails', async () => {
    User.saveMock.mockRejectedValueOnce(new Error('db down'));
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'secret1' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error creating user.');
  });
});

describe('POST /api/auth/login', () => {
  const user = { _id: 'u1', email: 'a@b.com', comparePassword: vi.fn() };

  it('requires email and password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('rejects unknown emails with a generic message', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/login').send({ email: 'x@b.com', password: 'secret1' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });

  it('rejects a wrong password with the same generic message', async () => {
    User.findOne.mockResolvedValue(user);
    user.comparePassword.mockResolvedValue(false);
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'nope123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
    expect(user.comparePassword).toHaveBeenCalledWith('nope123');
  });

  it('returns a 90-day token on success', async () => {
    User.findOne.mockResolvedValue(user);
    user.comparePassword.mockResolvedValue(true);
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'secret1' });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'u1', email: 'a@b.com' });
    const payload = jwt.verify(res.body.token, 'test-jwt-secret');
    expect(payload.userId).toBe('u1');
    expect(payload.exp - payload.iat).toBe(NINETY_DAYS);
  });

  it('returns 500 on database errors', async () => {
    User.findOne.mockRejectedValue(new Error('db down'));
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'secret1' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error during login.');
  });
});

describe('GET /api/auth/me', () => {
  it('requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user', async () => {
    User.findById.mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: 'u1', email: 'a@b.com' }) });
    const token = jwt.sign({ userId: 'u1' }, 'test-jwt-secret');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: 'u1', email: 'a@b.com' } });
  });
});
