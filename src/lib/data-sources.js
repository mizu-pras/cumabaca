import { getChapters, getChapterData } from './api';

let cache = new Map();

export function fetchChapters(comicUrl, nsfwEnabled) {
  const key = `chapters-${comicUrl}-${nsfwEnabled}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const promise = getChapters(comicUrl, nsfwEnabled ? 'nsfw' : 'normal')
    .then(data => {
      cache.set(key, { data, status: 'success' });
      return data;
    })
    .catch(error => {
      cache.set(key, { error, status: 'error' });
      throw error;
    });

  cache.set(key, { promise, status: 'pending' });
  return promise;
}

export function getChaptersResource(comicUrl, nsfwEnabled) {
  const key = `chapters-${comicUrl}-${nsfwEnabled}`;
  const resource = cache.get(key);

  if (resource?.status === 'success') return resource.data;
  if (resource?.status === 'error') throw resource.error;
  if (resource?.status === 'pending') throw resource.promise;

  return fetchChapters(comicUrl, nsfwEnabled);
}

export function fetchChapterData(chapterUrl, nsfwEnabled) {
  const key = `chapter-${chapterUrl}-${nsfwEnabled}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const promise = getChapterData(chapterUrl, nsfwEnabled ? 'nsfw' : 'normal')
    .then(data => {
      cache.set(key, { data, status: 'success' });
      return data;
    })
    .catch(error => {
      cache.set(key, { error, status: 'error' });
      throw error;
    });

  cache.set(key, { promise, status: 'pending' });
  return promise;
}

export function getChapterDataResource(chapterUrl, nsfwEnabled) {
  const key = `chapter-${chapterUrl}-${nsfwEnabled}`;
  const resource = cache.get(key);

  if (resource?.status === 'success') return resource;
  if (resource?.status === 'error') throw resource.error;
  if (resource?.status === 'pending') throw resource.promise;

  return fetchChapterData(chapterUrl, nsfwEnabled);
}

export function clearDataCache() {
  cache.clear();
}
