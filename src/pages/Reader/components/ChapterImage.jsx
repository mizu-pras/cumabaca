import { useState } from 'react';
import { ImageSkeleton } from '@/components/ImageSkeleton/ImageSkeleton';

export function ChapterImage({ src, alt, chapterId, isFirst, className }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className="w-full">
      {!isLoaded && <ImageSkeleton />}
      {hasError ? (
        <div className="w-full max-w-[1000px] bg-red-100 text-red-600 p-8 text-center">
          Failed to load image
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'block' : 'hidden'}`}
          loading="lazy"
          data-chapter-first={isFirst}
          data-chapter-id={chapterId}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
