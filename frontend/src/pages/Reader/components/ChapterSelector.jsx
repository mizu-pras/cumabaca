import { useReaderStore } from '@/stores/readerStore';
import { useChapterList } from '../hooks/useChapterList';

export function ChapterSelector() {
  const { ids, isLoading } = useChapterList();
  const { activeChapter, clearAndLoadChapter } = useReaderStore();

  const handleChange = (e) => {
    const selectedChapter = e.target.value;
    // Use clearAndLoadChapter for explicit navigation
    clearAndLoadChapter(selectedChapter);
  };

  return (
    <div className="px-4 py-1 mt-4 flex items-center gap-2">
      <label htmlFor="chapter">Pilih Bab:</label>
      <select
        id="chapter"
        name="chapter"
        value={activeChapter || ''}
        onChange={handleChange}
        disabled={isLoading || ids.length === 0}
        className="px-4 py-2 border-b border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-indigo-500 transition-colors"
      >
        {ids.map(id => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>
    </div>
  );
}
