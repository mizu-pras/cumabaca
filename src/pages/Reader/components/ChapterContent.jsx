import { useInfiniteChapters } from '../hooks/useInfiniteChapters';
import { useActiveChapterDetection } from '../hooks/useActiveChapterDetection';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { ChapterSeparator } from './ChapterSeparator';
import { LoadingSpinner } from '@/components/LoadingSpinner/LoadingSpinner';

export function ChapterContent() {
  const { loadedChapters, retryChapter, isLoading } = useInfiniteChapters();

  // Setup hooks
  useActiveChapterDetection(loadedChapters.ids);
  useScrollPosition();

  if (isLoading && loadedChapters.ids.length === 0) {
    return <LoadingSpinner message="Loading chapter..." />;
  }

  if (loadedChapters.ids.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center mb-16">
      {loadedChapters.ids.map((chapterId, index) => {
        const chapter = loadedChapters.entities[chapterId];
        if (!chapter) return null;

        return (
          <div key={chapterId} className="w-full">
            {/* Chapter Separator */}
            <ChapterSeparator
              chapter={chapterId}
              title={chapter.title}
              error={chapter.error}
              onRetry={() => retryChapter(chapterId)}
            />

            {/* Chapter Content */}
            {chapter.loaded && !chapter.error && (
              <div className="flex flex-col items-center">
                {chapter.data.map((imgUrl, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={imgUrl}
                    alt={`Page ${imgIndex + 1}`}
                    className="w-full max-w-[1000px]"
                    loading="lazy"
                    data-chapter-first={imgIndex === 0}
                    data-chapter-id={chapterId}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
