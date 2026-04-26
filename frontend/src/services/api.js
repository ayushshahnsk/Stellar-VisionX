import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginUser = (email, password) => api.post('/auth/login', { email, password });
export const registerUser = (email, password, name) => api.post('/auth/register', { email, password, name });
export const getUser = () => api.get('/auth/user');

// Fusion
export const runFusion = (formData) =>
  api.post('/fusion/run', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
export const getSessions = () => api.get('/fusion/sessions');
export const getSession = (id) => api.get(`/fusion/${id}`);

// Metrics
export const getMetricsOverview = () => api.get('/metrics/overview');
export const getMetricsHistory = () => api.get('/metrics/history');

// System Status
export const getSystemStatus = () => api.get('/status');

// Activity
export const getActivityLogs = (params) => api.get('/activity', { params });

// Alerts
export const getAlertPreferences = () => api.get('/alerts/preferences');
export const updateAlertPreferences = (data) => api.put('/alerts/preferences', data);
export const getAlertHistory = (params) => api.get('/alerts/history', { params });
export const acknowledgeAlert = (id, status) => api.put(`/alerts/${id}/acknowledge`, { status });

export default api;
