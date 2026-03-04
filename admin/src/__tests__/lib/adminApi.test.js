import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api', () => {
  return {
    default: {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
    },
  };
});

import { languagesApi, websitesApi, komiksApi, komikWebsitesApi } from '../../lib/adminApi';
import api from '../../lib/api';

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('languagesApi', () => {
    it('getAll calls correct endpoint with params', async () => {
      await languagesApi.getAll({ page: 1 });
      expect(api.get).toHaveBeenCalledWith('/admin/languages', { params: { page: 1 } });
    });

    it('getById calls correct endpoint', async () => {
      await languagesApi.getById(5);
      expect(api.get).toHaveBeenCalledWith('/admin/languages/5');
    });

    it('create calls POST with data', async () => {
      await languagesApi.create({ name: 'English', code: 'en' });
      expect(api.post).toHaveBeenCalledWith('/admin/languages', { name: 'English', code: 'en' });
    });

    it('update calls PUT with id and data', async () => {
      await languagesApi.update(5, { name: 'Updated' });
      expect(api.put).toHaveBeenCalledWith('/admin/languages/5', { name: 'Updated' });
    });

    it('delete calls DELETE with id', async () => {
      await languagesApi.delete(5);
      expect(api.delete).toHaveBeenCalledWith('/admin/languages/5');
    });
  });

  describe('websitesApi', () => {
    it('getAll calls correct endpoint', async () => {
      await websitesApi.getAll();
      expect(api.get).toHaveBeenCalledWith('/admin/websites', { params: {} });
    });

    it('create calls POST', async () => {
      await websitesApi.create({ name: 'Test', domain: 'test.com' });
      expect(api.post).toHaveBeenCalledWith('/admin/websites', { name: 'Test', domain: 'test.com' });
    });
  });

  describe('komiksApi', () => {
    it('getAll calls correct endpoint', async () => {
      await komiksApi.getAll();
      expect(api.get).toHaveBeenCalledWith('/admin/komiks', { params: {} });
    });

    it('getWebsites calls nested endpoint', async () => {
      await komiksApi.getWebsites(3);
      expect(api.get).toHaveBeenCalledWith('/admin/komiks/3/websites');
    });

    it('CRUD operations use correct endpoints', async () => {
      await komiksApi.create({ title: 'Test' });
      expect(api.post).toHaveBeenCalledWith('/admin/komiks', { title: 'Test' });

      await komiksApi.update(1, { title: 'Updated' });
      expect(api.put).toHaveBeenCalledWith('/admin/komiks/1', { title: 'Updated' });

      await komiksApi.delete(1);
      expect(api.delete).toHaveBeenCalledWith('/admin/komiks/1');
    });
  });

  describe('komikWebsitesApi', () => {
    it('getAll calls correct endpoint', async () => {
      await komikWebsitesApi.getAll();
      expect(api.get).toHaveBeenCalledWith('/admin/komik-websites', { params: {} });
    });
  });
});
