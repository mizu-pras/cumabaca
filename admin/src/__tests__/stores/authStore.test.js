import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the api module
vi.mock('../../lib/api', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('sets user and isAuthenticated on success', async () => {
      api.post.mockResolvedValue({
        data: { user: { id: 1, username: 'admin' } },
      });

      const result = await useAuthStore.getState().login('admin', 'password');

      expect(result).toEqual({ success: true });
      expect(useAuthStore.getState().user).toEqual({ id: 1, username: 'admin' });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('returns error on failure', async () => {
      api.post.mockRejectedValue({
        response: { data: { error: 'Invalid credentials' } },
      });

      const result = await useAuthStore.getState().login('admin', 'wrong');

      expect(result).toEqual({ success: false, error: 'Invalid credentials' });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('returns generic error when no response data', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      const result = await useAuthStore.getState().login('admin', 'pass');

      expect(result).toEqual({ success: false, error: 'Login failed' });
    });
  });

  describe('logout', () => {
    it('clears state even if API call fails', async () => {
      useAuthStore.setState({ user: { id: 1 }, isAuthenticated: true });
      api.post.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('calls logout endpoint', async () => {
      api.post.mockResolvedValue({});
      await useAuthStore.getState().logout();

      expect(api.post).toHaveBeenCalledWith('/admin/auth/logout');
    });
  });

  describe('checkAuth', () => {
    it('sets user on successful auth check', async () => {
      api.get.mockResolvedValue({
        data: { user: { id: 1, username: 'admin' } },
      });

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual({ id: 1, username: 'admin' });
    });

    it('clears state on failed auth check', async () => {
      useAuthStore.setState({ user: { id: 1 }, isAuthenticated: true });
      api.get.mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('persistence', () => {
    it('only persists user and isAuthenticated', () => {
      useAuthStore.setState({
        user: { id: 1, username: 'admin' },
        isAuthenticated: true,
        isLoading: true,
      });

      const stored = JSON.parse(localStorage.getItem('admin-auth-storage') || '{}');
      expect(stored.state?.user).toEqual({ id: 1, username: 'admin' });
      expect(stored.state?.isAuthenticated).toBe(true);
      expect(stored.state?.isLoading).toBeUndefined();
    });
  });
});
