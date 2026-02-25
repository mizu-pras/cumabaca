import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useReaderStore = create(
  persist(
    (set, get) => ({
      // Current comic state
      komik: null,
      activeChapter: null,

      // Chapter data
      chapters: {
        entities: {},
        ids: []
      },
      chapterData: [],
      chapterTitle: '',

      // Loading states
      isLoadingChapters: false,
      isLoadingData: false,

      // Preload state
      preloadedChapter: null,
      preloadedData: null,

      // Actions
      setKomik: (url) => set({ komik: url }),
      setActiveChapter: (id) => set({ activeChapter: id }),
      setChapters: (chapters) => set({ chapters }),
      setChapterData: (data, title) => set({ chapterData: data, chapterTitle: title }),
      setLoadingChapters: (loading) => set({ isLoadingChapters: loading }),
      setLoadingData: (loading) => set({ isLoadingData: loading }),
      setPreloaded: (chapter, data) => set({ preloadedChapter: chapter, preloadedData: data }),
      clearPreload: () => set({ preloadedChapter: null, preloadedData: null }),

      // Navigation
      nextChapter: () => {
        const { activeChapter, chapters } = get();
        const idx = chapters.ids.indexOf(activeChapter);
        if (idx > 0) set({ activeChapter: chapters.ids[idx - 1] });
      },
      prevChapter: () => {
        const { activeChapter, chapters } = get();
        const idx = chapters.ids.indexOf(activeChapter);
        if (idx < chapters.ids.length - 1) set({ activeChapter: chapters.ids[idx + 1] });
      },
    }),
    {
      name: 'cumabaca-reader',
      partialize: (state) => ({
        komik: state.komik,
        activeChapter: state.activeChapter,
      }),
    }
  )
);
