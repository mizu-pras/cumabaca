import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useReaderStore } from '@/stores/readerStore';
import { ChapterForm } from './components/ChapterForm';
import { ChapterSelector } from './components/ChapterSelector';
import { ChapterContent } from './components/ChapterContent';
import { NavigationControls } from './components/NavigationControls';
import { BackToTop } from '@/components/BackToTop/BackToTop';
import { FloatingChapterSelector } from './components/FloatingChapterSelector';

function ReaderContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { komik, setKomik, activeChapter, activeScrollChapter, setActiveScrollChapter, loadedChapterIds } = useReaderStore();

  // Sync URL -> store on mount and URL changes
  useEffect(() => {
    const urlFromQuery = searchParams.get('url');
    if (urlFromQuery && urlFromQuery !== komik) {
      setKomik(urlFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setKomik]);

  // Sync activeScrollChapter -> activeChapter for selector
  useEffect(() => {
    if (activeChapter !== activeScrollChapter && activeScrollChapter) {
      // Note: we don't set activeChapter here to avoid loop
      // The selector should read from activeScrollChapter instead
      // This will be handled in Task 9
    }
  }, [activeChapter, activeScrollChapter]);

  // Update readerStore to use activeScrollChapter for selector
  // This requires ChapterSelector to use activeScrollChapter instead of activeChapter

  return (
    <>
      <ChapterForm />
      {komik && <ChapterSelector />}
      <NavigationControls position="top" />
      {activeChapter && <ChapterContent />}
      <NavigationControls position="bottom" />
      <BackToTop />
      <FloatingChapterSelector />
    </>
  );
}

export function Reader() {
  return (
    <Suspense fallback={<div className="px-4 py-8">Loading...</div>}>
      <ReaderContent />
    </Suspense>
  );
}
