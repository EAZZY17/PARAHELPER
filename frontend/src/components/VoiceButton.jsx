import React from 'react';

export default function VoiceButton({ isListening, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        ...styles.button,
        background: isListening
          ? 'linear-gradient(135deg, #e53e3e, #c53030)'
          : 'linear-gradient(135deg, #2d3748, #4a5568)',
        boxShadow: isListening
          ? '0 0 30px rgba(229, 62, 62, 0.4), 0 0 60px rgba(229, 62, 62, 0.2)'
          : '0 4px 15px rgba(0,0,0,0.3)',
        transform: isListening ? 'scale(1.1)' : 'scale(1)',
        opacity: disabled ? 0.5 : 1
      }}
      title={isListening ? 'Stop Recording' : 'Start Recording'}
    >
      {isListening ? (
        <div style={styles.waveContainer}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              ...styles.waveBar,
              animationDelay: `${i * 0.1}s`,
              height: '100%'
            }} />
          ))}
        </div>
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      )}

      <style>{`
        @keyframes waveAnim {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </button>
  );
}

const styles = {
  button: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flexShrink: 0
  },
  waveContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    height: '24px'
  },
  waveBar: {
    width: '4px',
    background: 'white',
    borderRadius: '2px',
    animation: 'waveAnim 0.8s ease-in-out infinite'
  }
};
