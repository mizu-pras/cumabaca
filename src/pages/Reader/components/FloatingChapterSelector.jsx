import { useState, useEffect } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { useChapterList } from '../hooks/useChapterList';
import { useChapterNavigation } from '../hooks/useChapterNavigation';

export function FloatingChapterSelector() {
  const [visible, setVisible] = useState(false);
  const [showTrigger, setShowTrigger] = useState(false);
  const { ids } = useChapterList();
  const { activeChapter, activeScrollChapter, setActiveChapter } = useReaderStore();
  const { nextChapter, prevChapter } = useChapterNavigation();

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 300;
      setShowTrigger(shouldShow);
      if (!visible) return;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visible]);

  const toggle = () => {
    setVisible(v => !v);
    setShowTrigger(false);
  };

  return (
    <>
      {showTrigger && !visible && (
        <button
          onClick={toggle}
          className="fixed top-4 right-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
          aria-label="Show chapter selector"
        >
          Chapters
        </button>
      )}
      {visible && (
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-300 px-4 py-3 flex items-center gap-4 z-50">
          <button onClick={prevChapter} className="px-3 py-2 border-b border-gray-300 whitespace-nowrap">
            Prev
          </button>
          <select
            value={activeScrollChapter || activeChapter || ''}
            onChange={(e) => setActiveChapter(e.target.value)}
            className="px-4 py-2 border-b border-gray-300 flex-1 min-w-0"
          >
            {ids.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          <button onClick={nextChapter} className="px-3 py-2 border-b border-gray-300 whitespace-nowrap">
            Next
          </button>
          <button onClick={toggle} className="px-3 py-1 text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>
      )}
    </>
  );
}
