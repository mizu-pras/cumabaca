import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { useNsfwStore } from '@/stores/nsfwStore';
import { fetchChapterData } from '@/lib/data-sources';

export function useChapterPreload() {
  const { activeChapter, chapters, chapterData, setPreloaded } = useReaderStore(state => ({
    activeChapter: state.activeChapter,
    chapters: state.chapters,
    chapterData: state.chapterData,
    setPreloaded: state.setPreloaded,
  }));
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    // Reset preload flag when chapter changes
    hasPreloadedRef.current = false;
  }, [activeChapter]);

  useEffect(() => {
    if (hasPreloadedRef.current) return;

    // Check if all images are loaded
    if (chapterData.length === 0) return;

    // Simple preload trigger - preload next chapter
    const curChapterIndex = chapters.ids.indexOf(activeChapter);
    const nextChapterIndex = curChapterIndex - 1;

    if (nextChapterIndex < 0) return;

    const nextChapter = chapters.ids[nextChapterIndex];
    const nextChapterUrl = chapters.entities[nextChapter]?.url;

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
  }, [chapterData.length, activeChapter, chapters, nsfwEnabled, setPreloaded]);
}
