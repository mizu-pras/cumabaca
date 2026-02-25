import { ChevronDown, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';

export function ChapterSeparator({ chapter, title, error, onRetry }) {
  return (
    <div className="w-full max-w-[1000px] mx-auto my-4 px-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChevronDown className="w-5 h-5 text-gray-500" aria-hidden="true" />
          <h2 className="text-xl font-bold">{chapter}</h2>
          {title && <span className="text-gray-600 dark:text-gray-400">- {title}</span>}
        </div>

        {error && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            type="button"
            aria-label="Retry loading chapter"
          >
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span>Retry</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mt-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <p className="text-red-700 dark:text-red-300 text-center">
            Failed to load {chapter}. Tap Retry to try again.
          </p>
          <p className="text-red-500 dark:text-red-400 text-sm text-center mt-1">
            Error: {error}
          </p>
        </div>
      )}
    </div>
  );
}

ChapterSeparator.propTypes = {
  chapter: PropTypes.string.isRequired,
  title: PropTypes.string,
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};

ChapterSeparator.defaultProps = {
  title: null,
  error: null,
};
