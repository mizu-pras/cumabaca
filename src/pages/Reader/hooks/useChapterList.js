import { use } from 'react';
import { getChaptersResource } from '@/lib/data-sources';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useReaderStore } from '@/stores/readerStore';

export function useChapterList() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const komik = useReaderStore(state => state.komik);

  if (!komik) {
    return { entities: {}, ids: [] };
  }

  // use() cannot be inside try/catch in React 19
  // Suspense handles pending states, ErrorBoundary handles errors
  const data = use(getChaptersResource(komik, nsfwEnabled));
  const entities = data.data?.reduce((acc, item) => {
    acc[item.chapter] = item;
    return acc;
  }, {}) || {};
  const ids = data.data?.map(item => item.chapter) || [];

  return { entities, ids };
}
