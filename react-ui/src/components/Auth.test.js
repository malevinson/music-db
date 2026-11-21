import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auth from './Auth';

const response = (body, ok = true) => ({ ok, json: () => Promise.resolve(body) });

const fill = (email, password) => {
  fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { name: 'email', value: email } });
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { name: 'password', value: password } });
};
const submit = () => fireEvent.submit(screen.getByPlaceholderText('Enter your email').closest('form'));

describe('Auth', () => {
  let fetchMock;
  let onAuthSuccess;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    onAuthSuccess = vi.fn();
  });

  const renderAuth = () => render(<Auth onAuthSuccess={onAuthSuccess} />);

  it('starts in Register mode with the demo option', () => {
    renderAuth();
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Demo Account' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('switches to Login mode, clearing the form and hiding the demo option', () => {
    renderAuth();
    fill('a@b.com', 'secret1');
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Try Demo Account' })).toBeNull();
    expect(screen.getByPlaceholderText('Enter your password')).toHaveAttribute('autocomplete', 'current-password');

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
  });

  it('requires both fields', () => {
    renderAuth();
    fill('a@b.com', '');
    submit();
    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires a 6+ character password', () => {
    renderAuth();
    fill('a@b.com', '12345');
    submit();
    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the error once the user types', () => {
    renderAuth();
    submit();
    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    fill('a', '');
    expect(screen.queryByText('Please fill in all fields')).toBeNull();
  });

  it('registers, stores the session and reports success', async () => {
    const user = { id: 'u1', email: 'a@b.com' };
    fetchMock.mockResolvedValue(response({ token: 'tok', user }));
    renderAuth();
    fill('a@b.com', 'secret1');
    submit();

    await waitFor(() => expect(onAuthSuccess).toHaveBeenCalledWith('tok', user));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'secret1' }),
    });
    expect(localStorage.getItem('token')).toBe('tok');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(user);
  });

  it('logs in against the login endpoint', async () => {
    fetchMock.mockResolvedValue(response({ token: 'tok', user: { email: 'a@b.com' } }));
    renderAuth();
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    fill('a@b.com', 'secret1');
    submit();
    await waitFor(() => expect(onAuthSuccess).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/login');
  });

  it('shows Loading... and disables the form while waiting', async () => {
    let resolve;
    fetchMock.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderAuth();
    fill('a@b.com', 'secret1');
    submit();

    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
    expect(screen.getByPlaceholderText('Enter your email')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Try Demo Account' })).toBeDisabled();

    resolve(response({ token: 't', user: {} }));
    await waitFor(() => expect(onAuthSuccess).toHaveBeenCalled());
  });

  it('shows the server error message', async () => {
    fetchMock.mockResolvedValue(response({ error: 'User with this email already exists.' }, false));
    renderAuth();
    fill('a@b.com', 'secret1');
    submit();
    expect(await screen.findByText('User with this email already exists.')).toBeInTheDocument();
    expect(onAuthSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Register' })).not.toBeDisabled();
  });

  it('falls back to a generic error when the server sends none', async () => {
    fetchMock.mockResolvedValue(response({}, false));
    renderAuth();
    fill('a@b.com', 'secret1');
    submit();
    expect(await screen.findByText('Authentication failed')).toBeInTheDocument();
  });

  it('errors when the server returns no token', async () => {
    fetchMock.mockResolvedValue(response({ user: {} }));
    renderAuth();
    fill('a@b.com', 'secret1');
    submit();
    expect(await screen.findByText('No token received from server')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('shows network errors', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'));
    renderAuth();
    fill('a@b.com', 'secret1');
    submit();
    expect(await screen.findByText('Failed to fetch')).toBeInTheDocument();
  });

  describe('demo login', () => {
    it('logs in with the demo credentials', async () => {
      const user = { email: 'demo@test.com' };
      fetchMock.mockResolvedValue(response({ token: 'demo-tok', user }));
      renderAuth();
      fireEvent.click(screen.getByRole('button', { name: 'Try Demo Account' }));

      await waitFor(() => expect(onAuthSuccess).toHaveBeenCalledWith('demo-tok', user));
      expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'demo@test.com', password: 'demo@test.com' }),
      }));
      expect(localStorage.getItem('token')).toBe('demo-tok');
    });

    it('shows an error when demo login fails', async () => {
      fetchMock.mockResolvedValue(response({}, false));
      renderAuth();
      fireEvent.click(screen.getByRole('button', { name: 'Try Demo Account' }));
      expect(await screen.findByText('Demo login failed')).toBeInTheDocument();
    });

    it('shows an error when demo login returns no token', async () => {
      fetchMock.mockResolvedValue(response({}));
      renderAuth();
      fireEvent.click(screen.getByRole('button', { name: 'Try Demo Account' }));
      expect(await screen.findByText('No token received from server')).toBeInTheDocument();
    });
  });

  it('honors REACT_APP_API_URL', async () => {
    vi.stubEnv('REACT_APP_API_URL', 'https://api.example.com');
    fetchMock.mockResolvedValue(response({ token: 't', user: {} }));
    renderAuth();
    fill('a@b.com', 'secret1');
    submit();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/api/auth/register');
    vi.unstubAllEnvs();
  });
});
