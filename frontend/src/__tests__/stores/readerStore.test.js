import { describe, it, expect, beforeEach } from 'vitest';
import { useReaderStore } from '@/stores/readerStore';

describe('readerStore', () => {
  beforeEach(() => {
    useReaderStore.setState({
      komik: null,
      activeChapter: null,
      loadedChapters: { entities: {}, ids: [] },
      loadingChapters: {},
    });
  });

  describe('setKomik / setActiveChapter', () => {
    it('sets komik URL', () => {
      useReaderStore.getState().setKomik('https://komiku.org/manga/test');
      expect(useReaderStore.getState().komik).toBe('https://komiku.org/manga/test');
    });

    it('sets active chapter', () => {
      useReaderStore.getState().setActiveChapter('ch-10');
      expect(useReaderStore.getState().activeChapter).toBe('ch-10');
    });
  });

  describe('clearAndLoadChapter', () => {
    it('resets loadedChapters and sets new active chapter with loading state', () => {
      // Pre-populate some chapters
      useReaderStore.getState().upsertLoadedChapter('ch-1', { id: 'ch-1', loaded: true });

      useReaderStore.getState().clearAndLoadChapter('ch-5');

      const state = useReaderStore.getState();
      expect(state.activeChapter).toBe('ch-5');
      expect(state.loadedChapters.entities).toEqual({});
      expect(state.loadedChapters.ids).toEqual([]);
      expect(state.loadingChapters).toEqual({ 'ch-5': true });
    });
  });

  describe('upsertLoadedChapter', () => {
    it('adds new chapter to entities and ids', () => {
      useReaderStore.getState().upsertLoadedChapter('ch-1', { id: 'ch-1', loaded: true, data: ['img1'] });

      const state = useReaderStore.getState();
      expect(state.loadedChapters.ids).toEqual(['ch-1']);
      expect(state.loadedChapters.entities['ch-1'].loaded).toBe(true);
    });

    it('updates existing chapter without duplicating in ids', () => {
      useReaderStore.getState().upsertLoadedChapter('ch-1', { id: 'ch-1', loaded: false });
      useReaderStore.getState().upsertLoadedChapter('ch-1', { id: 'ch-1', loaded: true });

      const state = useReaderStore.getState();
      expect(state.loadedChapters.ids).toEqual(['ch-1']); // not duplicated
      expect(state.loadedChapters.entities['ch-1'].loaded).toBe(true);
    });

    it('preserves other chapters when upserting', () => {
      useReaderStore.getState().upsertLoadedChapter('ch-1', { id: 'ch-1' });
      useReaderStore.getState().upsertLoadedChapter('ch-2', { id: 'ch-2' });

      const state = useReaderStore.getState();
      expect(state.loadedChapters.ids).toEqual(['ch-1', 'ch-2']);
    });
  });

  describe('removeLoadedChapter', () => {
    it('removes chapter from entities and ids', () => {
      useReaderStore.getState().upsertLoadedChapter('ch-1', { id: 'ch-1' });
      useReaderStore.getState().upsertLoadedChapter('ch-2', { id: 'ch-2' });

      useReaderStore.getState().removeLoadedChapter('ch-1');

      const state = useReaderStore.getState();
      expect(state.loadedChapters.ids).toEqual(['ch-2']);
      expect(state.loadedChapters.entities['ch-1']).toBeUndefined();
    });
  });

  describe('persistence', () => {
    it('only persists komik and activeChapter (not loadedChapters)', () => {
      // The persist config uses partialize to only save komik and activeChapter
      useReaderStore.getState().setKomik('https://test.com');
      useReaderStore.getState().setActiveChapter('ch-1');
      useReaderStore.getState().upsertLoadedChapter('ch-1', { id: 'ch-1', data: ['large data'] });

      const stored = JSON.parse(localStorage.getItem('cumabaca-reader') || '{}');
      expect(stored.state).toBeDefined();
      expect(stored.state.komik).toBe('https://test.com');
      expect(stored.state.activeChapter).toBe('ch-1');
      expect(stored.state.loadedChapters).toBeUndefined();
    });
  });
});
