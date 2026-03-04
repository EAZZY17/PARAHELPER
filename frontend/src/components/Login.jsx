import React, { useState } from 'react';
import { authAPI } from '../services/api';

export default function Login({ onLogin }) {
  const [badge, setBadge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(badge.trim());
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your badge number.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="18" width="32" height="12" rx="2" fill="#e53e3e"/>
            <rect x="18" y="8" width="12" height="32" rx="2" fill="#e53e3e"/>
          </svg>
          <span style={styles.logoText}>ParaHelper</span>
        </div>
        <p style={styles.tagline}>
          Sign in with your badge ID to access your AI shift companion.
        </p>
      </div>
      <div style={styles.rightPanel}>
        <h1 style={styles.title}>Sign in</h1>
        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Badge ID</label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="e.g. S-5591"
            style={styles.input}
            autoFocus
            disabled={loading}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading || !badge.trim()} style={styles.button}>
            {loading ? 'Signing in...' : 'Start Shift'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #0f2744 100%)'
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px',
    borderRight: '1px solid rgba(255,255,255,0.06)'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px'
  },
  logoText: { fontSize: '28px', fontWeight: 700, color: '#fff' },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '18px',
    lineHeight: 1.6,
    maxWidth: '360px'
  },
  rightPanel: {
    width: '420px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px'
  },
  title: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '32px'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    fontWeight: 600
  },
  input: {
    padding: '14px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.2)',
    color: '#fff',
    fontSize: '16px'
  },
  error: { color: '#fc8181', fontSize: '14px', margin: 0 },
  button: {
    padding: '14px 24px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #e53e3e, #c53030)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px'
  }
};
