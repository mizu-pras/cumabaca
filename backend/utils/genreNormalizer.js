const GENRE_MAP = {
  'fantasi': 'Fantasy',
  'aksi': 'Action',
  'misteri': 'Mystery',
  'horor': 'Horror',
  'thriller': 'Thriller',
  'supernatural': 'Supernatural',
  'isekai': 'Isekai',
  'komedi': 'Comedy',
  'romantis': 'Romance',
  'drama': 'Drama',
  'petualangan': 'Adventure',
  'sci-fi': 'Sci-Fi',
  'olahraga': 'Sports',
  'slice of life': 'Slice of Life',
  'sejarah': 'Historical',
  'militer': 'Military',
  'psikologis': 'Psychological',
  'dewasa': 'Mature',
  'gore': 'Gore',
  'musik': 'Music',
  'parodi': 'Parody',
  'sekolah': 'School',
  'shounen': 'Shounen',
  'shoujo': 'Shoujo',
  'seinen': 'Seinen',
  'josei': 'Josei',
};

function normalizeGenre(rawGenre) {
  if (!rawGenre || typeof rawGenre !== 'string') return null;
  const trimmed = rawGenre.trim().toLowerCase();
  return GENRE_MAP[trimmed] || rawGenre.trim();
}

function normalizeType(rawType) {
  if (!rawType || typeof rawType !== 'string') return 'manga';
  const trimmed = rawType.trim().toLowerCase();
  if (trimmed === 'manhwa') return 'manhwa';
  if (trimmed === 'manhua') return 'manhua';
  return 'manga';
}

module.exports = { normalizeGenre, normalizeType };
