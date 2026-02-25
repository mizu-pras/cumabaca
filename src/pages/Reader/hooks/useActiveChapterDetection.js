import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/stores/readerStore';

export function useActiveChapterDetection(loadedChapterIds) {
  const setActiveChapter = useReaderStore(state => state.setActiveChapter);
  const observerRef = useRef(null);
  const observedElementsRef = useRef(new Set());
  const setActiveChapterRef = useRef(setActiveChapter);

  // Keep ref in sync
  useEffect(() => {
    setActiveChapterRef.current = setActiveChapter;
  }, [setActiveChapter]);

  useEffect(() => {
    // SSR guard
    if (typeof document === 'undefined') return;

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Find all intersecting entries
        const visibleEntries = entries.filter(entry => entry.isIntersecting);

        if (visibleEntries.length === 0) return;

        // Sort by position (top to bottom)
        visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        // Get the topmost visible chapter
        const topmostEntry = visibleEntries[0];
        const newActiveChapter = topmostEntry.target.dataset.chapterId;

        if (newActiveChapter && setActiveChapterRef.current) {
          setActiveChapterRef.current(newActiveChapter);
        }
      },
      {
        root: null,
        rootMargin: '-10% 0px -10% 0px', // Trigger when element is in middle 80% of viewport
        threshold: 0,
      }
    );

    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observedElementsRef.current.clear();
    };
  }, []); // Empty deps - run once on mount

  // Observe elements when loadedChapterIds changes
  useEffect(() => {
    if (loadedChapterIds.length === 0) return;

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      const firstImages = document.querySelectorAll('[data-chapter-first="true"]');
      firstImages.forEach((img) => {
        if (!observedElementsRef.current.has(img) && observerRef.current) {
          observerRef.current.observe(img);
          observedElementsRef.current.add(img);
        }
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [loadedChapterIds]);
}
