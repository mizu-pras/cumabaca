import { jest } from '@jest/globals';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { KomikcastScraper } from '../../../scrapers/komikcast.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const loadFixture = (name) => readFileSync(resolve(__dirname, '../../fixtures', name), 'utf-8');

describe('KomikcastScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new KomikcastScraper();
  });

  describe('getChapters', () => {
    it('extracts chapters from real komikcast HTML fixture', () => {
      const html = loadFixture('komikcast.chapter.html');
      const $ = cheerio.load(html);
      const chapters = scraper.getChapters($, 'https://v1.komikcast.fit');

      expect(chapters.length).toBeGreaterThan(0);
      chapters.forEach(ch => {
        expect(ch).toHaveProperty('chapter');
        expect(ch).toHaveProperty('url');
        expect(ch.url).toContain('https://v1.komikcast.fit');
        expect(ch.chapter).toBeTruthy(); // not empty
      });
    });

    it('skips entries with empty chapter name', () => {
      const $ = cheerio.load('<html><body><a href="/chapter/1"><span class="font-semibold"></span></a><a href="/chapter/2"><span class="font-semibold">Ch 2</span></a></body></html>');
      const chapters = scraper.getChapters($, 'https://v1.komikcast.fit');
      expect(chapters).toHaveLength(1);
      expect(chapters[0].chapter).toBe('Ch 2');
    });

    it('skips entries without href', () => {
      const $ = cheerio.load('<html><body><a><span class="font-semibold">No Href</span></a></body></html>');
      const chapters = scraper.getChapters($, 'https://v1.komikcast.fit');
      expect(chapters).toEqual([]);
    });

    it('returns empty array when no matching selectors', () => {
      const $ = cheerio.load('<html><body><p>Nothing</p></body></html>');
      const chapters = scraper.getChapters($, 'https://v1.komikcast.fit');
      expect(chapters).toEqual([]);
    });
  });

  describe('getChapterData', () => {
    it('derives title from URL pattern', () => {
      const $ = cheerio.load('<html><body><div class="chapter-scrollbar"><img alt="Page 1" src="img1.jpg" /></div></body></html>');
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/series/magic-emperor/chapter/817');

      expect(data.title).toBe('Magic Emperor Chapter 817');
    });

    it('returns empty title when URL does not match pattern', () => {
      const $ = cheerio.load('<html><body><div class="chapter-scrollbar"><img alt="Page 1" src="img1.jpg" /></div></body></html>');
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/some/other/path');

      expect(data.title).toBe('');
    });

    it('wraps image URLs with /komik/image proxy', () => {
      const $ = cheerio.load('<html><body><div class="chapter-scrollbar"><img alt="Page 1" src="https://cdn.komikcast.fit/img1.jpg" /><img alt="Page 2" src="https://cdn.komikcast.fit/img2.jpg" /></div></body></html>');
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/series/test/chapter/1');

      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toBe('/komik/image?url=https://cdn.komikcast.fit/img1.jpg');
    });

    it('filters out images without alt starting with Page', () => {
      const $ = cheerio.load('<html><body><div class="chapter-scrollbar"><img alt="Page 1" src="img1.jpg" /><img alt="Ad Banner" src="ad.jpg" /><img src="no-alt.jpg" /></div></body></html>');
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/series/test/chapter/1');

      expect(data.data).toHaveLength(1);
    });

    it('extracts images from real komikcast chapter data fixture', () => {
      const html = loadFixture('komikcast.chapter-data.html');
      const $ = cheerio.load(html);
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/series/some-manga/chapter/1');

      expect(data.data.length).toBeGreaterThan(0);
      data.data.forEach(url => {
        expect(url).toMatch(/^\/komik\/image\?url=/);
      });
    });
  });
});
