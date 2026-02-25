import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchChapterData, fetchChapters } from '@/lib/data-sources';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useReaderStore } from '@/stores/readerStore';

export function useInfiniteChapters() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const komik = useReaderStore(state => state.komik);
  const activeChapter = useReaderStore(state => state.activeChapter);
  const loadedChapterIds = useReaderStore(state => state.loadedChapterIds);
  const addLoadedChapterId = useReaderStore(state => state.addLoadedChapterId);
  const removeLoadedChapterId = useReaderStore(state => state.removeLoadedChapterId);

  const [loadedChapters, setLoadedChapters] = useState({ entities: {}, ids: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track pending loadChapter calls for cleanup
  const pendingLoadsRef = useRef(new Set());

  // Load a single chapter with abort support
  const loadChapter = useCallback(async (chapterId, abortSignal) => {
    if (loadedChapterIds.includes(chapterId)) return;
    if (abortSignal?.aborted) return;

    const loadKey = `${chapterId}-${Date.now()}`;
    pendingLoadsRef.current.add(loadKey);

    try {
      // Get chapter URL from chapter list
      const response = await fetchChapters(komik, nsfwEnabled);
      if (abortSignal?.aborted) return;

      const chapters = response?.data || [];
      const chapterUrl = chapters.find(item => item.chapter === chapterId)?.url;

      if (!chapterUrl) {
        throw new Error(`Chapter URL not found for ${chapterId}`);
      }

      // Fetch chapter data
      const dataResponse = await fetchChapterData(chapterUrl, nsfwEnabled);
      if (abortSignal?.aborted) return;

      // Add to loaded chapters
      setLoadedChapters(prev => ({
        entities: {
          ...prev.entities,
          [chapterId]: {
            id: chapterId,
            data: dataResponse?.data || [],
            title: dataResponse?.title || '',
            loaded: true,
            error: null,
          }
        },
        ids: [...prev.ids, chapterId]
      }));

      addLoadedChapterId(chapterId);
    } catch (err) {
      if (abortSignal?.aborted) return;
      setLoadedChapters(prev => ({
        entities: {
          ...prev.entities,
          [chapterId]: {
            id: chapterId,
            data: [],
            title: '',
            loaded: false,
            error: err.message,
          }
        },
        ids: prev.ids.includes(chapterId) ? prev.ids : [...prev.ids, chapterId]
      }));
    } finally {
      pendingLoadsRef.current.delete(loadKey);
    }
  }, [komik, nsfwEnabled, loadedChapterIds, addLoadedChapterId]);

  // Memory management: remove old chapters (with abort support)
  useEffect(() => {
    if (loadedChapterIds.length <= 10) return;

    let aborted = false;

    const cleanup = async () => {
      try {
        const response = await fetchChapters(komik, nsfwEnabled);
        if (aborted) return;

        const chapters = response?.data || [];
        const allChapterIds = chapters.map(item => item.chapter);
        const activeIndex = allChapterIds.indexOf(activeChapter);
        const keepRange = 5;

        const toRemove = loadedChapterIds.filter(id => {
          const index = allChapterIds.indexOf(id);
          return index < activeIndex - keepRange;
        });

        if (toRemove.length > 0 && !aborted) {
          toRemove.forEach(id => {
            removeLoadedChapterId(id);
            setLoadedChapters(prev => {
              const newEntities = { ...prev.entities };
              delete newEntities[id];
              return {
                entities: newEntities,
                ids: prev.ids.filter(x => x !== id)
              };
            });
          });
        }
      } catch (err) {
        console.error('Memory cleanup failed:', err);
      }
    };

    cleanup();

    return () => { aborted = true; };
  }, [activeChapter, loadedChapterIds, komik, nsfwEnabled, removeLoadedChapterId]);

  // Load active chapter and preload next chapters (with abort support)
  useEffect(() => {
    if (!komik || !activeChapter) return;

    let aborted = false;
    const abortController = new AbortController();

    setIsLoading(true);
    setError(null);

    // Consolidated fetch and preload logic
    const loadAndPreload = async () => {
      try {
        // Fetch once for both active and preload chapters
        const response = await fetchChapters(komik, nsfwEnabled);
        if (aborted) return;

        const chapters = response?.data || [];
        const allChapterIds = chapters.map(item => item.chapter);
        const currentIndex = allChapterIds.indexOf(activeChapter);

        // Load active chapter
        await loadChapter(activeChapter, abortController.signal);
        if (aborted) return;

        // Preload next 3 chapters (descending order)
        const toPreload = [];
        for (let i = 1; i <= 3; i++) {
          const nextId = allChapterIds[currentIndex - i];
          if (nextId && !loadedChapterIds.includes(nextId)) {
            toPreload.push(nextId);
          }
        }

        // Load preloads in parallel
        await Promise.all(toPreload.map(id => loadChapter(id, abortController.signal)));
      } catch (err) {
        if (!aborted) {
          console.error('Load and preload failed:', err);
        }
      } finally {
        if (!aborted) {
          setIsLoading(false);
        }
      }
    };

    loadAndPreload();

    return () => {
      aborted = true;
      abortController.abort();
    };
  }, [komik, activeChapter, nsfwEnabled, loadedChapterIds, loadChapter]);

  // Retry failed chapter
  const retryChapter = useCallback((chapterId) => {
    // Remove from state and reload
    setLoadedChapters(prev => {
      const newEntities = { ...prev.entities };
      delete newEntities[chapterId];
      return {
        entities: newEntities,
        ids: prev.ids.filter(x => x !== chapterId)
      };
    });
    loadChapter(chapterId);
  }, [loadChapter]);

  return {
    loadedChapters,
    loadChapter,
    retryChapter,
    isLoading,
    error
  };
}
