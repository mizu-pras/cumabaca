export function ChapterImage({ src, alt, chapterId, isFirst, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} bg-gray-200 min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px]`}
      loading="lazy"
      data-chapter-first={isFirst}
      data-chapter-id={chapterId}
    />
  );
}
