import React, { Component } from 'react';
import Button from './Button';

class Auth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLogin: false,
      email: '',
      password: '',
      error: '',
      loading: false,
    };
  }

  handleInputChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
      error: '',
    });
  };

  toggleMode = () => {
    this.setState({
      isLogin: !this.state.isLogin,
      error: '',
      email: '',
      password: '',
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, isLogin } = this.state;
    const { onAuthSuccess } = this.props;

    if (!email || !password) {
      this.setState({ error: 'Please fill in all fields' });
      return;
    }

    if (password.length < 6) {
      this.setState({ error: 'Password must be at least 6 characters' });
      return;
    }

    this.setState({ loading: true, error: '' });

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.setState({ loading: false });
        onAuthSuccess(data.token, data.user);
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.setState({
        error: error.message || 'An error occurred. Please try again.',
        loading: false,
      });
    }
  };

  render() {
    const { isLogin, email, password, error, loading } = this.state;

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>{isLogin ? 'Login' : 'Register'}</h2>
          
          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={this.handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={this.handleInputChange}
                placeholder="Enter your email"
                style={styles.input}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={this.handleInputChange}
                placeholder="Enter your password"
                style={styles.input}
                disabled={loading}
                required
                minLength="6"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            <Button
              type="submit"
              className="auth-button"
              disabled={loading}
              style={styles.button}
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
            </Button>
          </form>

          <div style={styles.toggle}>
            <span>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              type="button"
              onClick={this.toggleMode}
              style={styles.toggleButton}
              disabled={loading}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    marginBottom: '30px',
    textAlign: 'center',
    color: '#333',
    fontSize: '28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#555',
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  toggle: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#4CAF50',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
    padding: '0',
    marginLeft: '5px',
    marginTop: '15px',
  },
};

export default Auth;
