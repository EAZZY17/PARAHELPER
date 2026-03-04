import React, { useState, useRef, useEffect } from 'react';
import VoiceButton from './VoiceButton';
import useVoice from '../hooks/useVoice';

export default function ChatInterface({ messages, isLoading, onSendMessage }) {
  const [textInput, setTextInput] = useState('');
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

      <div style={styles.inputBar}>
        <input
          type="text"
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={styles.textInput}
          disabled={isListening}
        />

        <VoiceButton
          isListening={isListening}
          onToggle={handleVoiceToggle}
          disabled={!supported || isLoading}
        />

        <button
          onClick={handleSend}
          disabled={!textInput.trim() || isLoading || isListening}
          style={{
            ...styles.sendButton,
            opacity: !textInput.trim() || isLoading || isListening ? 0.4 : 1
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
        </button>
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
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(10, 22, 40, 0.8)'
  },
  textInput: {
    flex: 1,
    padding: '14px 18px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'Inter, sans-serif'
  },
  sendButton: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #4299e1, #3182ce)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s'
  }
};
