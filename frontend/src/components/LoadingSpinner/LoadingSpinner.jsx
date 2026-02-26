export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
