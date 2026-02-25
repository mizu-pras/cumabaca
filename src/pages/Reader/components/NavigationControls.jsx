import { useChapterNavigation } from '../hooks/useChapterNavigation';
import { useChapterList } from '../hooks/useChapterList';
import { useReaderStore } from '@/stores/readerStore';

export function NavigationControls({ position = 'top' }) {
  const { hasNext, hasPrev } = useChapterNavigation();
  const { ids } = useChapterList();
  const activeChapter = useReaderStore(state => state.activeChapter);

  const handleNext = () => {
    if (!hasNext) return;
    const currentIndex = ids.indexOf(activeChapter);
    if (currentIndex > 0) {
      const nextChapterId = ids[currentIndex - 1];
      const nextChapterElement = document.querySelector(
        `[data-chapter-first="true"][data-chapter-id="${nextChapterId}"]`
      );
      nextChapterElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrev = () => {
    if (!hasPrev) return;
    const currentIndex = ids.indexOf(activeChapter);
    if (currentIndex < ids.length - 1) {
      const prevChapterId = ids[currentIndex + 1];
      const prevChapterElement = document.querySelector(
        `[data-chapter-first="true"][data-chapter-id="${prevChapterId}"]`
      );
      prevChapterElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
