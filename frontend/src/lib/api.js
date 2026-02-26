const API_BASE = '/komik';

async function fetchWithError(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function getChapters(comicUrl, mode = 'normal') {
  const params = new URLSearchParams({ url: comicUrl });
  if (mode === 'nsfw') params.append('mode', 'secret');
  return fetchWithError(`${API_BASE}/chapters?${params}`);
}

export async function getChapterData(chapterUrl, mode = 'normal') {
  const params = new URLSearchParams({ url: chapterUrl });
  if (mode === 'nsfw') params.append('mode', 'secret');
  return fetchWithError(`${API_BASE}/data?${params}`);
}

export async function getCachedComics() {
  return fetchWithError(`${API_BASE}/cached-comics`);
}
