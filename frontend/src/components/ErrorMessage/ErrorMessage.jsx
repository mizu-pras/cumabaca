export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
      <h2 className="text-xl font-semibold text-red-800 mb-2">Terjadi Kesalahan</h2>
      <p className="text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}
