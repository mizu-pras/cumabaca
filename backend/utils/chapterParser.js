/**
 * Extract the first numeric value (integer or decimal) from a chapter string.
 *
 * @param {string} chapterString - e.g. "Ch 1", "Chapter 10.5", "Bab 3"
 * @returns {number|null} The parsed number, or null if none found.
 */
function parseChapterNumber(chapterString) {
  if (!chapterString && chapterString !== 0) return null;

  const str = String(chapterString);
  const match = str.match(/(\d+\.?\d*)/);

  if (!match) return null;

  return parseFloat(match[1]);
}

module.exports = { parseChapterNumber };
