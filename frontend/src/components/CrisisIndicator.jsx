import React from 'react';

export default function CrisisIndicator({ mode, isPediatric, alerts }) {
  if (mode !== 'stress' && !isPediatric && (!alerts || alerts.length === 0)) return null;

  return (
    <div style={styles.container}>
      {mode === 'stress' && (
        <div style={styles.crisisBanner}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fc8181" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>STRESS MODE - Short responses active</span>
        </div>
      )}

      {isPediatric && (
        <div style={styles.pediatricBanner}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#90cdf4" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <span>PEDIATRIC MODE - Weight-based calculations active</span>
        </div>
      )}

      {alerts && alerts.filter(a => a.type === 'medical_safety' || a.severity === 'critical').map((alert, i) => (
        <div key={i} style={styles.alertBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fc8181" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{alert.message}</span>
        </div>
      ))}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(229, 62, 62, 0.2); }
          50% { box-shadow: 0 0 20px rgba(229, 62, 62, 0.4); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 24px'
  },
  crisisBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(229, 62, 62, 0.15)',
    border: '1px solid rgba(229, 62, 62, 0.3)',
    borderRadius: '8px',
    color: '#fc8181',
    fontSize: '13px',
    fontWeight: 600,
    animation: 'pulseGlow 2s ease-in-out infinite'
  },
  pediatricBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(66, 153, 225, 0.15)',
    border: '1px solid rgba(66, 153, 225, 0.3)',
    borderRadius: '8px',
    color: '#90cdf4',
    fontSize: '13px',
    fontWeight: 600
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(229, 62, 62, 0.1)',
    border: '1px solid rgba(229, 62, 62, 0.2)',
    borderRadius: '8px',
    color: '#fc8181',
    fontSize: '12px'
  }
};
