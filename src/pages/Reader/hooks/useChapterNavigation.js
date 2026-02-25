import { useCallback } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { useChapterList } from './useChapterList';

export function useChapterNavigation() {
  const { ids } = useChapterList();
  const { activeChapter, setActiveChapter } = useReaderStore();

  const currentIndex = ids.indexOf(activeChapter);

  const nextChapter = useCallback(() => {
    if (currentIndex > 0) {
      setActiveChapter(ids[currentIndex - 1]);
    }
  }, [currentIndex, ids, setActiveChapter]);

  const prevChapter = useCallback(() => {
    if (currentIndex < ids.length - 1) {
      setActiveChapter(ids[currentIndex + 1]);
    }
  }, [currentIndex, ids, setActiveChapter]);

  return {
    nextChapter,
    prevChapter,
    hasNext: currentIndex > 0,
    hasPrev: currentIndex < ids.length - 1,
    currentIndex,
    total: ids.length
  };
}
