import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useChapterList } from './useChapterList';
import { fetchChapterData } from '@/lib/data-sources';

export function useChapterPreload() {
  const { activeChapter, setPreloaded } = useReaderStore(state => ({
    activeChapter: state.activeChapter,
    setPreloaded: state.setPreloaded,
  }));
  const { ids, entities } = useChapterList();
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    // Reset preload flag when chapter changes
    hasPreloadedRef.current = false;
  }, [activeChapter]);

  useEffect(() => {
    if (hasPreloadedRef.current) return;
    if (!activeChapter) return;

    // Simple preload trigger - preload next chapter
    const curChapterIndex = ids.indexOf(activeChapter);
    const nextChapterIndex = curChapterIndex - 1;

    if (nextChapterIndex < 0) return;

    const nextChapter = ids[nextChapterIndex];
    const nextChapterUrl = entities[nextChapter]?.url;

    if (!nextChapterUrl) return;

    // Preload next chapter
    fetchChapterData(nextChapterUrl, nsfwEnabled)
      .then((data) => {
        setPreloaded(nextChapter, { data: data.data, title: data.title });
        hasPreloadedRef.current = true;
      })
      .catch((err) => {
        console.log('Preload failed:', err);
      });
  }, [activeChapter, ids, entities, nsfwEnabled, setPreloaded]);
}
