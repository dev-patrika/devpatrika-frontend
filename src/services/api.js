import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for sending the HttpOnly refresh token cookie
  timeout: 60000,
});

// Request interceptor - attach access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors centrally and refresh token on 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If it's a 401 Unauthorized and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept 401s from the refresh endpoint itself or login endpoints
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/otp')) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      try {
        // Attempt to get a new access token using the HTTPOnly cookie
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.access_token;
        
        // Update store
        useAuthStore.getState().setToken(newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed (cookie expired or missing) - user must log in again
        useAuthStore.getState().logout();
        
        // Only show toast if it's a protected action
        toast.error('Session expired. Please sign in again.');
        
        // Open the global auth modal
        useAuthStore.getState().setAuthModalOpen(true);
        
        return Promise.reject(refreshError);
      }
    }

    const errorMsg = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    
    // Don't toast for cancelled requests
    if (!axios.isCancel(error)) {
      console.error('[API Error]:', errorMsg);
      toast.error(errorMsg);
    }
    
    return Promise.reject(error);
  }
);

export default api;
