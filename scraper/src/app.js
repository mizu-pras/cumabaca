import express from 'express';
import cors from 'cors';
import scrapeRoutes from './routes/scrape.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Scraping routes
app.use('/scrape', scrapeRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Scraper error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

export default app;
