import axios from 'axios';

// Dynamically determine the backend URL so it works seamlessly on phones/tablets over Wi-Fi
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname || '127.0.0.1';
  return `http://${hostname}:8000`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {
  ask: async (question) => {
    const res = await api.post('/api/chat', { question });
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get('/api/history');
    return res.data;
  },
  clearHistory: async () => {
    const res = await api.delete('/api/history');
    return res.data;
  },
};

export const documentsApi = {
  getAll: async () => {
    const res = await api.get('/api/documents');
    return res.data;
  },
  reindex: async () => {
    const res = await api.post('/api/documents/reindex');
    return res.data;
  },
  getRawPdfUrl: (filename) => {
    return `${getBaseUrl()}/api/documents/raw/${encodeURIComponent(filename)}`;
  },
};

export const systemApi = {
  getHealth: async () => {
    const res = await api.get('/api/health');
    return res.data;
  },
};

export default api;
