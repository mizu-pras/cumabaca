import { useReaderStore } from '@/stores/readerStore';

export function NavigationControls({ position = 'top' }) {
  const { nextChapter, prevChapter } = useReaderStore();

  return (
    <div className="px-4 py-1 my-4 flex items-center justify-between">
      <button
        onClick={prevChapter}
        type="button"
        className="px-4 py-2 border-b border-gray-300"
      >
        Prev
      </button>
      <button
        onClick={nextChapter}
        type="button"
        className="px-4 py-2 border-b border-gray-300"
      >
        Next
      </button>
    </div>
  );
}
