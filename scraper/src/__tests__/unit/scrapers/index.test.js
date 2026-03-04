import { jest } from '@jest/globals';
import { getScraperForDomain, getWebsiteConfig } from '../../../scrapers/index.js';
import { KomikuScraper } from '../../../scrapers/komiku.js';
import { KomikcastScraper } from '../../../scrapers/komikcast.js';
import { SektedoujinScraper } from '../../../scrapers/sektedoujin.js';

describe('Scraper Index', () => {
  describe('getScraperForDomain', () => {
    it('returns KomikuScraper for komiku.org URL', () => {
      const scraper = getScraperForDomain('https://komiku.org/manga/test');
      expect(scraper).toBeInstanceOf(KomikuScraper);
    });

    it('returns KomikcastScraper for v1.komikcast.fit URL', () => {
      const scraper = getScraperForDomain('https://v1.komikcast.fit/series/test');
      expect(scraper).toBeInstanceOf(KomikcastScraper);
    });

    it('returns SektedoujinScraper for sektedoujin.cc URL', () => {
      const scraper = getScraperForDomain('https://sektedoujin.cc/manga/test');
      expect(scraper).toBeInstanceOf(SektedoujinScraper);
    });

    it('throws for unsupported domain', () => {
      expect(() => getScraperForDomain('https://unsupported.com/manga/test')).toThrow('No scraper found');
    });

    it('handles URL with port number', () => {
      const scraper = getScraperForDomain('https://komiku.org:443/manga/test');
      expect(scraper).toBeInstanceOf(KomikuScraper);
    });

    it('handles domain string without protocol via regex fallback', () => {
      const scraper = getScraperForDomain('komiku.org/manga/test');
      expect(scraper).toBeInstanceOf(KomikuScraper);
    });
  });

  describe('getWebsiteConfig', () => {
    it('returns correct config for komiku.org', () => {
      const config = getWebsiteConfig('https://komiku.org/test');
      expect(config.name).toBe('Komiku');
      expect(config.useBrowser).toBeUndefined();
    });

    it('returns correct config for sektedoujin.cc with nsfw flag', () => {
      const config = getWebsiteConfig('https://sektedoujin.cc/test');
      expect(config.nsfw).toBe(true);
    });

    it('throws for unsupported domain', () => {
      expect(() => getWebsiteConfig('https://unknown.com')).toThrow('No website config found');
    });
  });
});
