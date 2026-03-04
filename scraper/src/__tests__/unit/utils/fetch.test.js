import { jest } from '@jest/globals';
import { getDomain, loadCheerio, validateUrl } from '../../../utils/fetch.js';

describe('fetch utils', () => {
  describe('getDomain', () => {
    it('returns origin for valid URL', () => {
      expect(getDomain('https://komiku.org/manga/test')).toBe('https://komiku.org');
    });

    it('returns origin including port', () => {
      expect(getDomain('https://example.com:8080/path')).toBe('https://example.com:8080');
    });

    it('returns null for invalid URL', () => {
      expect(getDomain('not-a-url')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(getDomain('')).toBeNull();
    });
  });

  describe('loadCheerio', () => {
    it('loads HTML and removes tabs/newlines/carriage returns', () => {
      const $ = loadCheerio('<html>\n\t<body>\r\n<p>Hello</p>\n</body></html>');
      expect($('p').text()).toBe('Hello');
    });

    it('handles empty HTML', () => {
      const $ = loadCheerio('');
      expect($('body').html()).toBeDefined();
    });
  });

  describe('validateUrl', () => {
    it('returns domain for valid URL', () => {
      expect(validateUrl('https://komiku.org/test')).toBe('https://komiku.org');
    });

    it('throws for invalid URL', () => {
      expect(() => validateUrl('not-a-url')).toThrow('Invalid URL');
    });
  });
});
