# Infinite Scroll Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three infinite scroll bugs: load only once, wrong chapter in selector, broken navigation controls

**Architecture:** Separate infinite scroll (append, preserve state) from explicit navigation (clear, reload, reset scroll). Use `activeScrollChapter` for viewport tracking, `activeChapter` for user selection.

**Tech Stack:** React 19 hooks, Zustand state management, Intersection Observer API

---

### Task 1: Add clearAndLoadChapter action to readerStore

**Files:**
- Modify: `src/stores/readerStore.js`

**Step 1: Read current readerStore implementation**

Run: `cat src/stores/readerStore.js`

Verify the store structure and existing actions.

**Step 2: Add clearAndLoadChapter action**

Add this action after the `setActiveScrollChapter` action (around line 29):

```javascript
clearAndLoadChapter: (chapterId) => set((state) => ({
  activeChapter: chapterId,
  activeScrollChapter: chapterId,
  loadedChapters: { entities: {}, ids: [] },
  loadingChapters: { [chapterId]: true }
})),
```

**Step 3: Verify syntax**

Run: `npm run build:react` or check for no lint errors

Expected: Build succeeds without errors

**Step 4: Commit**

```bash
git add src/stores/readerStore.js
git commit -m "feat: add clearAndLoadChapter action to readerStore"
```

---

### Task 2: Fix getNextChapterId to use activeScrollChapter

**Files:**
- Modify: `src/pages/Reader/hooks/useInfiniteChapters.js`

**Step 1: Read current useInfiniteChapters implementation**

Run: `cat src/pages/Reader/hooks/useInfiniteChapters.js`

Locate the `getNextChapterId` function (around line 103).

**Step 2: Replace getNextChapterId implementation**

Replace the entire `getNextChapterId` function (lines 103-115):

```javascript
// Get next chapter ID based on currently visible chapter
const getNextChapterId = useCallback(async () => {
  // Use activeScrollChapter for viewport-based loading
  const currentChapter = activeScrollChapter || activeChapter;
  if (!currentChapter) return null;

  const response = await fetchChapters(komik, nsfwEnabled);
  const chapters = response?.data || [];
  const allChapterIds = chapters.map(item => item.chapter);
  const currentIndex = allChapterIds.indexOf(currentChapter);

  if (currentIndex > 0) {
    return allChapterIds[currentIndex - 1];
  }
  return null;
}, [activeScrollChapter, activeChapter, komik, nsfwEnabled]);
```

**Step 3: Fix getPreviousChapterId similarly**

Replace the entire `getPreviousChapterId` function (lines 118-130):

```javascript
// Get previous chapter ID based on currently visible chapter
const getPreviousChapterId = useCallback(async () => {
  // Use activeScrollChapter for viewport-based loading
  const currentChapter = activeScrollChapter || activeChapter;
  if (!currentChapter) return null;

  const response = await fetchChapters(komik, nsfwEnabled);
  const chapters = response?.data || [];
  const allChapterIds = chapters.map(item => item.chapter);
  const currentIndex = allChapterIds.indexOf(currentChapter);

  if (currentIndex < allChapterIds.length - 1) {
    return allChapterIds[currentIndex + 1];
  }
  return null;
}, [activeScrollChapter, activeChapter, komik, nsfwEnabled]);
```

**Step 4: Add activeScrollChapter to hook state**

Add this line at the top with other store selectors (around line 15):

```javascript
const activeScrollChapter = useReaderStore(state => state.activeScrollChapter);
```

**Step 5: Verify syntax**

Run: `npm run build:react`

Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/pages/Reader/hooks/useInfiniteChapters.js
git commit -m "fix: use activeScrollChapter for infinite scroll next/prev detection"
```

---

### Task 3: Update ChapterSelector to use clearAndLoadChapter

**Files:**
- Modify: `src/pages/Reader/components/ChapterSelector.jsx`

**Step 1: Read current ChapterSelector implementation**

Run: `cat src/pages/Reader/components/ChapterSelector.jsx`

**Step 2: Update the component to use clearAndLoadChapter**

Replace the entire file content:

```javascript
import { useReaderStore } from '@/stores/readerStore';
import { useChapterList } from '../hooks/useChapterList';

export function ChapterSelector() {
  const { ids, isLoading } = useChapterList();
  const { activeScrollChapter, activeChapter, setActiveChapter, clearAndLoadChapter } = useReaderStore();

  const handleChange = (e) => {
    const selectedChapter = e.target.value;
    // Use clearAndLoadChapter for explicit navigation
    clearAndLoadChapter(selectedChapter);
  };

  return (
    <div className="px-4 py-1 mt-4 flex items-center gap-2">
      <label htmlFor="chapter">Pilih Bab:</label>
      <select
        id="chapter"
        name="chapter"
        value={activeScrollChapter || activeChapter || ''}
        onChange={handleChange}
        disabled={isLoading || ids.length === 0}
        className="px-4 py-2 border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-gray-500 transition-colors"
      >
        {ids.map(id => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>
    </div>
  );
}
```

**Step 3: Verify syntax**

Run: `npm run build:react`

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/pages/Reader/components/ChapterSelector.jsx
git commit -m "fix: use clearAndLoadChapter for explicit chapter selection"
```

---

### Task 4: Update NavigationControls to use clearAndLoadChapter

**Files:**
- Modify: `src/pages/Reader/components/NavigationControls.jsx`

**Step 1: Read current NavigationControls implementation**

Run: `cat src/pages/Reader/components/NavigationControls.jsx`

**Step 2: Replace with simplified implementation**

Replace the entire file content:

```javascript
import { useReaderStore } from '@/stores/readerStore';
import { useChapterList } from '../hooks/useChapterList';

export function NavigationControls({ position = 'top' }) {
  const { ids } = useChapterList();
  const { activeScrollChapter, activeChapter, clearAndLoadChapter } = useReaderStore();

  // Use currently visible chapter for navigation
  const currentChapter = activeScrollChapter || activeChapter;
  const currentIndex = ids.indexOf(currentChapter);

  const hasNext = currentIndex > 0;
  const hasPrev = currentIndex < ids.length - 1;

  const handleNext = () => {
    if (hasNext) {
      const nextChapterId = ids[currentIndex - 1];
      clearAndLoadChapter(nextChapterId);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      const prevChapterId = ids[currentIndex + 1];
      clearAndLoadChapter(prevChapterId);
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

**Step 3: Verify syntax**

Run: `npm run build:react`

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/pages/Reader/components/NavigationControls.jsx
git commit -m "fix: use clearAndLoadChapter for next/prev navigation"
```

---

### Task 5: Update useInfiniteChapters initialization effect

**Files:**
- Modify: `src/pages/Reader/hooks/useInfiniteChapters.js`

**Step 1: Locate the initialization effect**

Find the `useEffect` that loads active chapter on mount (around line 133).

**Step 2: Update the effect to also set activeScrollChapter**

Replace the initialization effect (lines 133-139):

```javascript
// Initialize: load active chapter and sync scroll chapter
useEffect(() => {
  if (!komik || !activeChapter) return;
  if (hasInitializedRef.current) return;

  hasInitializedRef.current = true;
  loadChapter(activeChapter);
  // Sync activeScrollChapter on initial load
  setActiveScrollChapter(activeChapter);
}, [komik, activeChapter, loadChapter, setActiveScrollChapter]);
```

**Step 3: Add setActiveScrollChapter to hook state**

Add this line at the top with other store selectors (around line 18):

```javascript
const setActiveScrollChapter = useReaderStore(state => state.setActiveScrollChapter);
```

**Step 4: Verify syntax**

Run: `npm run build:react`

Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/pages/Reader/hooks/useInfiniteChapters.js
git commit -m "fix: sync activeScrollChapter on initial load"
```

---

### Task 6: Manual testing and verification

**Files:**
- None (manual testing)

**Step 1: Start development server**

Run: `npm run dev:react`

Expected: Server starts on http://localhost:5173

**Step 2: Test infinite scroll**

1. Load a comic with multiple chapters
2. Scroll to bottom of chapter 1
3. Verify chapter 2 loads automatically
4. Continue scrolling to bottom of chapter 2
5. Verify chapter 3 loads automatically

**Step 3: Test selector auto-sync**

1. Scroll through loaded chapters
2. Verify chapter selector dropdown updates to show current visible chapter

**Step 4: Test explicit navigation**

1. Click "Next" button → should clear and load next chapter
2. Click "Prev" button → should clear and load previous chapter
3. Select a chapter from dropdown → should clear and load that chapter

**Step 5: Check for console errors**

Open browser DevTools console
Expected: No React errors or warnings

**Step 6: Commit design document**

```bash
git add docs/plans/2025-02-25-infinite-scroll-fixes-design.md
git add docs/plans/2025-02-25-infinite-scroll-fixes.md
git commit -m "docs: add infinite scroll fixes design and implementation plan"
```

---

## Testing Checklist

After implementation, verify:

- [ ] Infinite scroll works multiple times (chapter 1 → 2 → 3 → 4...)
- [ ] Chapter selector shows current visible chapter while scrolling
- [ ] Next button clears and loads next chapter
- [ ] Prev button clears and loads previous chapter
- [ ] Chapter selector dropdown clears and loads selected chapter
- [ ] No React errors in console
- [ ] Scroll position resets when using explicit navigation

## Rollback Plan

If issues arise:
```bash
git reset --hard HEAD~6  # Reset all 6 commits
```

Then investigate specific issue before re-applying changes.
