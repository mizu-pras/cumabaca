import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    const response = await api.post('/admin/auth/login', credentials);
    set({
      user: response.data.user,
      isAuthenticated: true,
      isLoading: false
    });
  },

  logout: async () => {
    await api.post('/admin/auth/logout');
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  },

  checkAuth: async () => {
    try {
      const response = await api.get('/admin/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }
}));
