import { AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';

export function ChapterSeparator({ chapter, title, error, onRetry }) {
    return (
        <div className="w-full max-w-250 mx-auto my-4 px-4" data-chapter-separator={chapter}>
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700 px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {title && (
                        <span className="text-slate-600 dark:text-slate-400">
                            {title}
                        </span>
                    )}
                </div>

                {error && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-1 px-3 py-1 bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 rounded hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors"
                        type="button"
                        aria-label="Retry loading chapter"
                    >
                        <AlertCircle
                            className="w-4 h-4"
                            aria-hidden="true"
                        />
                        <span>Retry</span>
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div
                    className="mt-2 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg"
                    role="alert"
                    aria-live="polite"
                >
                    <p className="text-rose-700 dark:text-rose-300 text-center">
                        Failed to load {chapter}. Tap Retry to try again.
                    </p>
                    <p className="text-rose-500 dark:text-rose-400 text-sm text-center mt-1">
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
