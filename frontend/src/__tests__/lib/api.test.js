import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getChapters, getChapterData, getCachedComics } from '@/lib/api';

describe('api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getChapters', () => {
    it('builds correct URL with comic URL param', async () => {
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: [] }) });

      await getChapters('https://komiku.org/manga/test');

      expect(fetch).toHaveBeenCalledWith(
        '/komik/chapters?url=https%3A%2F%2Fkomiku.org%2Fmanga%2Ftest',
        {}
      );
    });

    it('appends mode=secret when mode is nsfw', async () => {
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: [] }) });

      await getChapters('https://sektedoujin.cc/manga/test', 'nsfw');

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('mode=secret');
    });

    it('throws on non-OK response', async () => {
      fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

      await expect(getChapters('https://komiku.org/test')).rejects.toThrow('HTTP 500');
    });
  });

  describe('getChapterData', () => {
    it('builds correct URL with chapter URL param', async () => {
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ title: '', data: [] }) });

      await getChapterData('https://komiku.org/ch-1/');

      expect(fetch).toHaveBeenCalledWith(
        '/komik/data?url=https%3A%2F%2Fkomiku.org%2Fch-1%2F',
        {}
      );
    });

    it('appends mode=secret when mode is nsfw', async () => {
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ title: '', data: [] }) });

      await getChapterData('https://test.com/ch-1/', 'nsfw');

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('mode=secret');
    });
  });

  describe('getCachedComics', () => {
    it('calls /komik/cached-comics', async () => {
      fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

      await getCachedComics();

      expect(fetch).toHaveBeenCalledWith('/komik/cached-comics', {});
    });
  });
});
