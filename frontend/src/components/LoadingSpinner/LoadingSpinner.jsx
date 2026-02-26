export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full mb-4" />
      <p className="text-slate-600">{message}</p>
    </div>
  );
}
