import React, { useState } from 'react';
import { authAPI } from '../services/api';
import videoSrc from '../assets/Firefly 644697.mp4';

export default function Login({ onLogin }) {
  const [badge, setBadge] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authAPI.login(badge, pin);
      localStorage.setItem('parahelper_token', data.token);
      localStorage.setItem('parahelper_profile', JSON.stringify(data.profile));
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Left panel - Video */}
        <div style={styles.leftPanel}>
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            style={styles.video}
          />
          <div style={styles.videoOverlay} />
          <div style={styles.leftContent}>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}>
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="18" width="32" height="12" rx="2" fill="#ffffff"/>
                  <rect x="18" y="8" width="12" height="32" rx="2" fill="#ffffff"/>
                </svg>
              </div>
              <span style={styles.brandName}>ParaHelper</span>
            </div>
            <div style={styles.promoText}>
              <h2 style={styles.promoHeading}>Welcome back</h2>
              <p style={styles.promoSubtext}>
                Sign in to access your AI shift companion. Manage your EMS workflow in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Right panel - Sign in form */}
        <div id="signin" style={styles.rightPanel}>
          <h1 style={styles.formTitle}>Sign in</h1>
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Badge Number</label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="S-5591"
                style={styles.input}
                autoFocus
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>PIN</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                maxLength={4}
                style={styles.input}
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button type="submit" disabled={loading || !badge || !pin} style={{
              ...styles.button,
              opacity: loading || !badge || !pin ? 0.6 : 1
            }}>
              {loading ? 'Signing In...' : 'Start Shift'}
              <span style={styles.buttonArrow}>→</span>
            </button>
          </form>
          <p style={styles.footer}>Secure EMS Authentication</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a0a14 0%, #0a1628 50%, #0d1f3c 100%)',
    padding: '24px'
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: '960px',
    minHeight: '560px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
  },
  leftPanel: {
    flex: '0 0 58%',
    position: 'relative',
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
    inset: 0,
    background: 'linear-gradient(135deg, rgba(139, 69, 100, 0.4) 0%, rgba(10, 22, 40, 0.6) 100%)'
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 40px',
    minHeight: '560px'
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandName: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#ffffff',
    letterSpacing: '0.5px'
  },
  promoText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: '-80px'
  },
  promoHeading: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 12px',
    lineHeight: 1.2
  },
  promoSubtext: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.85)',
    margin: 0,
    lineHeight: 1.5,
    maxWidth: '320px'
  },
  rightPanel: {
    flex: '0 0 42%',
    background: 'rgba(25, 15, 35, 0.95)',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column'
  },
  formTitle: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 32px',
    letterSpacing: '-0.5px'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  input: {
    padding: '14px 16px',
    borderRadius: '0',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.3)',
    background: 'transparent',
    color: '#ffffff',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'Inter, sans-serif'
  },
  button: {
    padding: '16px 24px',
    borderRadius: '0',
    border: 'none',
    background: 'linear-gradient(135deg, #e53e3e, #c53030)',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  buttonArrow: {
    fontSize: '18px',
    opacity: 0.9
  },
  error: {
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(229, 62, 62, 0.15)',
    border: '1px solid rgba(229, 62, 62, 0.3)',
    color: '#fc8181',
    fontSize: '14px',
    textAlign: 'center'
  },
  footer: {
    marginTop: 'auto',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  }
};
