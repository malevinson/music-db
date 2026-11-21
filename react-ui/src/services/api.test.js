import { buildRequest } from './api';

const jsonResponse = (body, status = 200) => ({
  status,
  ok: status >= 200 && status < 300,
  json: () => Promise.resolve(body),
});

describe('buildRequest', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('GETs a relative /api URL by default', async () => {
    await buildRequest('/artists');
    expect(fetchMock).toHaveBeenCalledWith('/api/artists', { headers: {}, method: 'GET' });
  });

  it('adds a Bearer token when one is given', async () => {
    await buildRequest('/artists', 'GET', null, 'abc123');
    const [, params] = fetchMock.mock.calls[0];
    expect(params.headers.Authorization).toBe('Bearer abc123');
  });

  it.each(['POST', 'PUT'])('sends a JSON body for %s', async (method) => {
    await buildRequest('/artist/1', method, { name: 'Muse' }, 't');
    const [url, params] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/artist/1');
    expect(params.method).toBe(method);
    expect(params.body).toBe(JSON.stringify({ name: 'Muse' }));
    expect(params.headers['content-type']).toBe('application/json');
  });

  it('does not send a body for DELETE', async () => {
    await buildRequest('/artist/1', 'DELETE', { ignored: true }, 't');
    const [, params] = fetchMock.mock.calls[0];
    expect(params.body).toBeUndefined();
    expect(params.headers['content-type']).toBeUndefined();
  });

  it('resolves with the parsed JSON', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ _id: '1' }]));
    await expect(buildRequest('/artists')).resolves.toEqual([{ _id: '1' }]);
  });

  it('logs out and rejects on 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Token expired.' }, 401));
    const onLogout = vi.fn();
    const showFlashMsg = vi.fn();

    await expect(buildRequest('/artists', 'GET', null, 't', onLogout, showFlashMsg))
      .rejects.toThrow('Session expired. Please login again.');
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(showFlashMsg).toHaveBeenCalledWith('Error: Session expired. Please login again.');
  });

  it('rejects and flashes the server error message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Error creating artist.' }, 500));
    const showFlashMsg = vi.fn();

    await expect(buildRequest('/artists', 'POST', {}, 't', null, showFlashMsg))
      .rejects.toThrow('Error creating artist.');
    expect(showFlashMsg).toHaveBeenCalledWith('Error: Error creating artist.');
  });

  it('rejects on network failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));
    const showFlashMsg = vi.fn();
    await expect(buildRequest('/artists', 'GET', null, null, null, showFlashMsg)).rejects.toThrow('Failed to fetch');
    expect(showFlashMsg).toHaveBeenCalledWith('Error: Failed to fetch');
  });

  it('works without callbacks', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));
    await expect(buildRequest('/artists')).rejects.toThrow();
  });
});

describe('buildRequest with REACT_APP_API_URL', () => {
  it('prefixes the configured API host', async () => {
    vi.resetModules();
    vi.stubEnv('REACT_APP_API_URL', 'https://example.netlify.app');
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({})));
    vi.stubGlobal('fetch', fetchMock);

    const { buildRequest: build } = await import('./api');
    await build('/artists');
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.netlify.app/api/artists');
    vi.unstubAllEnvs();
  });
});
