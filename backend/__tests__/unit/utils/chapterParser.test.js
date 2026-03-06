const { parseChapterNumber } = require('../../../utils/chapterParser');

describe('parseChapterNumber', () => {
  it('extracts number from "Ch 1"', () => {
    expect(parseChapterNumber('Ch 1')).toBe(1);
  });

  it('extracts decimal number from "Chapter 10.5"', () => {
    expect(parseChapterNumber('Chapter 10.5')).toBe(10.5);
  });

  it('extracts number from "Bab 3"', () => {
    expect(parseChapterNumber('Bab 3')).toBe(3);
  });

  it('extracts number from plain numeric string "42"', () => {
    expect(parseChapterNumber('42')).toBe(42);
  });

  it('extracts number from "Chapter 100"', () => {
    expect(parseChapterNumber('Chapter 100')).toBe(100);
  });

  it('extracts number from "Ch. 5"', () => {
    expect(parseChapterNumber('Ch. 5')).toBe(5);
  });

  it('extracts zero from "Chapter 0"', () => {
    expect(parseChapterNumber('Chapter 0')).toBe(0);
  });

  it('returns null for string with no numbers', () => {
    expect(parseChapterNumber('Prologue')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseChapterNumber('')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(parseChapterNumber(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseChapterNumber(undefined)).toBeNull();
  });
});
