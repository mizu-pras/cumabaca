import { useInfiniteChapters } from '../hooks/useInfiniteChapters';
import { useActiveChapterDetection } from '../hooks/useActiveChapterDetection';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useReaderStore } from '@/stores/readerStore';
import { ChapterSeparator } from './ChapterSeparator';
import { ChapterImage } from './ChapterImage';
import { LoadingSpinner } from '@/components/LoadingSpinner/LoadingSpinner';
import { useEffect, useRef } from 'react';

export function ChapterContent() {
  const { retryChapter, handleSentinelIntersection } = useInfiniteChapters({});
  const loadedChapters = useReaderStore(state => state.loadedChapters);
  const loadingChapters = useReaderStore(state => state.loadingChapters);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // Setup hooks
  useActiveChapterDetection(loadedChapters.ids);
  useScrollPosition();

  // Setup infinite scroll observer for sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !observerRef.current) return;

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loadedChapters.ids]);

  // Create observer once
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            handleSentinelIntersection();
          }
        }
      },
      { rootMargin: '200px' }
    );

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [handleSentinelIntersection]);

  // Show initial loading if no chapters loaded yet
  if (loadedChapters.ids.length === 0) {
    return <LoadingSpinner message="Loading chapter..." />;
  }

  return (
    <div className="flex flex-col items-center mb-16">
      {loadedChapters.ids.map((chapterId) => {
        const chapter = loadedChapters.entities[chapterId];
        const isLoading = loadingChapters[chapterId];

        if (!chapter && !isLoading) return null;

        return (
          <div key={chapterId} className="w-full">
            {/* Chapter Separator */}
            <ChapterSeparator
              chapter={chapterId}
              title={chapter?.title || 'Loading...'}
              error={chapter?.error}
              onRetry={() => retryChapter(chapterId)}
            />

            {/* Chapter Content */}
            {isLoading && !chapter?.loaded && (
              <div className="flex justify-center py-8">
                <LoadingSpinner message="Loading pages..." />
              </div>
            )}

            {chapter?.loaded && !chapter?.error && (
              <div className="flex flex-col items-center">
                {chapter.data.map((imgUrl, imgIndex) => (
                  <ChapterImage
                    key={imgIndex}
                    src={imgUrl}
                    alt={`Page ${imgIndex + 1}`}
                    chapterId={chapterId}
                    isFirst={imgIndex === 0}
                    className="w-full max-w-250"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Sentinel for infinite scroll trigger */}
      <div
        ref={sentinelRef}
        id="infinite-scroll-sentinel"
        style={{ height: '1px' }}
        aria-hidden="true"
      />
    </div>
  );
}
