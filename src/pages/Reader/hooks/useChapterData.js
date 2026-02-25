import { use } from 'react';
import { getChapterDataResource, getChaptersResource } from '@/lib/data-sources';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useReaderStore } from '@/stores/readerStore';

export function useChapterData() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const activeChapter = useReaderStore(state => state.activeChapter);
  const komik = useReaderStore(state => state.komik);

  if (!komik || !activeChapter) {
    return { data: [], title: '' };
  }

  // use() cannot be inside try/catch in React 19
  // Suspense handles pending states, ErrorBoundary handles errors

  // First get the chapter list to find the URL for activeChapter
  const chaptersResource = getChaptersResource(komik, nsfwEnabled);
  const chaptersData = use(chaptersResource);
  const chapterUrl = chaptersData.data?.find(item => item.chapter === activeChapter)?.url;

  if (!chapterUrl) {
    return { data: [], title: '' };
  }

  const resource = use(getChapterDataResource(chapterUrl, nsfwEnabled));
  const data = resource.data?.data || [];
  const title = resource.data?.title || '';

  return { data, title };
}
