import React, { useState } from 'react';
import { authAPI } from '../services/api';

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
      <div style={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            ...styles.particle,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }} />
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="18" width="32" height="12" rx="2" fill="#e53e3e"/>
              <rect x="18" y="8" width="12" height="32" rx="2" fill="#e53e3e"/>
            </svg>
          </div>
          <h1 style={styles.title}>ParaHelper</h1>
          <p style={styles.subtitle}>Your AI Shift Companion</p>
        </div>

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
          </button>
        </form>

        <p style={styles.footer}>Secure EMS Authentication</p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0d1f3c 100%)',
    position: 'relative',
    overflow: 'hidden'
  },
  particles: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  particle: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'rgba(229, 62, 62, 0.4)',
    animation: 'float 4s ease-in-out infinite'
  },
  card: {
    background: 'rgba(15, 25, 50, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(229, 62, 62, 0.2)',
    borderRadius: '20px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    zIndex: 1,
    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(229, 62, 62, 0.1)'
  },
  logoSection: { textAlign: 'center', marginBottom: '36px' },
  logoIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'rgba(229, 62, 62, 0.1)',
    border: '2px solid rgba(229, 62, 62, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    margin: '4px 0 0',
    letterSpacing: '2px',
    textTransform: 'uppercase'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  input: {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'Inter, sans-serif'
  },
  button: {
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #e53e3e, #c53030)',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.5px'
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
    textAlign: 'center',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.3)',
    marginTop: '24px',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  }
};
