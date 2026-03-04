import React, { useState } from 'react';
import { authAPI } from '../services/api';
import fireflyVideo from '../assets/Firefly 644697.mp4';

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
        <video
          src={fireflyVideo}
          autoPlay
          loop
          muted
          playsInline
          style={styles.video}
        />
        <div style={styles.videoOverlay} />
        <div style={styles.leftContent}>
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
      </div>
      <div style={styles.rightPanel}>
        <div id="login-container" style={styles.idContainer}>
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
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0a1628'
  },
  leftPanel: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.85) 0%, rgba(10, 22, 40, 0.6) 50%, rgba(13, 31, 60, 0.7) 100%)',
    pointerEvents: 'none'
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    padding: '60px',
    maxWidth: '420px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px'
  },
  logoText: { fontSize: '28px', fontWeight: 700, color: '#fff' },
  tagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '18px',
    lineHeight: 1.6
  },
  rightPanel: {
    width: 'min(460px, 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 100%)'
  },
  idContainer: {
    width: '100%',
    maxWidth: '360px',
    padding: '40px 36px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
  },
  title: {
    color: '#fff',
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '28px',
    letterSpacing: '-0.02em'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.02em'
  },
  input: {
    padding: '14px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: '16px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none'
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
    marginTop: '8px',
    boxShadow: '0 4px 14px rgba(229, 62, 62, 0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s'
  }
};
