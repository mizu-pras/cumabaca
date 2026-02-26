export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-rose-50 border-l-4 border-rose-300 p-6 mb-6">
      <h2 className="text-xl font-semibold text-rose-800 mb-2">Terjadi Kesalahan</h2>
      <p className="text-rose-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-500 transition-colors"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}
