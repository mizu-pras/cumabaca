# Infinite Scroll Fixes Design Document

**Date:** 2025-02-25
**Status:** Approved

## Problem Statement

The infinite scroll feature has three critical bugs:

1. **Infinite scroll only works once**: After loading chapter 2 via scroll, it stops loading further chapters
2. **Chapter selector shows wrong value**: When viewing images from chapter 2, selector still shows chapter 1
3. **Navigation controls don't work**: Next/Prev buttons and chapter selector don't properly navigate to other chapters

## Root Cause Analysis

### Bug 1: Infinite scroll stops after first load
- **Cause**: `getNextChapterId()` in `useInfiniteChapters.js` uses `activeChapter` to determine next chapter
- **Issue**: `activeChapter` never changes during infinite scroll; only `activeScrollChapter` updates
- **Result**: After loading chapter 2, `nextChapterIdRef.current` remains stale (points to chapter 2 again)

### Bug 2: Selector doesn't sync with viewport
- **Cause**: Selector value uses `activeScrollChapter || activeChapter`, but `onChange` only sets `activeChapter`
- **Issue**: `activeScrollChapter` updates correctly via `useActiveChapterDetection`, but the sync isn't bidirectional
- **Result**: Selector displays stale value when user scrolls through loaded chapters

### Bug 3: Navigation controls broken
- **Cause**: NavigationControls tries to `scrollIntoView` elements that don't exist
- **Issue**: When navigating to an unloaded chapter, the DOM element hasn't been created yet
- **Result**: Navigation fails silently or scrolls to wrong location

## Proposed Solution

### Architecture Decision

Two distinct loading behaviors:

1. **Infinite Scroll Loading** (implicit):
   - Trigger: User scrolls near bottom
   - Action: Load next chapter, append to DOM
   - State: Update `activeScrollChapter` based on viewport
   - Preserve: All previously loaded chapters

2. **Explicit Navigation** (user-initiated):
   - Trigger: User clicks Next/Prev/Selector
   - Action: Clear all loaded chapters, load selected chapter, replace DOM
   - State: Reset `activeScrollChapter`, set new `activeChapter`
   - Scroll: Reset to top of newly loaded chapter

### Component Changes

#### 1. readerStore.js
Add `clearAndLoadChapter(chapterId)` action:
```javascript
clearAndLoadChapter: (chapterId) => set((state) => ({
  activeChapter: chapterId,
  activeScrollChapter: chapterId,
  loadedChapters: { entities: {}, ids: [] },
  loadingChapters: { [chapterId]: true }
}))
```

#### 2. useInfiniteChapters.js
Change `getNextChapterId` and `getPreviousChapterId`:
- Use `activeScrollChapter` instead of `activeChapter`
- Update dependency arrays to include `activeScrollChapter`

#### 3. ChapterSelector.jsx
Change `onChange` handler:
```javascript
onChange={(e) => clearAndLoadChapter(e.target.value)}
```

#### 4. NavigationControls.jsx
Replace scroll-based navigation with store-based:
```javascript
const handleNext = () => {
  if (hasNext) {
    const nextId = ids[currentIndex - 1];
    clearAndLoadChapter(nextId);
  }
};
```

### Data Flow

```
Infinite Scroll Flow:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ User scrolls    │───▶│ Sentinel         │───▶│ Load next       │
│ near bottom     │    │ intersects       │    │ chapter         │
└─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ Append to DOM   │
                                                  │ Update          │
                                                  │ activeScroll    │
                                                  └─────────────────┘

Explicit Navigation Flow:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ User clicks     │───▶│ Clear all        │───▶│ Load selected   │
│ Next/Prev/Select│    │ loaded chapters  │    │ chapter         │
└─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ Replace DOM     │
                                                  │ Reset scroll    │
                                                  │ Set both active │
                                                  │ chapters        │
                                                  └─────────────────┘
```

## Testing Checklist

- [ ] Start at chapter 1, scroll to load chapter 2, then chapter 3
- [ ] Scroll through chapters, verify selector updates automatically
- [ ] Click Next from chapter 1 → clears and loads chapter 2
- [ ] Click Prev from chapter 2 → clears and loads chapter 3
- [ ] Select chapter 10 from chapter 1 → clears and loads chapter 10
- [ ] Scroll back up through previously loaded chapters
- [ ] Verify no React errors in console

## Implementation Order

1. Add `clearAndLoadChapter` to readerStore
2. Fix `getNextChapterId`/`getPreviousChapterId` in useInfiniteChapters
3. Update ChapterSelector to use `clearAndLoadChapter`
4. Update NavigationControls to use `clearAndLoadChapter`
5. Test all scenarios

## Notes

- `activeChapter`: Persisted, represents user's explicit selection
- `activeScrollChapter`: Not persisted, represents viewport position
- Selector value: `activeScrollChapter || activeChapter` (auto-syncs with scroll)
- Infinite scroll: Uses `activeScrollChapter` to find next chapter
- Explicit navigation: Clears all, loads fresh, resets both states
