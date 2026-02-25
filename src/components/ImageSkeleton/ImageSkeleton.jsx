export function ImageSkeleton() {
  return (
    <div className="w-full max-w-[1000px] bg-gray-200 animate-pulse flex items-center justify-center" style={{ minHeight: '600px' }}>
      <div className="text-gray-400">Loading...</div>
    </div>
  );
}
