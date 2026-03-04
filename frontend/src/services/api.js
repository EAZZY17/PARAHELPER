import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('parahelper_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('parahelper_token');
      localStorage.removeItem('parahelper_profile');
      localStorage.removeItem('parahelper_session_id');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const healthAPI = {
  ping: () => api.get('/api/health', { timeout: 90000 })
};

export const authAPI = {
  login: (badge_number) => api.post('/api/auth/login', { badge_number })
};

export const chatAPI = {
  startSession: () =>
    api.post('/api/chat/session/start'),
  sendMessage: (message, session_id, was_voice = false) =>
    api.post('/api/chat/message', { message, session_id, was_voice }),
  getSession: (session_id) =>
    api.get(`/api/chat/session/${session_id}`),
  getLatest: () =>
    api.get('/api/chat/latest')
};

export const formsAPI = {
  submit: (form_type, form_data, session_id) =>
    api.post('/api/forms/submit', { form_type, form_data, session_id }, { timeout: 120000 }),
  guardrailCheck: (form_type, form_data) =>
    api.post('/api/forms/guardrail-check', { form_type, form_data }),
  getOccurrenceReports: () =>
    api.get('/api/forms/occurrence-reports'),
  getTeddyBears: () =>
    api.get('/api/forms/teddy-bears')
};

export const weatherAPI = {
  getCurrent: (station) => api.get('/api/weather', station ? { params: { station } } : {})
};

export const exportsAPI = {
  getStatus: (paramedic_id) =>
    api.get(`/api/paramedic/${paramedic_id}/status`),
  getShifts: (paramedic_id) =>
    api.get(`/api/paramedic/${paramedic_id}/shifts`),
  getShiftSummary: (session_id) =>
    api.post('/api/shift-summary', { session_id })
};

export default api;
