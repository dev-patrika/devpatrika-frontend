import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('access_token') || null,
  authModalOpen: false,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('access_token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('access_token');
      set({ token: null, isAuthenticated: false, user: null });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setAuthModalOpen: (isOpen) => set({ authModalOpen: isOpen }),

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
