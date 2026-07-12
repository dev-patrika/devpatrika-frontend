import { create } from 'zustand';

export const useUIStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',
  sidebarOpen: true,
  searchOpen: false,
  
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: nextTheme };
  }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Custom Confirm Dialog State
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  },
  
  showConfirm: (title, message) => new Promise((resolve) => {
    set({
      confirmDialog: {
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          set((state) => ({ confirmDialog: { ...state.confirmDialog, isOpen: false } }));
          resolve(true);
        },
        onCancel: () => {
          set((state) => ({ confirmDialog: { ...state.confirmDialog, isOpen: false } }));
          resolve(false);
        }
      }
    });
  }),
}));
