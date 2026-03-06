import { getRandomUserAgent, USER_AGENTS } from '../../../utils/user-agents.js';

describe('user-agents', () => {
  describe('USER_AGENTS', () => {
    it('has at least 5 user agents', () => {
      expect(USER_AGENTS.length).toBeGreaterThanOrEqual(5);
    });

    it('all entries contain Chrome/', () => {
      USER_AGENTS.forEach(ua => {
        expect(ua).toContain('Chrome/');
      });
    });
  });

  describe('getRandomUserAgent', () => {
    it('returns a string from the USER_AGENTS array', () => {
      const ua = getRandomUserAgent();
      expect(USER_AGENTS).toContain(ua);
    });

    it('returns different values over multiple calls (not always the same)', () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(getRandomUserAgent());
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
