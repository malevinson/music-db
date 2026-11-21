const wrapped = vi.hoisted(() => vi.fn());
const serverless = vi.hoisted(() => vi.fn(() => wrapped));
vi.mock('serverless-http', () => ({ default: serverless }));
vi.mock('../../server/index.js', () => ({ default: 'express-app' }));

const { handler } = await import('./api.js');
const wrapCalls = [...serverless.mock.calls]; // captured before clearMocks resets history

describe('Netlify api function', () => {
  it('wraps the Express app with serverless-http', () => {
    expect(wrapCalls).toEqual([['express-app', { binary: ['image/*', 'application/json'] }]]);
  });

  it('passes events through to the app', async () => {
    wrapped.mockResolvedValue({ statusCode: 200, body: '{"ok":true}' });
    const event = { path: '/api/artists', httpMethod: 'GET' };
    const context = {};
    await expect(handler(event, context)).resolves.toEqual({ statusCode: 200, body: '{"ok":true}' });
    expect(wrapped).toHaveBeenCalledWith(event, context);
  });

  it('turns crashes into a JSON 500', async () => {
    wrapped.mockRejectedValue(new Error('kaboom'));
    await expect(handler({}, {})).resolves.toEqual({
      statusCode: 500,
      body: JSON.stringify({ error: 'kaboom' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('uses a generic message when the error has none', async () => {
    wrapped.mockRejectedValue(new Error(''));
    const res = await handler({}, {});
    expect(JSON.parse(res.body)).toEqual({ error: 'Internal server error' });
  });
});
