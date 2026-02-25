export function ChapterImage({ src, alt, chapterId, isFirst, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      data-chapter-first={isFirst}
      data-chapter-id={chapterId}
      style={{ backgroundColor: '#e5e7eb', minHeight: '50vh' }}
    />
  );
}
