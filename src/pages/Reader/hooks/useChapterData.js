import { use } from 'react';
import { getChapterDataResource } from '@/lib/data-sources';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useReaderStore } from '@/stores/readerStore';

export function useChapterData() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const activeChapter = useReaderStore(state => state.activeChapter);
  const chapters = useReaderStore(state => state.chapters.entities);
  const setChapterData = useReaderStore(state => state.setChapterData);

  const chapterUrl = chapters[activeChapter]?.url;

  if (!chapterUrl) {
    return { data: [], title: '', isLoading: true };
  }

  try {
    const resource = use(getChapterDataResource(chapterUrl, nsfwEnabled));
    const data = resource.data?.data || [];
    const title = resource.data?.title || '';

    // Update store with fetched data
    setChapterData(data, title);

    return { data, title, isLoading: false };
  } catch (promise) {
    return { data: [], title: '', isLoading: true };
  }
}
