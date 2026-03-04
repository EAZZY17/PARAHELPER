import React, { useState, useEffect } from 'react';

export default function TopBar({ profile, phase, mode, alerts, onShiftSummary, onMap, onNewSession }) {
  const [shiftTime, setShiftTime] = useState('00:00:00');
  const [shiftStart] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - shiftStart;
      const h = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
      const m = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
      setShiftTime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [shiftStart]);

  const phaseLabels = {
    before_call: 'Before Call',
    during_call: 'During Call',
    after_call: 'After Call',
    between_calls: 'Between Calls'
  };

  const phaseColors = {
    before_call: '#ecc94b',
    during_call: '#e53e3e',
    after_call: '#48bb78',
    between_calls: '#4299e1'
  };

  const crisisActive = mode === 'stress';

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <div style={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="18" width="32" height="12" rx="2" fill="#e53e3e"/>
            <rect x="18" y="8" width="12" height="32" rx="2" fill="#e53e3e"/>
          </svg>
          <span style={styles.logoText}>ParaHelper</span>
        </div>
      </div>

      <div style={styles.center}>
        <div style={{
          ...styles.phaseBadge,
          background: `${phaseColors[phase]}22`,
          borderColor: phaseColors[phase],
          color: phaseColors[phase]
        }}>
          {phaseLabels[phase] || 'Between Calls'}
        </div>

        {crisisActive && (
          <div style={styles.crisisBadge}>
            CRISIS MODE
          </div>
        )}
      </div>

      <div style={styles.right}>
        <div style={styles.shiftTimer}>
          <span style={styles.timerLabel}>SHIFT</span>
          <span style={styles.timerValue}>{shiftTime}</span>
        </div>

        <div style={styles.profileBadge}>
          <span style={styles.profileName}>
            {profile?.first_name} {profile?.last_name?.charAt(0)}.
          </span>
          <span style={{
            ...styles.roleBadge,
            background: profile?.role === 'ACP' ? 'rgba(229, 62, 62, 0.2)' : 'rgba(66, 153, 225, 0.2)',
            color: profile?.role === 'ACP' ? '#fc8181' : '#90cdf4'
          }}>
            {profile?.role}
          </span>
        </div>

        <button onClick={onShiftSummary} style={styles.summaryBtn} title="Shift Summary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 14l2 2 4-4"/>
          </svg>
        </button>

        <button onClick={onMap} style={styles.summaryBtn} title="Map & Directions">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
        </button>

        <button onClick={onNewSession} style={styles.logoutBtn} title="New Session">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    background: 'rgba(10, 22, 40, 0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
    zIndex: 100
  },
  left: { display: 'flex', alignItems: 'center', gap: '16px' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoText: { fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' },
  center: { display: 'flex', alignItems: 'center', gap: '12px' },
  phaseBadge: {
    padding: '6px 16px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  crisisBadge: {
    padding: '6px 16px',
    borderRadius: '20px',
    background: 'rgba(229, 62, 62, 0.3)',
    border: '1px solid #e53e3e',
    color: '#fc8181',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  right: { display: 'flex', alignItems: 'center', gap: '16px' },
  shiftTimer: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  timerLabel: { fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' },
  timerValue: { fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' },
  profileBadge: { display: 'flex', alignItems: 'center', gap: '8px' },
  profileName: { fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' },
  roleBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.5px'
  },
  summaryBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  logoutBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid rgba(229, 62, 62, 0.2)',
    background: 'rgba(229, 62, 62, 0.1)',
    color: '#fc8181',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  }
};
