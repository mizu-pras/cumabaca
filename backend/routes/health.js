const express = require('express');
const scraperClient = require('../middleware/scraperClient');

const router = express.Router();

router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      scraper: {
        status: scraperClient.isHealthy() ? 'connected' : 'disconnected',
        lastCheck: scraperClient.lastCheck
      }
    }
  };

  // Return 503 if scraper is unhealthy
  if (!scraperClient.isHealthy()) {
    return res.status(503).json(health);
  }

  res.json(health);
});

module.exports = router;
