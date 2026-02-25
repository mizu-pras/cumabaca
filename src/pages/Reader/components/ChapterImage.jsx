import { useState, useEffect } from 'react';
import { ImageSkeleton } from '@/components/ImageSkeleton/ImageSkeleton';

export function ChapterImage({ src, alt, chapterId, isFirst, className }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setHasError(false);

    // Create a new image to test loading
    const testImg = new Image();

    const handleLoad = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoaded(true);
    };

    testImg.onload = handleLoad;
    testImg.onerror = handleError;
    testImg.src = src;

    // Check if already loaded (cached) - AFTER setting src
    if (testImg.complete) {
      setIsLoaded(true);
    }

    return () => {
      testImg.onload = null;
      testImg.onerror = null;
    };
  }, [src]);

  return (
    <div className="w-full">
      {!isLoaded && <ImageSkeleton />}
      {hasError ? (
        <div className="w-full max-w-[1000px] bg-red-100 text-red-600 p-8 text-center">
          Failed to load image
        </div>
      ) : (
        <>
          <img
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
            data-chapter-first={isFirst}
            data-chapter-id={chapterId}
            style={{ display: isLoaded ? 'block' : 'none' }}
          />
        </>
      )}
    </div>
  );
}
