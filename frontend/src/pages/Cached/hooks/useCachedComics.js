import { use } from 'react';
import { getCachedComics } from '@/lib/api';

let cache = new Map();

export function useCachedComics() {
  const key = 'cached-comics';

  if (cache.has(key)) {
    const resource = cache.get(key);
    if (resource.status === 'success') return resource.data;
    if (resource.status === 'error') throw resource.error;
    if (resource.status === 'pending') throw resource.promise;
  }

  const promise = getCachedComics()
    .then(data => {
      cache.set(key, { data, status: 'success' });
      return data;
    })
    .catch(error => {
      cache.set(key, { error, status: 'error' });
      throw error;
    });

  cache.set(key, { promise, status: 'pending' });
  throw promise;
}
