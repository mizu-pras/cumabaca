/**
 * asyncHandler - Wrapper that catches async errors and passes them to Express next()
 * Usage: router.get('/path', asyncHandler(async (req, res, next) => { ... }))
 *
 * This eliminates the need for try-catch blocks in every async route handler.
 * Errors are automatically passed to Express error handling middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
