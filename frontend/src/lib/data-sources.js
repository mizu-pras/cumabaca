import { getChapters, getChapterData } from './api';

// Simple promise cache for Suspense
// Map: key -> Promise (same promise instance is critical for Suspense)
const promiseCache = new Map();

export function fetchChapters(comicUrl, nsfwEnabled) {
  const key = `chapters-${comicUrl}-${nsfwEnabled}`;

  // Return existing promise if available (critical for Suspense)
  if (promiseCache.has(key)) {
    return promiseCache.get(key);
  }

  // Create new promise and cache it
  const promise = getChapters(comicUrl, nsfwEnabled ? 'nsfw' : 'normal')
    .then(data => {
      // Keep promise in cache after success (data stays in promise)
      return data;
    })
    .catch(error => {
      // Remove from cache on error so it can be retried
      promiseCache.delete(key);
      throw error;
    });

  promiseCache.set(key, promise);
  return promise;
}

export function fetchChapterData(chapterUrl, nsfwEnabled) {
  const key = `chapter-${chapterUrl}-${nsfwEnabled}`;

  if (promiseCache.has(key)) {
    return promiseCache.get(key);
  }

  const promise = getChapterData(chapterUrl, nsfwEnabled ? 'nsfw' : 'normal')
    .then(data => {
      return data;
    })
    .catch(error => {
      promiseCache.delete(key);
      throw error;
    });

  promiseCache.set(key, promise);
  return promise;
}

// Resource functions - return the promise directly
export function getChaptersResource(comicUrl, nsfwEnabled) {
  return fetchChapters(comicUrl, nsfwEnabled);
}

export function getChapterDataResource(chapterUrl, nsfwEnabled) {
  return fetchChapterData(chapterUrl, nsfwEnabled);
}

export function clearDataCache() {
  promiseCache.clear();
}
