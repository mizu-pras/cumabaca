import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/stores/readerStore';

// Safe localStorage operations with error handling
const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to save scroll position:', error);
  }
};

const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to retrieve scroll position:', error);
    return null;
  }
};

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

export function useScrollPosition() {
  const komik = useReaderStore(state => state.komik);
  const activeChapter = useReaderStore(state => state.activeChapter);
  const restoringRef = useRef(false);
  const timeoutRef = useRef(null);

  // Save scroll position
  useEffect(() => {
    if (!komik || !activeChapter || restoringRef.current) return;

    const handleScroll = throttle(() => {
      const scrollKey = `cumabaca_scroll_${komik}_${activeChapter}`;
      safeSetItem(scrollKey, window.scrollY.toString());
    }, 200);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [komik, activeChapter]);

  // Restore scroll position when active chapter changes
  useEffect(() => {
    if (!komik || !activeChapter) return;

    // Clear any pending restoration to prevent race conditions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const scrollKey = `cumabaca_scroll_${komik}_${activeChapter}`;
    const savedPosition = safeGetItem(scrollKey);

    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      // Validate parsed position before using it
      if (!isNaN(position) && position >= 0) {
        restoringRef.current = true;
        // Small delay to ensure content is rendered
        timeoutRef.current = setTimeout(() => {
          window.scrollTo({ top: position, behavior: 'auto' });
          restoringRef.current = false;
          timeoutRef.current = null;
        }, 100);
      }
    }

    // Cleanup function to clear timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [activeChapter, komik]);
}
