const axios = require('axios');

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:3200';
const SCRAPER_TIMEOUT = parseInt(process.env.SCRAPER_TIMEOUT || '30000');

class ScraperClient {
  constructor() {
    this.healthy = true;
    this.lastCheck = null;
    this.client = axios.create({
      baseURL: SCRAPER_URL,
      timeout: SCRAPER_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Start health check interval
    this.startHealthCheck();
  }

  /**
   * Check scraper service health
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      this.healthy = response.data.status === 'ok';
    } catch (error) {
      this.healthy = false;
      console.error('Scraper service unhealthy:', error.message);
    }
    this.lastCheck = new Date();
    return this.healthy;
  }

  /**
   * Start periodic health checks
   */
  startHealthCheck() {
    // Check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.healthCheck();
    }, 30000);

    // Initial check
    this.healthCheck();
  }

  /**
   * Stop health checks
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Get chapter list from scraper
   */
  async getChapters(url, mode = 'normal') {
    try {
      const response = await this.client.post('/scrape/chapters', { url, mode });
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        throw new Error('Scraper service unavailable');
      }
      throw error;
    }
  }

  /**
   * Get chapter data from scraper
   */
  async getData(url, mode = 'normal') {
    try {
      const response = await this.client.post('/scrape/data', { url, mode });
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        throw new Error('Scraper service unavailable');
      }
      throw error;
    }
  }

  /**
   * Get comic listings from scraper (one page at a time)
   */
  async getComics(baseUrl, page = 1) {
    try {
      const response = await this.client.post('/scrape/comics', { baseUrl, page }, {
        timeout: 30000,
      });
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        throw new Error('Scraper service unavailable');
      }
      throw error;
    }
  }

  /**
   * Check if scraper is healthy
   */
  isHealthy() {
    return this.healthy;
  }

  /**
   * Get scraper cache statistics
   */
  async getCacheStats() {
    try {
      const response = await this.client.get('/scrape/cache/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get scraper cache stats:', error.message);
      return null;
    }
  }

  /**
   * Clear scraper cache
   */
  async clearCache() {
    try {
      const response = await this.client.delete('/scrape/cache');
      return response.data;
    } catch (error) {
      console.error('Failed to clear scraper cache:', error.message);
      return null;
    }
  }
}

// Singleton instance
const scraperClient = new ScraperClient();

module.exports = scraperClient;
