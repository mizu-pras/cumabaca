import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the api module before importing data-sources
vi.mock('@/lib/api', () => ({
  getChapters: vi.fn(),
  getChapterData: vi.fn(),
}));

import { fetchChapters, fetchChapterData, clearDataCache } from '@/lib/data-sources';
import { getChapters, getChapterData } from '@/lib/api';

describe('data-sources', () => {
  beforeEach(() => {
    clearDataCache();
    vi.clearAllMocks();
  });

  describe('fetchChapters', () => {
    it('calls getChapters with correct mode mapping', async () => {
      getChapters.mockResolvedValue({ data: [{ chapter: 'Ch 1' }] });

      await fetchChapters('https://komiku.org/test', true);

      expect(getChapters).toHaveBeenCalledWith('https://komiku.org/test', 'nsfw');
    });

    it('maps false to normal mode', async () => {
      getChapters.mockResolvedValue({ data: [] });

      await fetchChapters('https://komiku.org/test', false);

      expect(getChapters).toHaveBeenCalledWith('https://komiku.org/test', 'normal');
    });

    it('returns same promise for same key (promise caching)', async () => {
      getChapters.mockResolvedValue({ data: [] });

      const p1 = fetchChapters('https://komiku.org/test', false);
      const p2 = fetchChapters('https://komiku.org/test', false);

      expect(p1).toBe(p2); // same reference
      expect(getChapters).toHaveBeenCalledTimes(1); // only one fetch
    });

    it('removes failed promise from cache so retry creates new one', async () => {
      getChapters.mockRejectedValueOnce(new Error('Network error'));

      const p1 = fetchChapters('https://komiku.org/test', false);
      await expect(p1).rejects.toThrow('Network error');

      // Second call should create a new promise
      getChapters.mockResolvedValue({ data: [] });
      const p2 = fetchChapters('https://komiku.org/test', false);
      expect(p2).not.toBe(p1);
    });
  });

  describe('fetchChapterData', () => {
    it('calls getChapterData with nsfw mode mapping', async () => {
      getChapterData.mockResolvedValue({ title: 'T', data: [] });

      await fetchChapterData('https://komiku.org/ch-1/', true);

      expect(getChapterData).toHaveBeenCalledWith('https://komiku.org/ch-1/', 'nsfw');
    });

    it('caches promises by key', async () => {
      getChapterData.mockResolvedValue({ title: 'T', data: [] });

      const p1 = fetchChapterData('https://komiku.org/ch-1/', false);
      const p2 = fetchChapterData('https://komiku.org/ch-1/', false);

      expect(p1).toBe(p2);
    });
  });

  describe('clearDataCache', () => {
    it('clears all cached promises', async () => {
      getChapters.mockResolvedValue({ data: [] });

      const p1 = fetchChapters('https://komiku.org/test', false);
      await p1;

      clearDataCache();

      const p2 = fetchChapters('https://komiku.org/test', false);
      expect(p2).not.toBe(p1);
      expect(getChapters).toHaveBeenCalledTimes(2);
    });
  });
});
