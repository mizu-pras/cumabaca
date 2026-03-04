import { jest } from '@jest/globals';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { KomikuScraper } from '../../../scrapers/komiku.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const loadFixture = (name) => readFileSync(resolve(__dirname, '../../fixtures', name), 'utf-8');

describe('KomikuScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new KomikuScraper();
  });

  describe('getSelectors', () => {
    it('returns expected CSS selectors', () => {
      const selectors = scraper.getSelectors();
      expect(selectors.chapterList).toBe('.judulseries');
      expect(selectors.chapterName).toBe('[itemprop="name"]');
      expect(selectors.chapterTitle).toBe('#Judul h1');
      expect(selectors.images).toBe('#Baca_Komik img');
    });
  });

  describe('getChapters', () => {
    it('extracts chapters from HTML with domain prefix', () => {
      const html = loadFixture('komiku.chapter.html');
      const $ = cheerio.load(html);
      const chapters = scraper.getChapters($, 'https://komiku.org');

      expect(chapters).toHaveLength(3); // skips the one without href
      expect(chapters[0]).toEqual({
        chapter: 'Chapter 10',
        url: 'https://komiku.org/ch-10/',
      });
      expect(chapters[1]).toEqual({
        chapter: 'Chapter 9',
        url: 'https://komiku.org/ch-9/',
      });
    });

    it('skips elements without href', () => {
      const html = loadFixture('komiku.chapter.html');
      const $ = cheerio.load(html);
      const chapters = scraper.getChapters($, 'https://komiku.org');
      const names = chapters.map(c => c.chapter);
      expect(names).not.toContain('No Href Chapter');
    });

    it('returns empty array for HTML with no matching selectors', () => {
      const $ = cheerio.load('<html><body><p>No chapters here</p></body></html>');
      const chapters = scraper.getChapters($, 'https://komiku.org');
      expect(chapters).toEqual([]);
    });

    it('handles unicode characters in chapter names', () => {
      const $ = cheerio.load('<html><body><div class="judulseries"><a href="/ch-1/"><span itemprop="name">Chapter 1 - Hari Pertama</span></a></div></body></html>');
      const chapters = scraper.getChapters($, 'https://komiku.org');
      expect(chapters[0].chapter).toBe('Chapter 1 - Hari Pertama');
    });
  });

  describe('getChapterData', () => {
    it('extracts title and images from chapter HTML', () => {
      const html = loadFixture('komiku.chapter-data.html');
      const $ = cheerio.load(html);
      const data = scraper.getChapterData($);

      expect(data.title).toBe('Manga Title Chapter 10');
      expect(data.data).toHaveLength(3);
      expect(data.data[0]).toBe('https://cdn.komiku.org/img1.jpg');
    });

    it('returns empty data for HTML with no images', () => {
      const $ = cheerio.load('<html><body><div id="Judul"><h1>Title</h1></div><div id="Baca_Komik"></div></body></html>');
      const data = scraper.getChapterData($);
      expect(data.title).toBe('Title');
      expect(data.data).toEqual([]);
    });

    it('returns empty title when #Judul h1 is missing', () => {
      const $ = cheerio.load('<html><body><div id="Baca_Komik"><img src="img.jpg" /></div></body></html>');
      const data = scraper.getChapterData($);
      expect(data.title).toBe('');
      expect(data.data).toHaveLength(1);
    });
  });
});
