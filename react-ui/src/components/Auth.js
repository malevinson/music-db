import React, { Component } from 'react';
import Button from './Button';
import blurredBg from '../images/blurredLoginPage.png';

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

  handleDemoLogin = async () => {
    const { onAuthSuccess } = this.props;
    this.setState({ loading: true, error: '' });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@test.com', password: 'demo@test.com' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Demo login failed');
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
      console.error('Demo login error:', error);
      this.setState({
        error: error.message || 'Failed to load demo account. Please try again.',
        loading: false,
      });
    }
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
        <div style={styles.containerBlur}></div>
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

          {!isLogin && (
            <div style={styles.demoSection}>
              <div style={styles.dividerText}>or</div>
              <Button
                type="button"
                onClick={this.handleDemoLogin}
                disabled={loading}
                style={styles.demoButton}
              >
                Try Demo Account
              </Button>
              <p style={styles.demoText}>Explore the app without signing up</p>
            </div>
          )}

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
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  containerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${blurredBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(5px)',
    zIndex: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    position: 'relative',
    zIndex: 1,
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
  demoSection: {
    marginTop: '20px',
    textAlign: 'center',
  },
  dividerText: {
    color: '#999',
    fontSize: '14px',
    margin: '20px 0',
    textAlign: 'center',
  },
  demoButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
  },
  demoText: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
};

export default Auth;
