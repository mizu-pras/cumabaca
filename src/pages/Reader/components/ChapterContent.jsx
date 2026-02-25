import { useChapterData } from '../hooks/useChapterData';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';

function ChapterContentInner() {
  const { data, title, isLoading } = useChapterData();

  if (isLoading) {
    return <LoadingSpinner message="Loading images..." />;
  }

  return (
    <div id="render" className="flex flex-col items-center mb-16">
      <div className="my-2">
        <h3 className="m-0 text-center text-2xl">{title}</h3>
      </div>
      <div className="flex flex-col items-center">
        {data.map((imgUrl, index) => (
          <img
            key={index}
            src={imgUrl}
            alt={`Page ${index + 1}`}
            className="w-full max-w-[1000px]"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

export function ChapterContent() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading chapter..." />}>
      <ChapterContentInner />
    </Suspense>
  );
}
