import jwt from 'jsonwebtoken';

vi.mock('../../User.js', () => ({ default: { findById: vi.fn() } }));

const { default: User } = await import('../../User.js');
const { authenticate, JWT_SECRET } = await import('./auth.js');

const mockRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};
const userLookup = (user) => User.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(user) });

describe('authenticate middleware', () => {
  it('uses JWT_SECRET from the environment', () => {
    expect(JWT_SECRET).toBe('test-jwt-secret');
  });

  it('rejects requests without an Authorization header', async () => {
    const res = mockRes();
    const next = vi.fn();
    await authenticate({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided. Authorization header required.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects non-Bearer schemes', async () => {
    const res = mockRes();
    await authenticate({ headers: { authorization: 'Basic abc' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects malformed tokens', async () => {
    const res = mockRes();
    await authenticate({ headers: { authorization: 'Bearer not-a-jwt' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
  });

  it('rejects tokens signed with another secret', async () => {
    const token = jwt.sign({ userId: 'u1' }, 'some-other-secret');
    const res = mockRes();
    await authenticate({ headers: { authorization: `Bearer ${token}` } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
  });

  it('rejects expired tokens', async () => {
    const token = jwt.sign({ userId: 'u1', exp: Math.floor(Date.now() / 1000) - 60 }, JWT_SECRET);
    const res = mockRes();
    await authenticate({ headers: { authorization: `Bearer ${token}` } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired.' });
  });

  it('rejects tokens for users that no longer exist', async () => {
    userLookup(null);
    const token = jwt.sign({ userId: 'gone' }, JWT_SECRET);
    const res = mockRes();
    await authenticate({ headers: { authorization: `Bearer ${token}` } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found.' });
  });

  it('attaches the user (without password) and calls next', async () => {
    const user = { _id: 'u1', email: 'a@b.com' };
    const select = vi.fn().mockResolvedValue(user);
    User.findById.mockReturnValue({ select });
    const token = jwt.sign({ userId: 'u1' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = vi.fn();

    await authenticate(req, mockRes(), next);

    expect(User.findById).toHaveBeenCalledWith('u1');
    expect(select).toHaveBeenCalledWith('-password');
    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 500 on unexpected errors', async () => {
    User.findById.mockReturnValue({ select: vi.fn().mockRejectedValue(new Error('db down')) });
    const token = jwt.sign({ userId: 'u1' }, JWT_SECRET);
    const res = mockRes();
    await authenticate({ headers: { authorization: `Bearer ${token}` } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication error.' });
  });
});
