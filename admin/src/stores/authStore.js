import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false, // Start with false, check when needed

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/admin/auth/login', { username, password });
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false
          });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
      },

      logout: async () => {
        try {
          await api.post('/admin/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
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
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Set isLoading to false after hydration completes
        state.isLoading = false;
      },
    }
  )
);
