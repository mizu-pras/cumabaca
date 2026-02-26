const axios = require('axios');
const https = require('https');

/**
 * Image proxy controller to bypass CORS and hotlink protection
 * Fetches images with proper Referer header and streams them to client
 */
async function proxyImage(req, res, next) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter required' });
    }

    try {
        // Fetch image with proper Referer header to bypass hotlink protection
        const response = await axios({
            method: 'GET',
            url,
            responseType: 'stream',
            headers: {
                Referer: 'https://v1.komikcast.fit/',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });

        // Set CORS and security headers to prevent OpaqueResponseBlocking
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

        // Pipe image data to response
        response.data.pipe(res);
    } catch (error) {
        console.error('Image proxy error:', error.message);
        next(error);
    }
}

module.exports = {
    proxyImage,
};
