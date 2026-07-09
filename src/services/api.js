import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Ingest/process tasks can take longer
});

// Request interceptor - log in development
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors centrally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorMsg = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    
    // Don't toast for cancelled requests or expected checkups
    if (!axios.isCancel(error)) {
      console.error('[API Error]:', errorMsg);
      toast.error(errorMsg);
    }
    
    return Promise.reject(error);
  }
);

export default api;
