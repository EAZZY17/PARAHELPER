import React, { useState, useRef, useEffect } from 'react';
import VoiceButton from './VoiceButton';
import useVoice from '../hooks/useVoice';

export default function ChatInterface({ messages, isLoading, onSendMessage, disabled }) {
  const [textInput, setTextInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const { isListening, transcript, interimTranscript, startListening, stopListening, playAudio, supported } = useVoice();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    const text = textInput.trim();
    if (!text) return;
    onSendMessage(text, false);
    setTextInput('');
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      const finalText = stopListening();
      if (finalText) {
        const result = await onSendMessage(finalText, true);
        if (result?.audio_url) {
          playAudio(result.audio_url);
        }
      }
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.messagesArea}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            ...styles.messageRow,
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            {msg.role === 'assistant' && (
              <div style={styles.avatar}>
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="18" width="32" height="12" rx="2" fill="#e53e3e"/>
                  <rect x="18" y="8" width="12" height="32" rx="2" fill="#e53e3e"/>
                </svg>
              </div>
            )}
            <div style={{
              ...styles.messageBubble,
              ...(msg.role === 'user' ? styles.userBubble : styles.aiBubble),
              ...(msg.isError ? styles.errorBubble : {})
            }}>
              <p style={styles.messageText}>{typeof msg.content === 'string' ? msg.content : String(msg.content ?? '')}</p>
              <span style={styles.messageTime}>
                {formatTime(msg.timestamp)}
                {msg.wasVoice && ' 🎤'}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={styles.avatar}>
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="18" width="32" height="12" rx="2" fill="#e53e3e"/>
                <rect x="18" y="8" width="12" height="32" rx="2" fill="#e53e3e"/>
              </svg>
            </div>
            <div style={styles.typingIndicator}>
              <div style={styles.typingDot} />
              <div style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
              <div style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {(isListening || interimTranscript) && (
        <div style={styles.liveTranscript}>
          <div style={styles.liveIndicator}>
            <div style={styles.liveDot} />
            <span>LIVE</span>
          </div>
          <p style={styles.transcriptText}>
            {transcript}
            <span style={styles.interimText}>{interimTranscript}</span>
          </p>
        </div>
      )}

      <div style={styles.inputWrapper}>
        <div style={{
          ...styles.inputContainer,
          borderColor: inputFocused ? 'rgba(66, 153, 225, 0.5)' : 'rgba(255,255,255,0.12)',
          boxShadow: inputFocused ? '0 0 0 2px rgba(66, 153, 225, 0.25), 0 2px 12px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={styles.inputLeftIcons}>
            <button type="button" style={styles.iconBtn} title="Attach image (coming soon)" disabled>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </button>
            <button type="button" style={styles.iconBtn} title="Attach file (coming soon)" disabled>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={disabled ? 'Starting...' : 'Ask anything.'}
            style={styles.textInput}
            disabled={isListening || disabled}
          />
          <div style={styles.inputRightActions}>
            <VoiceButton
              isListening={isListening}
              onToggle={handleVoiceToggle}
              disabled={!supported || isLoading || disabled}
              compact
            />
            <button
              onClick={handleSend}
              disabled={!textInput.trim() || isLoading || isListening || disabled}
              style={{
                ...styles.sendButton,
                opacity: !textInput.trim() || isLoading || isListening || disabled ? 0.4 : 1
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={styles.suggestedPrompts}>
          <button type="button" onClick={() => { setTextInput('I need to file a Teddy Bear comfort item report'); }} style={styles.suggestBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.suggestIcon}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Start a Teddy Bear comfort item report
          </button>
          <button type="button" onClick={() => { setTextInput('Log an occurrence report'); }} style={styles.suggestBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.suggestIcon}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Log an occurrence report
          </button>
          <button type="button" onClick={() => { setTextInput('What is the nearest hospital?'); }} style={styles.suggestBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.suggestIcon}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            What is the nearest hospital?
          </button>
        </div>
      </div>

      <style>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    background: 'rgba(229, 62, 62, 0.15)',
    border: '1px solid rgba(229, 62, 62, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '16px',
    position: 'relative'
  },
  userBubble: {
    background: 'linear-gradient(135deg, rgba(66, 153, 225, 0.3), rgba(49, 130, 206, 0.2))',
    border: '1px solid rgba(66, 153, 225, 0.2)',
    borderBottomRightRadius: '4px'
  },
  aiBubble: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: '4px'
  },
  errorBubble: {
    background: 'rgba(229, 62, 62, 0.1)',
    border: '1px solid rgba(229, 62, 62, 0.2)'
  },
  messageText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: 0,
    whiteSpace: 'pre-wrap'
  },
  messageTime: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: '4px',
    display: 'block'
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '16px 20px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    borderBottomLeftRadius: '4px'
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.4)',
    animation: 'typing 1.2s ease-in-out infinite'
  },
  liveTranscript: {
    padding: '12px 24px',
    background: 'rgba(229, 62, 62, 0.08)',
    borderTop: '1px solid rgba(229, 62, 62, 0.2)'
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#fc8181',
    letterSpacing: '1px',
    marginBottom: '4px'
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#e53e3e',
    animation: 'livePulse 1s ease-in-out infinite'
  },
  transcriptText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    margin: 0
  },
  interimText: {
    color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic'
  },
  inputWrapper: {
    padding: '16px 24px 20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(10, 22, 40, 0.8)'
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px 8px 16px',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  inputLeftIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0
  },
  iconBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'not-allowed',
    flexShrink: 0
  },
  textInput: {
    flex: 1,
    padding: '12px 8px',
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    minWidth: 0
  },
  inputRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0
  },
  sendButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #4299e1, #3182ce)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(66, 153, 225, 0.4)'
  },
  suggestedPrompts: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '14px',
    paddingLeft: '4px'
  },
  suggestBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  suggestIcon: {
    flexShrink: 0,
    opacity: 0.6
  }
};
