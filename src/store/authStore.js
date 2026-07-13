import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: (() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('access_token'),
  token: localStorage.getItem('access_token') || null,
  authModalOpen: false,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('access_token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      set({ token: null, isAuthenticated: false, user: null });
    }
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } else {
      localStorage.removeItem('user');
      set({ user: null });
    }
  },

  setAuthModalOpen: (isOpen) => set({ authModalOpen: isOpen }),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
