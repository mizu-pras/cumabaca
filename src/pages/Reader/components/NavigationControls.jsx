import { useReaderStore } from '@/stores/readerStore';
import { useChapterList } from '../hooks/useChapterList';

export function NavigationControls({ position = 'top' }) {
  const { ids } = useChapterList();
  const { activeScrollChapter, activeChapter, clearAndLoadChapter } = useReaderStore();

  // Use currently visible chapter for navigation
  const currentChapter = activeScrollChapter || activeChapter;
  const currentIndex = ids.indexOf(currentChapter);

  const hasNext = currentIndex > 0;
  const hasPrev = currentIndex < ids.length - 1;

  const handleNext = () => {
    if (hasNext) {
      const nextChapterId = ids[currentIndex - 1];
      clearAndLoadChapter(nextChapterId);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      const prevChapterId = ids[currentIndex + 1];
      clearAndLoadChapter(prevChapterId);
    }
  };

  return (
    <div className="px-4 py-1 my-4 flex items-center justify-between">
      <button
        onClick={handlePrev}
        disabled={!hasPrev}
        type="button"
        className={`px-4 py-2 border-b border-gray-300 ${
          !hasPrev ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        Prev
      </button>
      <button
        onClick={handleNext}
        disabled={!hasNext}
        type="button"
        className={`px-4 py-2 border-b border-gray-300 ${
          !hasNext ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        Next
      </button>
    </div>
  );
}
