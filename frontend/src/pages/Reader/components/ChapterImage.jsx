export function ChapterImage({ src, alt, chapterId, isFirst, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} bg-slate-200`}
      loading="lazy"
      data-chapter-first={isFirst}
      data-chapter-id={chapterId}
    />
  );
}
