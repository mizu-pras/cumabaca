import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchChapterData, fetchChapters } from '@/lib/data-sources';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useReaderStore } from '@/stores/readerStore';

/**
 * Manages infinite scroll chapter loading with scroll-based trigger
 * - Loads active chapter on mount
 * - Loads next chapter only when user scrolls near bottom
 * - Loads previous chapters on demand (for navigation)
 */
export function useInfiniteChapters() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const komik = useReaderStore(state => state.komik);
  const activeChapter = useReaderStore(state => state.activeChapter);
  const loadedChapters = useReaderStore(state => state.loadedChapters);
  const upsertLoadedChapter = useReaderStore(state => state.upsertLoadedChapter);
  const setLoadingChapter = useReaderStore(state => state.setLoadingChapter);

  const [error, setError] = useState(null);
  const nextChapterIdRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // Fetch chapter URL helper
  const getChapterUrl = useCallback(async (chapterId) => {
    const response = await fetchChapters(komik, nsfwEnabled);
    const chapters = response?.data || [];
    return chapters.find(item => item.chapter === chapterId)?.url;
  }, [komik, nsfwEnabled]);

  // Load single chapter
  const loadChapter = useCallback(async (chapterId) => {
    // Already loaded with data
    if (loadedChapters.entities[chapterId]?.loaded) {
      return;
    }

    // Already loading
    if (loadedChapters.entities[chapterId]?.loading || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoadingChapter(chapterId, true);
    setError(null);

    // Mark as loading in state
    upsertLoadedChapter(chapterId, {
      id: chapterId,
      loading: true,
      loaded: false,
      error: null,
      data: [],
      title: ''
    });

    try {
      const chapterUrl = await getChapterUrl(chapterId);
      if (!chapterUrl) {
        throw new Error(`Chapter URL not found for ${chapterId}`);
      }

      const dataResponse = await fetchChapterData(chapterUrl, nsfwEnabled);

      upsertLoadedChapter(chapterId, {
        id: chapterId,
        loading: false,
        loaded: true,
        error: null,
        data: dataResponse?.data || [],
        title: dataResponse?.title || ''
      });
    } catch (err) {
      setError(err.message);
      upsertLoadedChapter(chapterId, {
        id: chapterId,
        loading: false,
        loaded: false,
        error: err.message,
        data: [],
        title: ''
      });
    } finally {
      setLoadingChapter(chapterId, false);
      isLoadingRef.current = false;
    }
  }, [loadedChapters, getChapterUrl, nsfwEnabled, upsertLoadedChapter, setLoadingChapter]);

  // Load multiple chapters (for preload)
  const loadChapters = useCallback(async (chapterIds) => {
    for (const chapterId of chapterIds) {
      await loadChapter(chapterId);
    }
  }, [loadChapter]);

  // Retry failed chapter
  const retryChapter = useCallback((chapterId) => {
    loadChapter(chapterId);
  }, [loadChapter]);

  // Get next chapter ID based on currently visible chapter
  const getNextChapterId = useCallback(async () => {
    if (!activeChapter) return null;

    const response = await fetchChapters(komik, nsfwEnabled);
    const chapters = response?.data || [];
    const allChapterIds = chapters.map(item => item.chapter);
    const currentIndex = allChapterIds.indexOf(activeChapter);

    if (currentIndex > 0) {
      return allChapterIds[currentIndex - 1];
    }
    return null;
  }, [activeChapter, komik, nsfwEnabled]);

  // Get previous chapter ID based on currently visible chapter
  const getPreviousChapterId = useCallback(async () => {
    if (!activeChapter) return null;

    const response = await fetchChapters(komik, nsfwEnabled);
    const chapters = response?.data || [];
    const allChapterIds = chapters.map(item => item.chapter);
    const currentIndex = allChapterIds.indexOf(activeChapter);

    if (currentIndex < allChapterIds.length - 1) {
      return allChapterIds[currentIndex + 1];
    }
    return null;
  }, [activeChapter, komik, nsfwEnabled]);

  // Initialize: load active chapter
  useEffect(() => {
    if (!komik || !activeChapter) return;
    if (hasInitializedRef.current) return;

    hasInitializedRef.current = true;
    loadChapter(activeChapter);
  }, [komik, activeChapter, loadChapter]);

  // Update next chapter ID when chapters change
  useEffect(() => {
    const updateNextChapter = async () => {
      const nextId = await getNextChapterId();
      nextChapterIdRef.current = nextId;
    };

    updateNextChapter();
  }, [loadedChapters.ids, getNextChapterId]);

  // Handle sentinel intersection - use ref to avoid dependency issues
  const handleSentinelIntersectionRef = useRef(null);
  handleSentinelIntersectionRef.current = () => {
    if (!nextChapterIdRef.current || isLoadingRef.current) return;

    const nextId = nextChapterIdRef.current;
    if (loadedChapters.entities[nextId]?.loaded) return;

    // Defer to next tick to avoid React DOM conflicts
    requestAnimationFrame(() => {
      loadChapter(nextId);
    });
  };

  // Stable callback that uses ref
  const handleSentinelIntersection = useCallback(() => {
    handleSentinelIntersectionRef.current?.();
  }, []);

  return {
    loadedChapters,
    loadChapter,
    loadChapters,
    retryChapter,
    error,
    getNextChapterId,
    getPreviousChapterId,
    handleSentinelIntersection
  };
}
