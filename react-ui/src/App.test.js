import React from 'react';
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react';
import App from './App';

// App.js chains `.then()` onto buildRequest without a `.catch()`, so a failed request (which
// buildRequest already reports via the flash message / logout) also leaves an unhandled
// rejection. Mark those derived promises as handled so they don't fail the run.
vi.mock('./services/api', async (importOriginal) => {
  const actual = await importOriginal();
  const handled = (p) => {
    p.catch(() => {});
    return { then: (onOk, onErr) => handled(p.then(onOk, onErr)), catch: (onErr) => handled(p.catch(onErr)) };
  };
  return { ...actual, buildRequest: (...args) => handled(actual.buildRequest(...args)) };
});

// ---- helpers -------------------------------------------------------------

const json = (body, status = 200) => ({ status, ok: status < 400, json: () => Promise.resolve(body) });

const makeArtists = () => [
  { _id: 'a', name: 'Muse', rating: 80, createdAt: '2024-01-02', image: 'm.jpg', pinned: false,
    pinnedMeta: { artist: true, radio: false, album: false } },
  { _id: 'b', name: 'Blur', rating: 90, createdAt: '2024-01-03', image: 'b.jpg', pinned: true,
    pinnedMeta: { artist: false, radio: true, album: false } },
];

// Route fetch calls by "METHOD /path"; unknown routes fail loudly.
const installFetch = (routes) => {
  const fetchMock = vi.fn((url, opts = {}) => {
    const key = `${opts.method || 'GET'} ${url}`;
    const handler = routes[key];
    if (!handler) return Promise.reject(new Error(`Unexpected fetch: ${key}`));
    return Promise.resolve(typeof handler === 'function' ? handler(url, opts) : handler);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const login = (user = { id: 'u1', email: 'me@x.com' }, token = 'tok') => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

const renderLoggedIn = async ({ artists = makeArtists(), user, routes = {} } = {}) => {
  login(user);
  const fetchMock = installFetch({ 'GET /api/artists': json(artists), ...routes });
  const ref = React.createRef();
  const utils = render(<App ref={ref} />);
  if (artists.length) await screen.findAllByText(artists[0].name);
  else await screen.findByText('Add some artists to get started');
  return { ...utils, fetchMock, ref };
};

const listNames = (container) =>
  Array.from(container.querySelectorAll('.artist .name')).map((n) => n.textContent);
const queueNames = (container) =>
  Array.from(container.querySelectorAll('.pinned-section .relative-wrapper > .name')).map((n) => n.textContent);
const card = (container, name) =>
  Array.from(container.querySelectorAll('.artist')).find((el) => el.querySelector('.name').textContent === name);
const bodyOf = (fetchMock, key) => {
  const call = fetchMock.mock.calls.find(([url, opts = {}]) => `${opts.method || 'GET'} ${url}` === key);
  return call && JSON.parse(call[1].body);
};
const type = (placeholder, value, name) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value, ...(name ? { name } : {}) } });

// ---- tests ---------------------------------------------------------------

describe('App: authentication', () => {
  it('shows the auth screen when there is no saved session', () => {
    installFetch({});
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
  });

  it('restores a saved session and loads that user\'s artists', async () => {
    const { fetchMock, container } = await renderLoggedIn();
    expect(fetchMock).toHaveBeenCalledWith('/api/artists', {
      method: 'GET',
      headers: { Authorization: 'Bearer tok' },
    });
    expect(listNames(container).sort()).toEqual(['Blur', 'Muse']);
    expect(queueNames(container)).toEqual(['Blur']); // only Blur is pinned
  });

  it('logs out if the saved user is corrupt', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', '{not json');
    installFetch({});
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logs out when the token is rejected (401)', async () => {
    login();
    installFetch({ 'GET /api/artists': json({ error: 'Token expired.' }, 401) });
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('loads artists after logging in through the auth screen', async () => {
    const user = { id: 'u1', email: 'me@x.com' };
    installFetch({
      'POST /api/auth/login': json({ token: 'new-tok', user }),
      'GET /api/artists': json(makeArtists()),
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    type('Enter your email', 'me@x.com', 'email');
    type('Enter your password', 'secret1', 'password');
    fireEvent.submit(screen.getByPlaceholderText('Enter your email').closest('form'));

    expect(await screen.findByText('Muse')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout \(me@x.com\)/ })).toBeInTheDocument();
  });

  it('logout clears the session and returns to the auth screen', async () => {
    await renderLoggedIn();
    fireEvent.click(screen.getByRole('button', { name: /Logout/ }));
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('App: adding artists', () => {
  const addArtist = (name, rating) => {
    type('The Beatles', name, 'artist');
    type('35', rating, 'rating');
    fireEvent.click(screen.getByRole('button', { name: 'Add Artist' }));
  };

  it('title-cases the name, posts it, appends it and clears the field', async () => {
    const { fetchMock, container } = await renderLoggedIn({
      routes: {
        'POST /api/artists': (url, opts) =>
          json({ artist: { _id: 'c', ...JSON.parse(opts.body), image: 'c.jpg', pinnedMeta: {} } }),
      },
    });
    addArtist('  belle and sebastian', '77');

    expect(await screen.findByText('Artist "Belle and Sebastian" added!')).toBeInTheDocument();
    expect(bodyOf(fetchMock, 'POST /api/artists')).toEqual({ name: 'Belle and Sebastian', rating: 77 });
    expect(listNames(container)).toContain('Belle and Sebastian');
    expect(screen.getByPlaceholderText('The Beatles')).toHaveValue('');
  });

  it('rejects names shorter than 2 characters', async () => {
    const { fetchMock } = await renderLoggedIn();
    addArtist('x', '50');
    expect(screen.getByText('Error: Enter at least 2 characters in the artist field')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the initial load
  });

  it.each(['0', '101', '-5'])('rejects rating %s', async (rating) => {
    const { fetchMock } = await renderLoggedIn();
    addArtist('Radiohead', rating);
    expect(screen.getByText('Error: Invalid rating')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects duplicates (after title-casing)', async () => {
    const { fetchMock } = await renderLoggedIn();
    addArtist('muse', '50');
    expect(screen.getByText('Error: Duplicate artist, try again')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows the server error if creation fails', async () => {
    const { container } = await renderLoggedIn({
      routes: { 'POST /api/artists': json({ error: 'Error creating artist.' }, 500) },
    });
    addArtist('Radiohead', '50');
    expect(await screen.findByText('Error: Error creating artist.')).toBeInTheDocument();
    expect(listNames(container)).not.toContain('Radiohead');
  });
});

describe('App: editing and deleting', () => {
  it('edits a rating inline and saves it', async () => {
    const { fetchMock, container } = await renderLoggedIn({
      routes: { 'PUT /api/artist/a': json({ message: 'Artist updated!' }) },
    });
    fireEvent.click(within(card(container, 'Muse')).getByText('80'));
    const box = within(card(container, 'Muse')).getByRole('textbox');
    expect(box).toHaveValue('80');

    fireEvent.change(box, { target: { name: 'edit', value: '85' } });
    fireEvent.click(within(card(container, 'Muse')).getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Artist "Muse" updated!')).toBeInTheDocument();
    expect(bodyOf(fetchMock, 'PUT /api/artist/a')).toMatchObject({ _id: 'a', name: 'Muse', rating: '85' });
    expect(within(card(container, 'Muse')).getByText('85')).toHaveClass('artist-rating');
  });

  it('closes the editor without a request when the rating is unchanged', async () => {
    const { fetchMock, container } = await renderLoggedIn();
    fetchMock.mockClear();
    fireEvent.click(within(card(container, 'Muse')).getByText('80'));
    fireEvent.click(within(card(container, 'Muse')).getByRole('button', { name: 'Update' }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(within(card(container, 'Muse')).queryByRole('textbox')).toBeNull();
  });

  it('deletes an artist and removes it from the queue too', async () => {
    const { fetchMock, container } = await renderLoggedIn({
      routes: { 'DELETE /api/artist/b': json({ _id: 'b' }) },
    });
    expect(queueNames(container)).toEqual(['Blur']);
    fireEvent.click(within(card(container, 'Blur')).getByTitle('Remove artist'));

    expect(await screen.findByText('Artist "Blur" deleted!')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/artist/b', expect.objectContaining({ method: 'DELETE' }));
    expect(listNames(container)).toEqual(['Muse']);
    expect(queueNames(container)).toEqual([]);
  });

  it('keeps the artist if the delete fails', async () => {
    const { container } = await renderLoggedIn({
      routes: { 'DELETE /api/artist/a': json({ error: 'Artist not found or access denied.' }, 404) },
    });
    fireEvent.click(within(card(container, 'Muse')).getByTitle('Remove artist'));
    expect(await screen.findByText('Error: Artist not found or access denied.')).toBeInTheDocument();
    expect(listNames(container)).toContain('Muse');
  });

  describe('demo account guard', () => {
    const demo = { id: 'd', email: 'demo@test.com' };
    const many = (n) => Array.from({ length: n }, (_, i) => ({
      _id: `id${i}`, name: `Band ${i}`, rating: i + 1, pinnedMeta: {},
    }));

    it('blocks deleting when the demo account has 10 or fewer artists', async () => {
      const { fetchMock, container } = await renderLoggedIn({ user: demo, artists: many(10) });
      fireEvent.click(within(card(container, 'Band 0')).getByTitle('Remove artist'));
      expect(screen.getByText('Demo account cannot have less than 10 artists')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('allows deleting when the demo account has more than 10', async () => {
      const { fetchMock, container } = await renderLoggedIn({
        user: demo,
        artists: many(11),
        routes: { 'DELETE /api/artist/id0': json({ _id: 'id0' }) },
      });
      fireEvent.click(within(card(container, 'Band 0')).getByTitle('Remove artist'));
      expect(await screen.findByText('Artist "Band 0" deleted!')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});

describe('App: queue (pinning)', () => {
  it('pins an artist: adds it to the queue and saves pinned=true', async () => {
    const { fetchMock, container } = await renderLoggedIn({
      routes: { 'PUT /api/artist/a': json({ message: 'ok' }) },
    });
    fireEvent.click(within(card(container, 'Muse')).getByTitle('Add to queue'));

    expect(queueNames(container)).toEqual(['Blur', 'Muse']);
    expect(bodyOf(fetchMock, 'PUT /api/artist/a')).toMatchObject({ _id: 'a', pinned: true });
    expect(within(card(container, 'Muse')).queryByTitle('Add to queue')).toBeNull();
  });

  it('unpins an artist: removes it from the queue and saves pinned=false', async () => {
    const { fetchMock, container } = await renderLoggedIn({
      routes: { 'PUT /api/artist/b': json({ message: 'ok' }) },
    });
    const pinnedCard = container.querySelector('.pinned-section .relative-wrapper');
    fireEvent.click(within(pinnedCard).getByTitle('unpin').querySelector('img'));

    expect(queueNames(container)).toEqual([]);
    expect(screen.getByText('Pin an artist to start your queue')).toBeInTheDocument();
    expect(bodyOf(fetchMock, 'PUT /api/artist/b')).toMatchObject({ _id: 'b', pinned: false });
  });

  it('toggles Songs/Mix/Albums and saves the pinned meta', async () => {
    const { fetchMock, container } = await renderLoggedIn({
      routes: { 'PUT /api/artist/b': json({ message: 'ok' }) },
    });
    const pinnedCard = container.querySelector('.pinned-section .relative-wrapper');
    const [songs, , albums] = within(pinnedCard).getAllByRole('checkbox');

    fireEvent.click(albums);
    expect(albums).toBeChecked();
    expect(bodyOf(fetchMock, 'PUT /api/artist/b').pinnedMeta).toEqual({ artist: false, radio: true, album: true });

    fetchMock.mockClear();
    fireEvent.click(songs);
    expect(songs).toBeChecked();
    expect(bodyOf(fetchMock, 'PUT /api/artist/b').pinnedMeta).toMatchObject({ artist: true });
  });

  it('reorders the queue', async () => {
    const artists = makeArtists();
    artists[0].pinned = true;
    const { container, ref } = await renderLoggedIn({ artists });
    expect(queueNames(container)).toEqual(['Muse', 'Blur']);

    act(() => ref.current.handleReorderPinned(0, 1));
    expect(queueNames(container)).toEqual(['Blur', 'Muse']);
  });

  it('ignores out-of-range reorders', async () => {
    const { container, ref } = await renderLoggedIn();
    act(() => ref.current.handleReorderPinned(0, 5));
    act(() => ref.current.handleReorderPinned(-1, 0));
    expect(queueNames(container)).toEqual(['Blur']);
  });

  it('switches the music service used for queue links', async () => {
    const { container } = await renderLoggedIn();
    const link = () => container.querySelector('.pinned-section .external-link');
    expect(link()).toHaveAttribute('href', 'https://music.youtube.com/search?q=Blur');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'spotify' } });
    expect(link()).toHaveAttribute('href', 'https://open.spotify.com/search/Blur');
  });
});

describe('App: sorting and filtering', () => {
  it('sorts by rating ascending by default, and flips on a second click', async () => {
    const { container } = await renderLoggedIn();
    expect(listNames(container)).toEqual(['Muse', 'Blur']);
    fireEvent.click(screen.getByRole('button', { name: 'Rating' }));
    expect(listNames(container)).toEqual(['Blur', 'Muse']);
  });

  it('switches sort field', async () => {
    const { container } = await renderLoggedIn();
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(screen.getByRole('button', { name: 'Name' })).toHaveClass('active');
    expect(listNames(container)).toEqual(['Blur', 'Muse']);
  });

  it('filters the list', async () => {
    const { container } = await renderLoggedIn();
    type('Filter', 'mu', 'Filter');
    expect(listNames(container)).toEqual(['Muse']);
  });
});

describe('App: flash messages', () => {
  it('hide again after 2 seconds', async () => {
    await renderLoggedIn();
    vi.useFakeTimers();
    type('The Beatles', 'x', 'artist');
    fireEvent.click(screen.getByRole('button', { name: 'Add Artist' }));
    expect(screen.getByText(/Enter at least 2 characters/)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText(/Enter at least 2 characters/)).toBeNull();
  });
});

describe('App: focus timer', () => {
  const startButton = () => screen.getByRole('button', { name: /^Start\s*timer$/ });
  const stopButton = () => screen.getByRole('button', { name: /^Stop\s*timer$/ });

  // favicon.js remembers the page title from when it first loaded; only the countdown prefix matters here.
  // Advance one 100ms interval tick per act(), like a real browser where each tick's setState lands immediately.
  const tick = (ms) => {
    for (let t = 0; t < ms; t += 100) act(() => { vi.advanceTimersByTime(100); });
  };
  const tabCountdown = () => document.title.split('–')[0].trim();
  const hasCountdown = () => document.title.includes('–');

  it('requires a number of minutes', async () => {
    await renderLoggedIn();
    type('25', '', 'timer');
    fireEvent.click(startButton());
    expect(screen.getByText('Error: enter a number')).toBeInTheDocument();
  });

  it.each(['0', '-1', 'abc'])('rejects an invalid duration (%s)', async (value) => {
    await renderLoggedIn();
    type('25', value, 'timer');
    fireEvent.click(startButton());
    expect(screen.getByText('Error: enter a valid number greater than 0')).toBeInTheDocument();
    expect(startButton()).toBeInTheDocument();
  });

  it('counts down, updates the tab, notifies at zero, and resets on stop', async () => {
    const { container } = await renderLoggedIn();
    vi.useFakeTimers();
    type('25', '1', 'timer');
    fireEvent.click(startButton());
    expect(stopButton()).toBeInTheDocument();

    tick(15000);
    expect(container.querySelector('.stopwatch')).toHaveTextContent('0:00:45.');
    expect(tabCountdown()).toBe('0:45');

    tick(46000);
    expect(container.querySelector('.stopwatch')).toHaveTextContent('0:00:00.0');
    expect(tabCountdown()).toBe("⏰ Time's up!");
    expect(Notification).toHaveBeenCalledTimes(1);
    expect(Notification).toHaveBeenCalledWith('Timer Complete', { body: 'Timer is up!!!!', requireInteraction: true });

    // Only one notification even though the timer keeps ticking at zero
    tick(5000);
    expect(Notification).toHaveBeenCalledTimes(1);

    fireEvent.click(stopButton());
    expect(startButton()).toBeInTheDocument();
    expect(hasCountdown()).toBe(false);

    // Stopped timer no longer ticks
    tick(5000);
    expect(hasCountdown()).toBe(false);
  });

  it('supports fractional minutes', async () => {
    await renderLoggedIn();
    vi.useFakeTimers();
    type('25', '0.5', 'timer');
    fireEvent.click(startButton());
    tick(200);
    expect(tabCountdown()).toBe('0:30');
  });

  it('asks for notification permission first if not yet decided', async () => {
    Notification.permission = 'default';
    await renderLoggedIn();
    vi.useFakeTimers();
    type('25', '0.01', 'timer');
    fireEvent.click(startButton());
    tick(1000);
    await act(async () => {});

    expect(Notification.requestPermission).toHaveBeenCalled();
    expect(Notification).toHaveBeenCalledWith('Timer Complete', expect.anything());
  });

  it('does not notify when permission was denied', async () => {
    Notification.permission = 'denied';
    await renderLoggedIn();
    vi.useFakeTimers();
    type('25', '0.01', 'timer');
    fireEvent.click(startButton());
    tick(1000);
    expect(Notification).not.toHaveBeenCalled();
  });
});
