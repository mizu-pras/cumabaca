import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useReaderStore = create(
  persist(
    (set) => ({
      // Current comic state
      komik: null,
      activeChapter: null,

      // Infinite scroll state
      loadedChapterIds: [],
      // activeScrollChapter: NOT persisted (resets on page load)
      // Used for viewport tracking only - should always start fresh on each session
      activeScrollChapter: null,

      // Preload state (kept for future use)
      preloadedChapter: null,
      preloadedData: null,

      // Actions
      setKomik: (url) => set({ komik: url }),
      setActiveChapter: (id) => set({ activeChapter: id }),
      setActiveScrollChapter: (id) => set({ activeScrollChapter: id }),
      setLoadedChapterIds: (ids) => set({ loadedChapterIds: ids }),
      addLoadedChapterId: (id) => set((state) => ({
        loadedChapterIds: state.loadedChapterIds.includes(id)
          ? state.loadedChapterIds
          : [...state.loadedChapterIds, id]
      })),
      removeLoadedChapterId: (id) => set((state) => ({
        loadedChapterIds: state.loadedChapterIds.filter(chapterId => chapterId !== id)
      })),
      setPreloaded: (chapter, data) => set({ preloadedChapter: chapter, preloadedData: data }),
      clearPreload: () => set({ preloadedChapter: null, preloadedData: null }),
    }),
    {
      name: 'cumabaca-reader',
      partialize: (state) => ({
        komik: state.komik,
        activeChapter: state.activeChapter,
        // loadedChapterIds persisted to avoid re-fetch after refresh
        loadedChapterIds: state.loadedChapterIds,
      }),
    }
  )
);
