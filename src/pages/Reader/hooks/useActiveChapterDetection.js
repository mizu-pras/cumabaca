import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/stores/readerStore';

export function useActiveChapterDetection(loadedChapterIds) {
  const activeChapter = useReaderStore(state => state.activeChapter);
  const setActiveChapter = useReaderStore(state => state.setActiveChapter);
  const observerRef = useRef(null);
  const activeChapterRef = useRef(activeChapter);

  // Keep ref in sync with activeChapter
  useEffect(() => {
    activeChapterRef.current = activeChapter;
  }, [activeChapter]);

  useEffect(() => {
    // SSR guard
    if (typeof document === 'undefined') return;

    // Don't observe if no chapters loaded
    if (loadedChapterIds.length === 0) return;

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Find all intersecting entries
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);

        if (intersectingEntries.length > 0) {
          // Get the chapter IDs from intersecting entries
          const visibleChapters = intersectingEntries
            .map(entry => entry.target.dataset.chapterId)
            .filter(Boolean);

          if (visibleChapters.length > 0) {
            // Use the first visible chapter (topmost)
            const newActiveChapter = visibleChapters[0];
            if (newActiveChapter !== activeChapterRef.current) {
              setActiveChapter(newActiveChapter);
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0,
      }
    );

    observerRef.current = observer;

    // Observe all first images
    const firstImages = document.querySelectorAll('[data-chapter-first="true"]');
    firstImages.forEach(img => observer.observe(img));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loadedChapterIds, setActiveChapter]);
}
