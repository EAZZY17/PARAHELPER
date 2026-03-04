import { useState, useCallback } from 'react';
import { chatAPI, formsAPI } from '../services/api';

export default function useParaHelper(options = {}) {
  const { onChatResponse } = options;
  const [messages, setMessages] = useState([]);
  const [currentForms, setCurrentForms] = useState({});
  const [guardrailResults, setGuardrailResults] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [phase, setPhase] = useState('between_calls');
  const [mode, setMode] = useState('normal');
  const [isPediatric, setIsPediatric] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('parahelper_session_id'));
  const [chatLoaded, setChatLoaded] = useState(false);

  const sendMessage = useCallback(async (text, wasVoice = false) => {
    if (!text.trim() || !sessionId) return null;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      wasVoice
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { data } = await chatAPI.sendMessage(text, sessionId, wasVoice);

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        audioUrl: data.audio_url
      };
      setMessages(prev => [...prev, aiMsg]);

      if (data.form_update && Object.keys(data.form_update).length > 0) {
        setCurrentForms(prev => ({ ...prev, ...data.form_update }));
      }
      if (data.guardrail_results) setGuardrailResults(data.guardrail_results);
      if (onChatResponse) onChatResponse({ ...data, ...(data.auto_submit_form && { triggerAutoSubmit: data.auto_submit_form }) });
      if (data.alerts) setAlerts(data.alerts);
      if (data.phase) setPhase(data.phase);
      if (data.mode) setMode(data.mode);
      if (data.is_pediatric !== undefined) setIsPediatric(data.is_pediatric);
      if (onChatResponse) onChatResponse(data);

      setIsLoading(false);
      return data;
    } catch (error) {
      console.error('Send message error:', error);
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I hit a snag. Give me a second and try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errMsg]);
      setIsLoading(false);
      return null;
    }
  }, [sessionId]);

  const submitForm = useCallback(async (formType) => {
    const formData = currentForms[formType];
    if (!formData) return null;

    try {
      const { data } = await formsAPI.submit(formType, formData, sessionId);
      return data;
    } catch (error) {
      if (error.response?.data?.guardrail) {
        setGuardrailResults(prev => ({
          ...prev,
          [formType]: error.response.data.guardrail
        }));
      }
      return null;
    }
  }, [currentForms, sessionId]);

  const initSession = useCallback((sid, briefing) => {
    setSessionId(sid);
    if (sid) localStorage.setItem('parahelper_session_id', sid);
    setCurrentForms({});
    setGuardrailResults({});
    setAlerts([]);
    setPhase('between_calls');
    setMode('normal');
    setIsPediatric(false);
    if (briefing) {
      setMessages([{
        id: Date.now(),
        role: 'assistant',
        content: briefing,
        timestamp: new Date().toISOString()
      }]);
    }
    setChatLoaded(true);
  }, []);

  const loadChat = useCallback(async () => {
    if (chatLoaded) return;
    try {
      const { data } = await chatAPI.getLatest();
      if (data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem('parahelper_session_id', data.session_id);
        const msgs = (data.messages || []).map((m, i) => ({
          id: i,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          wasVoice: m.was_voice
        }));
        setMessages(msgs);
        if (data.state?.phase) setPhase(data.state.phase);
        if (data.state?.forms && Object.keys(data.state.forms).length > 0) {
          setCurrentForms(prev => ({ ...prev, ...data.state.forms }));
        }
      }
      setChatLoaded(true);
    } catch (err) {
      console.error('Load chat error:', err);
      setChatLoaded(true);
    }
  }, [chatLoaded]);

  return {
    messages, currentForms, guardrailResults, alerts,
    phase, mode, isPediatric, isLoading, sessionId,
    sendMessage, submitForm, initSession, loadChat,
    setCurrentForms, setPhase
  };
}
