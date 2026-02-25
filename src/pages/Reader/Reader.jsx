import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useReaderStore } from '@/stores/readerStore';
import { ChapterForm } from './components/ChapterForm';
import { ChapterSelector } from './components/ChapterSelector';
import { ChapterContent } from './components/ChapterContent';
import { NavigationControls } from './components/NavigationControls';
import { BackToTop } from '@/components/BackToTop/BackToTop';
import { FloatingChapterSelector } from './components/FloatingChapterSelector';
import { useChapterPreload } from './hooks/useChapterPreload';

function ReaderContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { komik, setKomik, activeChapter } = useReaderStore();

  // Sync URL -> store on mount
  useEffect(() => {
    const urlFromQuery = searchParams.get('url');
    if (urlFromQuery && urlFromQuery !== komik) {
      setKomik(urlFromQuery);
    }
  }, [searchParams, komik, setKomik]);

  // Enable preloading
  useChapterPreload();

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
