const { get, put } = require('./mongodb-cache');

const cacheMiddleware = (duration) => {
    return async (req, res, next) => {
        const key = '__express__' + (req.originalUrl || req.url);

        // Try to get cached value
        const cachedBody = await get(key);
        if (cachedBody) {
            res.send(cachedBody);
            return;
        }

        // Cache miss - intercept res.send to store response
        res.sendResponse = res.send;
        res.send = async (body) => {
            // Only cache successful responses (20X status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                await put(key, body, duration);
            }
            res.sendResponse(body);
        };
        next();
    };
};

module.exports = {
    cacheMiddleware,
};
