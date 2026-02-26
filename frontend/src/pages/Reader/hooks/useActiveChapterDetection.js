import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/stores/readerStore';

// Throttle utility function
function throttle(func, wait) {
  let timeout;
  let lastRan;
  return function(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if ((Date.now() - lastRan) >= wait) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, wait - (Date.now() - lastRan));
    }
  };
}

export function useActiveChapterDetection(loadedChapterIds) {
  const setActiveChapter = useReaderStore(state => state.setActiveChapter);
  const setActiveChapterRef = useRef(setActiveChapter);

  // Keep ref in sync
  useEffect(() => {
    setActiveChapterRef.current = setActiveChapter;
  }, [setActiveChapter]);

  useEffect(() => {
    if (loadedChapterIds.length === 0) return;

    // Function to find active chapter based on separator positions
    const updateActiveChapter = () => {
      const separators = document.querySelectorAll('[data-chapter-separator]');
      if (separators.length === 0) return;

      // Find the last separator that is above or at the top of viewport
      // This means we've scrolled past it, so we're in that chapter
      let activeChapterId = null;

      for (let i = 0; i < separators.length; i++) {
        const separator = separators[i];
        const rect = separator.getBoundingClientRect();

        // If separator is above the viewport (top <= 0) or near top (within first 100px)
        // This chapter should be active
        if (rect.top <= 100) {
          activeChapterId = separator.dataset.chapterSeparator;
        } else {
          // Separators are in order, so once we find one below, stop
          break;
        }
      }

      // If no separator is above, use the first one
      if (!activeChapterId && separators.length > 0) {
        activeChapterId = separators[0].dataset.chapterSeparator;
      }

      if (activeChapterId && setActiveChapterRef.current) {
        setActiveChapterRef.current(activeChapterId);
      }
    };

    // Initial check
    const timeoutId = setTimeout(() => {
      updateActiveChapter();
    }, 100);

    // Throttled scroll handler
    const handleScroll = throttle(() => {
      updateActiveChapter();
    }, 100);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [loadedChapterIds]);
}
