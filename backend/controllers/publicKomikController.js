const sqlite = require('../config/sqlite');
const Chapter = require('../models/Chapter');
const Page = require('../models/Page');
const scraperClient = require('../middleware/scraperClient');

/**
 * Parse sql.js exec() result into array of objects
 */
function _parseResult(result) {
  if (!result || result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * GET /api/komiks
 * Paginated, filtered comic list with best source (website with MAX chapter_number)
 */
async function listKomiks(req, res) {
  try {
    const db = await sqlite.getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { language, search, status } = req.query;

    // Build WHERE clauses
    const conditions = ['k.is_active = 1'];
    const params = [];

    if (language) {
      conditions.push('k.language_id = ?');
      params.push(parseInt(language));
    }
    if (search) {
      conditions.push('(k.title LIKE ? OR k.synopsis LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      conditions.push('k.status = ?');
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // Count total matching komiks
    const countSql = `SELECT COUNT(*) as total FROM komiks k WHERE ${whereClause}`;
    const countResult = db.exec(countSql, params);
    const total = countResult[0].values[0][0];

    if (total === 0) {
      return res.json({
        data: [],
        pagination: { page, limit, total: 0 },
      });
    }

    // Main query with best source subquery
    const mainSql = `
      SELECT
        k.id, k.title, k.cover_image, k.synopsis, k.status,
        l.name as language_name,
        best.website_id as source_website_id,
        w.name as source_website_name,
        best.url as source_url,
        best.cover as source_cover,
        best.synopsis as source_synopsis,
        best.latest_chapter
      FROM komiks k
      LEFT JOIN languages l ON k.language_id = l.id
      LEFT JOIN (
        SELECT kw.komik_id, kw.website_id, kw.url, kw.cover, kw.synopsis,
               MAX(c.chapter_number) as latest_chapter,
               ROW_NUMBER() OVER (PARTITION BY kw.komik_id ORDER BY MAX(c.chapter_number) DESC NULLS LAST) as rn
        FROM komik_websites kw
        LEFT JOIN chapters c ON c.komik_website_id = kw.id
        GROUP BY kw.id
      ) best ON best.komik_id = k.id AND best.rn = 1
      LEFT JOIN websites w ON best.website_id = w.id
      WHERE ${whereClause}
      ORDER BY k.id DESC
      LIMIT ? OFFSET ?
    `;

    const mainParams = [...params, limit, offset];
    const mainResult = db.exec(mainSql, mainParams);
    const rows = _parseResult(mainResult);

    const data = rows.map(row => ({
      id: row.id,
      title: row.title,
      cover_image: row.cover_image || row.source_cover || null,
      synopsis: row.synopsis || row.source_synopsis || null,
      status: row.status,
      language: row.language_name,
      source: row.source_website_id ? {
        website_id: row.source_website_id,
        website_name: row.source_website_name,
        url: row.source_url,
        latest_chapter: row.latest_chapter,
      } : null,
    }));

    res.json({
      data,
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error('listKomiks error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/komiks/:id/chapters
 * Returns chapters from the best source for a komik
 */
async function getChapters(req, res) {
  try {
    const db = await sqlite.getDb();
    const komikId = req.params.id;

    // Find best source (komik_website with highest chapter_number)
    const bestSourceSql = `
      SELECT kw.id
      FROM komik_websites kw
      LEFT JOIN chapters c ON c.komik_website_id = kw.id
      WHERE kw.komik_id = ?
      GROUP BY kw.id
      ORDER BY MAX(c.chapter_number) DESC NULLS LAST
      LIMIT 1
    `;
    const bestSourceResult = db.exec(bestSourceSql, [komikId]);
    const sources = _parseResult(bestSourceResult);

    if (sources.length === 0) {
      return res.status(404).json({ error: 'No sources found for this komik' });
    }

    const bestSourceId = sources[0].id;
    const chapters = await Chapter.findByKomikWebsiteId(bestSourceId);

    res.json({ data: chapters });
  } catch (error) {
    console.error('getChapters error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/komiks/chapters/:chapterId/pages
 * Returns pages for a chapter, lazy-loading from scraper if not cached
 */
async function getPages(req, res) {
  try {
    const chapterId = req.params.chapterId;

    // Check if pages are already cached
    const hasCachedPages = await Page.hasPages(chapterId);
    if (hasCachedPages) {
      const pages = await Page.findByChapterId(chapterId);
      return res.json({ data: pages });
    }

    // Lazy load: fetch from scraper
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    const scraperResult = await scraperClient.getData(chapter.url, 'normal');
    const imageUrls = scraperResult.data?.data || [];

    const pages = imageUrls.map((imageUrl, index) => ({
      page_number: index + 1,
      image_url: imageUrl,
    }));

    await Page.insertBatch(chapterId, pages);

    const savedPages = await Page.findByChapterId(chapterId);
    res.json({ data: savedPages });
  } catch (error) {
    console.error('getPages error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  listKomiks,
  getChapters,
  getPages,
};
