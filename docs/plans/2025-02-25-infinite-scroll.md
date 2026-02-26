# Infinite Scroll Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement infinite scroll for comic reader with automatic chapter loading, active chapter detection, and scroll position persistence.

**Architecture:** Single Component with Loaded Chapters Array - all loaded chapters rendered in one component with Intersection Observer for active chapter detection.

**Tech Stack:** React 19, Zustand, Intersection Observer API, LocalStorage

---

## Task 1: Update readerStore with New State

**Files:**
- Modify: `src/stores/readerStore.js`

**Step 1: Add new state properties**

Add `loadedChapterIds` and `activeScrollChapter` to the store:

```javascript
export const useReaderStore = create(
  persist(
    (set) => ({
      // Current comic state
      komik: null,
      activeChapter: null,

      // Infinite scroll state
      loadedChapterIds: [],
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
        loadedChapterIds: [...state.loadedChapterIds, id].filter((v, i, a) => a.indexOf(v) === i)
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
```

**Step 2: Commit**

```bash
git add src/stores/readerStore.js
git commit -m "feat: add infinite scroll state to readerStore"
```

---

## Task 2: Create useScrollPosition Hook

**Files:**
- Create: `src/pages/Reader/hooks/useScrollPosition.js`

**Step 1: Create the hook file**

```javascript
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

export function useScrollPosition() {
  const komik = useReaderStore(state => state.komik);
  const activeScrollChapter = useReaderStore(state => state.activeScrollChapter);
  const restoringRef = useRef(false);

  // Save scroll position
  useEffect(() => {
    if (!komik || !activeScrollChapter || restoringRef.current) return;

    const handleScroll = throttle(() => {
      const scrollKey = `cumabaca_scroll_${komik}_${activeScrollChapter}`;
      localStorage.setItem(scrollKey, window.scrollY.toString());
    }, 200);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [komik, activeScrollChapter]);

  // Restore scroll position when active chapter changes
  useEffect(() => {
    if (!komik || !activeScrollChapter) return;

    const scrollKey = `cumabaca_scroll_${komik}_${activeScrollChapter}`;
    const savedPosition = localStorage.getItem(scrollKey);

    if (savedPosition) {
      restoringRef.current = true;
      // Small delay to ensure content is rendered
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedPosition, 10), behavior: 'auto' });
        restoringRef.current = false;
      }, 100);
    }
  }, [activeScrollChapter, komik]);
}
```

**Step 2: Commit**

```bash
git add src/pages/Reader/hooks/useScrollPosition.js
git commit -m "feat: add useScrollPosition hook for persistence"
```

---

## Task 3: Create useActiveChapterDetection Hook

**Files:**
- Create: `src/pages/Reader/hooks/useActiveChapterDetection.js`

**Step 1: Create the hook file**

```javascript
import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/stores/readerStore';

export function useActiveChapterDetection(loadedChapterIds) {
  const activeChapter = useReaderStore(state => state.activeChapter);
  const setActiveScrollChapter = useReaderStore(state => state.setActiveScrollChapter);
  const observerRef = useRef(null);

  useEffect(() => {
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
            if (newActiveChapter !== activeChapter) {
              setActiveScrollChapter(newActiveChapter);
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
      observer.disconnect();
    };
  }, [loadedChapterIds, activeChapter, setActiveScrollChapter]);

  return null;
}
```

**Step 2: Commit**

```bash
git add src/pages/Reader/hooks/useActiveChapterDetection.js
git commit -m "feat: add useActiveChapterDetection hook"
```

---

## Task 4: Create useInfiniteChapters Hook

**Files:**
- Create: `src/pages/Reader/hooks/useInfiniteChapters.js`

**Step 1: Create the hook file**

```javascript
import { useState, useEffect, useCallback } from 'react';
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

  // Load a single chapter
  const loadChapter = useCallback(async (chapterId) => {
    if (loadedChapterIds.includes(chapterId)) return;

    try {
      // Get chapter URL from chapter list
      const response = await fetchChapters(komik, nsfwEnabled);
      const chapters = response?.data || [];
      const chapterUrl = chapters.find(item => item.chapter === chapterId)?.url;

      if (!chapterUrl) {
        throw new Error(`Chapter URL not found for ${chapterId}`);
      }

      // Fetch chapter data
      const dataResponse = await fetchChapterData(chapterUrl, nsfwEnabled);

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
    }
  }, [komik, nsfwEnabled, loadedChapterIds, addLoadedChapterId]);

  // Memory management: remove old chapters
  useEffect(() => {
    if (loadedChapterIds.length <= 10) return;

    const allChaptersResponse = fetchChapters(komik, nsfwEnabled);
    allChaptersResponse.then(response => {
      const chapters = response?.data || [];
      const allChapterIds = chapters.map(item => item.chapter);
      const activeIndex = allChapterIds.indexOf(activeChapter);
      const keepRange = 5;

      const toRemove = loadedChapterIds.filter(id => {
        const index = allChapterIds.indexOf(id);
        return index < activeIndex - keepRange;
      });

      if (toRemove.length > 0) {
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
    });
  }, [activeChapter, loadedChapterIds, komik, nsfwEnabled, removeLoadedChapterId]);

  // Load active chapter and preload next chapters
  useEffect(() => {
    if (!komik || !activeChapter) return;

    setIsLoading(true);
    setError(null);

    // Load active chapter
    loadChapter(activeChapter);

    // Preload next 2-3 chapters
    fetchChapters(komik, nsfwEnabled).then(response => {
      const chapters = response?.data || [];
      const allChapterIds = chapters.map(item => item.chapter);
      const currentIndex = allChapterIds.indexOf(activeChapter);

      // Preload next 3 chapters (descending order)
      const toPreload = [];
      for (let i = 1; i <= 3; i++) {
        const nextId = allChapterIds[currentIndex - i];
        if (nextId && !loadedChapterIds.includes(nextId)) {
          toPreload.push(nextId);
        }
      }

      // Load in parallel
      toPreload.forEach(id => loadChapter(id));
    }).finally(() => {
      setIsLoading(false);
    });
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
```

**Step 2: Commit**

```bash
git add src/pages/Reader/hooks/useInfiniteChapters.js
git commit -m "feat: add useInfiniteChapters hook"
```

---

## Task 5: Create ChapterSeparator Component

**Files:**
- Create: `src/pages/Reader/components/ChapterSeparator.jsx`

**Step 1: Create the component file**

```javascript
import { ChevronDown, AlertCircle } from 'lucide-react';

export function ChapterSeparator({ chapter, title, error, onRetry }) {
  return (
    <div className="w-full max-w-250 mx-auto my-4 px-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChevronDown className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold">{chapter}</h2>
          {title && <span className="text-gray-600 dark:text-gray-400">- {title}</span>}
        </div>

        {error && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            type="button"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Retry</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-center">
            Failed to load {chapter}. Tap Retry to try again.
          </p>
          <p className="text-red-500 dark:text-red-400 text-sm text-center mt-1">
            Error: {error}
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Install lucide-react if not present**

Check package.json:
```bash
grep -q "lucide-react" package.json || npm install lucide-react
```

**Step 3: Commit**

```bash
git add src/pages/Reader/components/ChapterSeparator.jsx package.json package-lock.json
git commit -m "feat: add ChapterSeparator component"
```

---

## Task 6: Update ChapterContent Component

**Files:**
- Modify: `src/pages/Reader/components/ChapterContent.jsx`

**Step 1: Replace entire component with infinite scroll version**

```javascript
import { useInfiniteChapters } from '../hooks/useInfiniteChapters';
import { useActiveChapterDetection } from '../hooks/useActiveChapterDetection';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { ChapterSeparator } from './ChapterSeparator';
import { LoadingSpinner } from '@/components/LoadingSpinner/LoadingSpinner';

export function ChapterContent() {
  const { loadedChapters, retryChapter, isLoading } = useInfiniteChapters();

  // Setup hooks
  useActiveChapterDetection(loadedChapters.ids);
  useScrollPosition();

  if (isLoading && loadedChapters.ids.length === 0) {
    return <LoadingSpinner message="Loading chapter..." />;
  }

  if (loadedChapters.ids.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center mb-16">
      {loadedChapters.ids.map((chapterId, index) => {
        const chapter = loadedChapters.entities[chapterId];
        if (!chapter) return null;

        return (
          <div key={chapterId} className="w-full">
            {/* Chapter Separator */}
            <ChapterSeparator
              chapter={chapterId}
              title={chapter.title}
              error={chapter.error}
              onRetry={() => retryChapter(chapterId)}
            />

            {/* Chapter Content */}
            {chapter.loaded && !chapter.error && (
              <div className="flex flex-col items-center">
                {chapter.data.map((imgUrl, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={imgUrl}
                    alt={`Page ${imgIndex + 1}`}
                    className="w-full max-w-250"
                    loading="lazy"
                    data-chapter-first={imgIndex === 0}
                    data-chapter-id={chapterId}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/Reader/components/ChapterContent.jsx
git commit -m "feat: update ChapterContent for infinite scroll"
```

---

## Task 7: Update NavigationControls Component

**Files:**
- Modify: `src/pages/Reader/components/NavigationControls.jsx`

**Step 1: Update to scroll to chapter instead of changing active chapter**

```javascript
import { useChapterNavigation } from '../hooks/useChapterNavigation';
import { useReaderStore } from '@/stores/readerStore';

export function NavigationControls({ position = 'top' }) {
  const { hasNext, hasPrev } = useChapterNavigation();
  const loadedChapters = useReaderStore(state => state.loadedChapterIds);
  const activeChapter = useReaderStore(state => state.activeChapter);

  const handleNext = () => {
    if (!hasNext) return;
    const currentIndex = loadedChapters.indexOf(activeChapter);
    if (currentIndex > 0) {
      const nextChapterId = loadedChapters[currentIndex - 1];
      const nextChapterElement = document.querySelector(
        `[data-chapter-first="true"][data-chapter-id="${nextChapterId}"]`
      );
      nextChapterElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrev = () => {
    if (!hasPrev) return;
    const currentIndex = loadedChapters.indexOf(activeChapter);
    if (currentIndex < loadedChapters.length - 1) {
      const prevChapterId = loadedChapters[currentIndex + 1];
      const prevChapterElement = document.querySelector(
        `[data-chapter-first="true"][data-chapter-id="${prevChapterId}"]`
      );
      prevChapterElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="px-4 py-1 my-4 flex items-center justify-between">
      <button
        onClick={handlePrev}
        disabled={!hasPrev}
        type="button"
        className={`px-4 py-2 border-b border-gray-300 ${
          !hasPrev ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        Prev
      </button>
      <button
        onClick={handleNext}
        disabled={!hasNext}
        type="button"
        className={`px-4 py-2 border-b border-gray-300 ${
          !hasNext ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        Next
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/Reader/components/NavigationControls.jsx
git commit -m "feat: update NavigationControls for scroll shortcuts"
```

---

## Task 8: Update Reader Component

**Files:**
- Modify: `src/pages/Reader/Reader.jsx`

**Step 1: Update to use activeScrollChapter for selector sync**

```javascript
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useReaderStore } from '@/stores/readerStore';
import { ChapterForm } from './components/ChapterForm';
import { ChapterSelector } from './components/ChapterSelector';
import { ChapterContent } from './components/ChapterContent';
import { NavigationControls } from './components/NavigationControls';
import { BackToTop } from '@/components/BackToTop/BackToTop';
import { FloatingChapterSelector } from './components/FloatingChapterSelector';

function ReaderContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { komik, setKomik, activeChapter, setActiveScrollChapter, loadedChapterIds } = useReaderStore();

  // Sync URL -> store on mount and URL changes
  useEffect(() => {
    const urlFromQuery = searchParams.get('url');
    if (urlFromQuery && urlFromQuery !== komik) {
      setKomik(urlFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setKomik]);

  // Sync activeScrollChapter -> activeChapter for selector
  useEffect(() => {
    if (activeChapter !== activeScrollChapter && activeScrollChapter) {
      // Note: we don't set activeChapter here to avoid loop
      // The selector should read from activeScrollChapter instead
    }
  }, [activeChapter, activeScrollChapter]);

  // Update readerStore to use activeScrollChapter for selector
  // This requires ChapterSelector to use activeScrollChapter instead of activeChapter

  return (
    <>
      <ChapterForm />
      {komik && <ChapterSelector />}
      <NavigationControls position="top" />
      {activeChapter && <ChapterContent />}
      <NavigationControls position="bottom" />
      <BackToTop />
      <FloatingChapterSelector />
    </>
  );
}

export function Reader() {
  return (
    <Suspense fallback={<div className="px-4 py-8">Loading...</div>}>
      <ReaderContent />
    </Suspense>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/Reader/Reader.jsx
git commit -m "feat: update Reader for infinite scroll integration"
```

---

## Task 9: Update ChapterSelector to Use activeScrollChapter

**Files:**
- Modify: `src/pages/Reader/components/ChapterSelector.jsx`
- Modify: `src/pages/Reader/components/FloatingChapterSelector.jsx`

**Step 1: Read current ChapterSelector to understand structure**

Check the current implementation - update both components to read from `activeScrollChapter` instead of `activeChapter` for the selected value, while still writing to `activeChapter` when user selects.

**Step 2: Update ChapterSelector**

```javascript
// Find where activeChapter is used for the select value
// Change to use activeScrollChapter, fallback to activeChapter

const activeChapter = useReaderStore(state => state.activeChapter);
const activeScrollChapter = useReaderStore(state => state.activeScrollChapter);

// For select value, use activeScrollChapter if available
const selectedChapter = activeScrollChapter || activeChapter;
```

**Step 3: Update FloatingChapterSelector similarly**

**Step 4: Commit**

```bash
git add src/pages/Reader/components/ChapterSelector.jsx src/pages/Reader/components/FloatingChapterSelector.jsx
git commit -m "feat: sync selectors with activeScrollChapter"
```

---

## Task 10: Clean Up Unused Hooks

**Files:**
- Delete: `src/pages/Reader/hooks/useChapterData.js`
- Delete: `src/pages/Reader/hooks/useChapterPreload.js`

**Step 1: Remove unused hooks**

```bash
rm src/pages/Reader/hooks/useChapterData.js
rm src/pages/Reader/hooks/useChapterPreload.js
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove unused hooks after infinite scroll refactor"
```

---

## Task 11: Manual Testing

**Steps to test:**

1. **Start dev server:**
```bash
npm run dev
```

2. **Open browser and:**
   - Load a comic URL
   - Verify first chapter loads
   - Scroll to bottom → verify next chapter appears with separator
   - Check that 2-3 chapters are preloaded (network tab)
   - Scroll up/down → verify active chapter in selector changes
   - Refresh page → verify scroll position is restored
   - Open DevTools → Memory tab → verify no memory leaks

3. **Test edge cases:**
   - First chapter (prev button disabled)
   - Last chapter (no more to load)
   - Network error (disconnect network, load chapter)

---

## Task 12: Fix Bugs Found During Testing

**Step 1:** Address any bugs found in testing

**Step 2:** Commit fixes with descriptive messages

---

## Summary

This plan implements infinite scroll in 12 tasks:
1. Update readerStore
2. Create useScrollPosition hook
3. Create useActiveChapterDetection hook
4. Create useInfiniteChapters hook
5. Create ChapterSeparator component
6. Update ChapterContent
7. Update NavigationControls
8. Update Reader component
9. Update selectors
10. Clean up old hooks
11. Manual testing
12. Bug fixes

Each task is atomic and can be committed independently.
