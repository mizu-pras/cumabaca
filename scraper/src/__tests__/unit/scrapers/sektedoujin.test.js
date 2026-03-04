import { jest } from '@jest/globals';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SektedoujinScraper } from '../../../scrapers/sektedoujin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const loadFixture = (name) => readFileSync(resolve(__dirname, '../../fixtures', name), 'utf-8');

describe('SektedoujinScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new SektedoujinScraper();
  });

  describe('getChapters', () => {
    it('extracts chapters with absolute URLs (no domain prepend)', () => {
      const html = loadFixture('sektedoujin.chapter.html');
      const $ = cheerio.load(html);
      const chapters = scraper.getChapters($, 'https://sektedoujin.cc');

      expect(chapters).toHaveLength(2); // skips broken one
      expect(chapters[0].url).toBe('https://sektedoujin.cc/chapter-5/');
      expect(chapters[0].chapter).toBe('Chapter 5');
    });

    it('skips list items without href', () => {
      const html = loadFixture('sektedoujin.chapter.html');
      const $ = cheerio.load(html);
      const chapters = scraper.getChapters($, 'https://sektedoujin.cc');
      const names = chapters.map(c => c.chapter);
      expect(names).not.toContain('Broken Chapter');
    });

    it('returns empty array for missing chapterlist', () => {
      const $ = cheerio.load('<html><body></body></html>');
      const chapters = scraper.getChapters($, 'https://sektedoujin.cc');
      expect(chapters).toEqual([]);
    });
  });

  describe('getChapterData', () => {
    it('extracts title and images with data-src priority', () => {
      const html = loadFixture('sektedoujin.chapter-data.html');
      const $ = cheerio.load(html);
      const data = scraper.getChapterData($);

      expect(data.title).toBe('Doujin Title Chapter 5');
      expect(data.data).toHaveLength(3);
      // First img has data-src, should use that
      expect(data.data[0]).toBe('/komik/image?url=https://cdn.sektedoujin.cc/img1.jpg');
      // Second img has data-src only
      expect(data.data[1]).toBe('/komik/image?url=https://cdn.sektedoujin.cc/img2.jpg');
      // Third img has src only
      expect(data.data[2]).toBe('/komik/image?url=https://cdn.sektedoujin.cc/img3.jpg');
    });

    it('returns empty title when entry-title is missing', () => {
      const $ = cheerio.load('<html><body><div id="readerarea"><img src="img.jpg" /></div></body></html>');
      const data = scraper.getChapterData($);
      expect(data.title).toBe('');
    });
  });
});
