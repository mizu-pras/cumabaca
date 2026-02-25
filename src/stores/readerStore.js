import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useReaderStore = create(
  persist(
    (set) => ({
      // Current comic state
      komik: null,
      activeChapter: null,

      // Infinite scroll state - single source of truth for loaded chapters
      // NOT persisted (images are large, refetch on page load is better)
      loadedChapters: { entities: {}, ids: [] },

      // Loading state
      loadingChapters: {}, // { chapterId: boolean }

      // Preload state (kept for future use)
      preloadedChapter: null,
      preloadedData: null,

      // Actions
      setKomik: (url) => set({ komik: url }),
      setActiveChapter: (id) => set({ activeChapter: id }),
      clearAndLoadChapter: (chapterId) => set((state) => ({
        activeChapter: chapterId,
        loadedChapters: { entities: {}, ids: [] },
        loadingChapters: { [chapterId]: true }
      })),

      // Chapter data management
      setLoadedChapters: (chapters) => set({ loadedChapters: chapters }),
      upsertLoadedChapter: (chapterId, data) => set((state) => {
        const exists = state.loadedChapters.entities[chapterId];
        return {
          loadedChapters: {
            entities: {
              ...state.loadedChapters.entities,
              [chapterId]: { ...state.loadedChapters.entities[chapterId], ...data }
            },
            ids: exists ? state.loadedChapters.ids : [...state.loadedChapters.ids, chapterId]
          }
        };
      }),
      removeLoadedChapter: (chapterId) => set((state) => {
        const newEntities = { ...state.loadedChapters.entities };
        delete newEntities[chapterId];
        return {
          loadedChapters: {
            entities: newEntities,
            ids: state.loadedChapters.ids.filter(id => id !== chapterId)
          }
        };
      }),
      clearLoadedChapters: () => set({ loadedChapters: { entities: {}, ids: [] } }),

      // Loading state management
      setLoadingChapter: (chapterId, isLoading) => set((state) => ({
        loadingChapters: { ...state.loadingChapters, [chapterId]: isLoading }
      })),

      // Legacy (kept for compatibility)
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
        // loadedChapters NOT persisted - too large, refetch is better
      }),
    }
  )
);
