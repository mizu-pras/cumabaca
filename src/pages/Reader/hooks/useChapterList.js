import { use } from 'react';
import { getChaptersResource } from '@/lib/data-sources';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useReaderStore } from '@/stores/readerStore';

export function useChapterList() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const komik = useReaderStore(state => state.komik);
  const setChapters = useReaderStore(state => state.setChapters);

  if (!komik) {
    return { entities: {}, ids: [], isLoading: true };
  }

  try {
    const data = use(getChaptersResource(komik, nsfwEnabled));
    const entities = data.data?.reduce((acc, item) => {
      acc[item.chapter] = item;
      return acc;
    }, {}) || {};
    const ids = data.data?.map(item => item.chapter) || [];

    // Update store with fetched data
    setChapters({ entities, ids });

    return { entities, ids, isLoading: false };
  } catch (promise) {
    return { entities: {}, ids: [], isLoading: true };
  }
}
