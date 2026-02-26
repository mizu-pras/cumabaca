# Komik Management CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete admin CRUD system for managing Languages, Websites, Komiks, and Komik-Website mappings with SQLite storage, JWT authentication, and React admin UI with TanStack Table.

**Architecture:** Backend uses SQLite with model-controller-route pattern, all endpoints protected by JWT middleware. Frontend uses Zustand for auth state, TanStack Table for data grids, and protected routes for admin pages.

**Tech Stack:** SQLite (sql.js), Express.js, JWT, React, Zustand, TanStack Table, Tailwind CSS

---

## Prerequisites

**Install frontend dependency:**
```bash
cd frontend
pnpm add @tanstack/react-table
```

---

## Task 1: Update SQLite Config - Add New Tables

**Files:**
- Modify: `backend/config/sqlite.js`

**Step 1: Update database initialization to include new tables**

Open `backend/config/sqlite.js` and modify the `initDatabase()` function to add the new tables after the `admin_users` table creation:

```javascript
async function initDatabase() {
  if (dbInitialized) return db;

  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );
    `);

    // NEW: Languages table
    db.run(`
      CREATE TABLE IF NOT EXISTS languages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // NEW: Websites table
    db.run(`
      CREATE TABLE IF NOT EXISTS websites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        language_id INTEGER REFERENCES languages(id),
        use_browser BOOLEAN DEFAULT 0,
        search_endpoint TEXT,
        is_nsfw BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // NEW: Komiks table
    db.run(`
      CREATE TABLE IF NOT EXISTS komiks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        synopsis TEXT,
        language_id INTEGER REFERENCES languages(id),
        cover_image TEXT,
        status TEXT DEFAULT 'ongoing',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // NEW: Komik-Websites mapping table
    db.run(`
      CREATE TABLE IF NOT EXISTS komik_websites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
        website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        total_chapters INTEGER DEFAULT 0,
        last_checked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(komik_id, website_id)
      );
    `);

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_websites_language ON websites(language_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_komiks_language ON komiks(language_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_komik ON komik_websites(komik_id);');
    db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_website ON komik_websites(website_id);');

    saveDatabase();
  }

  dbInitialized = true;
  return db;
}
```

**Step 2: Add helper function for updated_at timestamp**

Add this function before `module.exports`:

```javascript
function getTimestamp() {
  return new Date().toISOString();
}
```

**Step 3: Commit**

```bash
git add backend/config/sqlite.js
git commit -m "feat: add komik management tables to sqlite schema"
```

---

## Task 2: Create Auth Middleware

**Files:**
- Create: `backend/middleware/auth.js`

**Step 1: Create the auth middleware file**

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

function requireAuth(req, res, next) {
  try {
    const token = req.cookies.admin_token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, iat, exp }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { requireAuth };
```

**Step 2: Commit**

```bash
git add backend/middleware/auth.js
git commit -m "feat: add jwt authentication middleware"
```

---

## Task 3: Create Language Model

**Files:**
- Create: `backend/models/Language.js`

**Step 1: Create the Language model**

```javascript
const sqlite = require('../config/sqlite');

class Language {
  static async create({ name, code }) {
    const db = await sqlite.getDb();
    const result = db.run(
      'INSERT INTO languages (name, code) VALUES (?, ?)',
      [name, code]
    );
    sqlite.save();
    return { id: result[0]?.meta?.last_row_insert_rowid || result };
  }

  static async findAll(filters = {}) {
    const db = await sqlite.getDb();
    let query = 'SELECT * FROM languages WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY id DESC';

    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, ((filters.page || 1) - 1) * filters.limit);
    }

    const result = db.exec(query, params);
    return this._parseResult(result);
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec('SELECT * FROM languages WHERE id = ?', [id]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id') {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const db = await sqlite.getDb();
    db.run(`UPDATE languages SET ${updates.join(', ')} WHERE id = ?`, params);
    sqlite.save();
    return true;
  }

  static async softDelete(id) {
    const db = await sqlite.getDb();
    db.run('UPDATE languages SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static async delete(id) {
    const db = await sqlite.getDb();
    db.run('DELETE FROM languages WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static async count(filters = {}) {
    const db = await sqlite.getDb();
    let query = 'SELECT COUNT(*) as count FROM languages WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const result = db.exec(query, params);
    return result[0]?.values[0]?.[0] || 0;
  }

  static _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

module.exports = Language;
```

**Step 2: Commit**

```bash
git add backend/models/Language.js
git commit -m "feat: add language model with crud operations"
```

---

## Task 4: Create Website Model

**Files:**
- Create: `backend/models/Website.js`

**Step 1: Create the Website model**

```javascript
const sqlite = require('../config/sqlite');

class Website {
  static async create({ name, url, language_id, use_browser, search_endpoint, is_nsfw }) {
    const db = await sqlite.getDb();
    const result = db.run(
      'INSERT INTO websites (name, url, language_id, use_browser, search_endpoint, is_nsfw) VALUES (?, ?, ?, ?, ?, ?)',
      [name, url, language_id, use_browser ? 1 : 0, search_endpoint, is_nsfw ? 1 : 0]
    );
    sqlite.save();
    return { id: result[0]?.meta?.last_row_insert_rowid || result };
  }

  static async findAll(filters = {}) {
    const db = await sqlite.getDb();
    let query = `
      SELECT w.*, l.name as language_name, l.code as language_code
      FROM websites w
      LEFT JOIN languages l ON w.language_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND w.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.language_id) {
      query += ' AND w.language_id = ?';
      params.push(filters.language_id);
    }

    if (filters.search) {
      query += ' AND (w.name LIKE ? OR w.url LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY w.id DESC';

    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, ((filters.page || 1) - 1) * filters.limit);
    }

    const result = db.exec(query, params);
    return this._parseResult(result);
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec(`
      SELECT w.*, l.name as language_name, l.code as language_code
      FROM websites w
      LEFT JOIN languages l ON w.language_id = l.id
      WHERE w.id = ?
    `, [id]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id' && !key.includes('language')) {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const db = await sqlite.getDb();
    db.run(`UPDATE websites SET ${updates.join(', ')} WHERE id = ?`, params);
    sqlite.save();
    return true;
  }

  static async softDelete(id) {
    const db = await sqlite.getDb();
    db.run('UPDATE websites SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static async count(filters = {}) {
    const db = await sqlite.getDb();
    let query = 'SELECT COUNT(*) as count FROM websites w WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND w.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.language_id) {
      query += ' AND w.language_id = ?';
      params.push(filters.language_id);
    }

    if (filters.search) {
      query += ' AND (w.name LIKE ? OR w.url LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const result = db.exec(query, params);
    return result[0]?.values[0]?.[0] || 0;
  }

  static _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

module.exports = Website;
```

**Step 2: Commit**

```bash
git add backend/models/Website.js
git commit -m "feat: add website model with crud operations"
```

---

## Task 5: Create Komik Model

**Files:**
- Create: `backend/models/Komik.js`

**Step 1: Create the Komik model**

```javascript
const sqlite = require('../config/sqlite');

class Komik {
  static async create({ title, synopsis, language_id, cover_image, status }) {
    const db = await sqlite.getDb();
    const result = db.run(
      'INSERT INTO komiks (title, synopsis, language_id, cover_image, status) VALUES (?, ?, ?, ?, ?)',
      [title, synopsis, language_id, cover_image, status || 'ongoing']
    );
    sqlite.save();
    return { id: result[0]?.meta?.last_row_insert_rowid || result };
  }

  static async findAll(filters = {}) {
    const db = await sqlite.getDb();
    let query = `
      SELECT k.*, l.name as language_name, l.code as language_code
      FROM komiks k
      LEFT JOIN languages l ON k.language_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND k.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.language_id) {
      query += ' AND k.language_id = ?';
      params.push(filters.language_id);
    }

    if (filters.status) {
      query += ' AND k.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (k.title LIKE ? OR k.synopsis LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY k.id DESC';

    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, ((filters.page || 1) - 1) * filters.limit);
    }

    const result = db.exec(query, params);
    return this._parseResult(result);
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec(`
      SELECT k.*, l.name as language_name, l.code as language_code
      FROM komiks k
      LEFT JOIN languages l ON k.language_id = l.id
      WHERE k.id = ?
    `, [id]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id' && !key.includes('language')) {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const db = await sqlite.getDb();
    db.run(`UPDATE komiks SET ${updates.join(', ')} WHERE id = ?`, params);
    sqlite.save();
    return true;
  }

  static async softDelete(id) {
    const db = await sqlite.getDb();
    db.run('UPDATE komiks SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static async count(filters = {}) {
    const db = await sqlite.getDb();
    let query = 'SELECT COUNT(*) as count FROM komiks k WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND k.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.language_id) {
      query += ' AND k.language_id = ?';
      params.push(filters.language_id);
    }

    if (filters.status) {
      query += ' AND k.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (k.title LIKE ? OR k.synopsis LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const result = db.exec(query, params);
    return result[0]?.values[0]?.[0] || 0;
  }

  static _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

module.exports = Komik;
```

**Step 2: Commit**

```bash
git add backend/models/Komik.js
git commit -m "feat: add komik model with crud operations"
```

---

## Task 6: Create KomikWebsite Model

**Files:**
- Create: `backend/models/KomikWebsite.js`

**Step 1: Create the KomikWebsite model**

```javascript
const sqlite = require('../config/sqlite');

class KomikWebsite {
  static async create({ komik_id, website_id, url, total_chapters }) {
    const db = await sqlite.getDb();
    const result = db.run(
      'INSERT INTO komik_websites (komik_id, website_id, url, total_chapters) VALUES (?, ?, ?, ?)',
      [komik_id, website_id, url, total_chapters || 0]
    );
    sqlite.save();
    return { id: result[0]?.meta?.last_row_insert_rowid || result };
  }

  static async findAll(filters = {}) {
    const db = await sqlite.getDb();
    let query = `
      SELECT kw.*, k.title as komik_title, w.name as website_name, w.url as website_url
      FROM komik_websites kw
      LEFT JOIN komiks k ON kw.komik_id = k.id
      LEFT JOIN websites w ON kw.website_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.komik_id) {
      query += ' AND kw.komik_id = ?';
      params.push(filters.komik_id);
    }

    if (filters.website_id) {
      query += ' AND kw.website_id = ?';
      params.push(filters.website_id);
    }

    query += ' ORDER BY kw.id DESC';

    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, ((filters.page || 1) - 1) * filters.limit);
    }

    const result = db.exec(query, params);
    return this._parseResult(result);
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec(`
      SELECT kw.*, k.title as komik_title, w.name as website_name, w.url as website_url
      FROM komik_websites kw
      LEFT JOIN komiks k ON kw.komik_id = k.id
      LEFT JOIN websites w ON kw.website_id = w.id
      WHERE kw.id = ?
    `, [id]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id' && !key.includes('komik') && !key.includes('website')) {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const db = await sqlite.getDb();
    db.run(`UPDATE komik_websites SET ${updates.join(', ')} WHERE id = ?`, params);
    sqlite.save();
    return true;
  }

  static async delete(id) {
    const db = await sqlite.getDb();
    db.run('DELETE FROM komik_websites WHERE id = ?', [id]);
    sqlite.save();
    return true;
  }

  static async _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

module.exports = KomikWebsite;
```

**Step 2: Commit**

```bash
git add backend/models/KomikWebsite.js
git commit -m "feat: add komik-website mapping model with crud operations"
```

---

## Task 7: Create Language Controller

**Files:**
- Create: `backend/controllers/languageController.js`

**Step 1: Create the Language controller**

```javascript
const Language = require('../models/Language');
const { requireAuth } = require('../middleware/auth');

// Apply auth middleware to all routes
const languageController = {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;

      const filters = { page, limit, search, is_active };
      const [data, total] = await Promise.all([
        Language.findAll(filters),
        Language.count({ search, is_active })
      ]);

      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get languages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const language = await Language.findById(id);

      if (!language) {
        return res.status(404).json({ error: 'Language not found' });
      }

      res.json({ data: language });
    } catch (error) {
      console.error('Get language error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      const { name, code } = req.body;

      if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' });
      }

      const result = await Language.create({ name, code });
      res.status(201).json({ data: { id: result.id, name, code } });
    } catch (error) {
      console.error('Create language error:', error);
      if (error.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Language code already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, code, is_active } = req.body;

      const existing = await Language.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Language not found' });
      }

      await Language.update(id, { name, code, is_active });
      const updated = await Language.findById(id);
      res.json({ data: updated });
    } catch (error) {
      console.error('Update language error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await Language.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Language not found' });
      }

      await Language.softDelete(id);
      res.json({ message: 'Language deleted successfully' });
    } catch (error) {
      console.error('Delete language error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = languageController;
```

**Step 2: Commit**

```bash
git add backend/controllers/languageController.js
git commit -m "feat: add language controller with crud endpoints"
```

---

## Task 8: Create Website Controller

**Files:**
- Create: `backend/controllers/websiteController.js`

**Step 1: Create the Website controller**

```javascript
const Website = require('../models/Website');

const websiteController = {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
      const language_id = req.query.language_id ? parseInt(req.query.language_id) : undefined;

      const filters = { page, limit, search, is_active, language_id };
      const [data, total] = await Promise.all([
        Website.findAll(filters),
        Website.count({ search, is_active, language_id })
      ]);

      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get websites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const website = await Website.findById(id);

      if (!website) {
        return res.status(404).json({ error: 'Website not found' });
      }

      res.json({ data: website });
    } catch (error) {
      console.error('Get website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      const { name, url, language_id, use_browser, search_endpoint, is_nsfw } = req.body;

      if (!name || !url) {
        return res.status(400).json({ error: 'Name and URL are required' });
      }

      const result = await Website.create({
        name, url, language_id, use_browser, search_endpoint, is_nsfw
      });

      res.status(201).json({
        data: { id: result.id, name, url, language_id, use_browser, search_endpoint, is_nsfw }
      });
    } catch (error) {
      console.error('Create website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, url, language_id, use_browser, search_endpoint, is_nsfw, is_active } = req.body;

      const existing = await Website.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Website not found' });
      }

      await Website.update(id, { name, url, language_id, use_browser, search_endpoint, is_nsfw, is_active });
      const updated = await Website.findById(id);
      res.json({ data: updated });
    } catch (error) {
      console.error('Update website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await Website.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Website not found' });
      }

      await Website.softDelete(id);
      res.json({ message: 'Website deleted successfully' });
    } catch (error) {
      console.error('Delete website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = websiteController;
```

**Step 2: Commit**

```bash
git add backend/controllers/websiteController.js
git commit -m "feat: add website controller with crud endpoints"
```

---

## Task 9: Create Komik Management Controller

**Files:**
- Create: `backend/controllers/komikManagementController.js`

**Step 1: Create the Komik management controller**

```javascript
const Komik = require('../models/Komik');
const KomikWebsite = require('../models/KomikWebsite');

const komikManagementController = {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
      const language_id = req.query.language_id ? parseInt(req.query.language_id) : undefined;
      const status = req.query.status;

      const filters = { page, limit, search, is_active, language_id, status };
      const [data, total] = await Promise.all([
        Komik.findAll(filters),
        Komik.count({ search, is_active, language_id, status })
      ]);

      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get komiks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const komik = await Komik.findById(id);

      if (!komik) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      res.json({ data: komik });
    } catch (error) {
      console.error('Get komik error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getWebsites(req, res) {
    try {
      const { id } = req.params;
      const komik = await Komik.findById(id);

      if (!komik) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      const websites = await KomikWebsite.findAll({ komik_id: id });
      res.json({ data: websites });
    } catch (error) {
      console.error('Get komik websites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      const { title, synopsis, language_id, cover_image, status } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const result = await Komik.create({
        title, synopsis, language_id, cover_image, status
      });

      res.status(201).json({
        data: { id: result.id, title, synopsis, language_id, cover_image, status }
      });
    } catch (error) {
      console.error('Create komik error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, synopsis, language_id, cover_image, status, is_active } = req.body;

      const existing = await Komik.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      await Komik.update(id, { title, synopsis, language_id, cover_image, status, is_active });
      const updated = await Komik.findById(id);
      res.json({ data: updated });
    } catch (error) {
      console.error('Update komik error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await Komik.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      await Komik.softDelete(id);
      res.json({ message: 'Komik deleted successfully' });
    } catch (error) {
      console.error('Delete komik error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = komikManagementController;
```

**Step 2: Commit**

```bash
git add backend/controllers/komikManagementController.js
git commit -m "feat: add komik management controller with crud endpoints"
```

---

## Task 10: Create KomikWebsite Controller

**Files:**
- Create: `backend/controllers/komikWebsiteController.js`

**Step 1: Create the KomikWebsite controller**

```javascript
const KomikWebsite = require('../models/KomikWebsite');
const Komik = require('../models/Komik');
const Website = require('../models/Website');

const komikWebsiteController = {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const komik_id = req.query.komik_id ? parseInt(req.query.komik_id) : undefined;
      const website_id = req.query.website_id ? parseInt(req.query.website_id) : undefined;

      const filters = { page, limit, komik_id, website_id };
      const data = await KomikWebsite.findAll(filters);

      res.json({ data });
    } catch (error) {
      console.error('Get komik websites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const komikWebsite = await KomikWebsite.findById(id);

      if (!komikWebsite) {
        return res.status(404).json({ error: 'Mapping not found' });
      }

      res.json({ data: komikWebsite });
    } catch (error) {
      console.error('Get komik website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req, res) {
    try {
      const { komik_id, website_id, url, total_chapters } = req.body;

      if (!komik_id || !website_id || !url) {
        return res.status(400).json({ error: 'Komik ID, Website ID, and URL are required' });
      }

      // Verify komik and website exist
      const [komik, website] = await Promise.all([
        Komik.findById(komik_id),
        Website.findById(website_id)
      ]);

      if (!komik) {
        return res.status(404).json({ error: 'Komik not found' });
      }

      if (!website) {
        return res.status(404).json({ error: 'Website not found' });
      }

      const result = await KomikWebsite.create({
        komik_id, website_id, url, total_chapters
      });

      res.status(201).json({
        data: { id: result.id, komik_id, website_id, url, total_chapters }
      });
    } catch (error) {
      console.error('Create komik website error:', error);
      if (error.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'This komik is already linked to this website' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { url, total_chapters, last_checked_at } = req.body;

      const existing = await KomikWebsite.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Mapping not found' });
      }

      await KomikWebsite.update(id, { url, total_chapters, last_checked_at });
      const updated = await KomikWebsite.findById(id);
      res.json({ data: updated });
    } catch (error) {
      console.error('Update komik website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await KomikWebsite.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Mapping not found' });
      }

      await KomikWebsite.delete(id);
      res.json({ message: 'Mapping deleted successfully' });
    } catch (error) {
      console.error('Delete komik website error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = komikWebsiteController;
```

**Step 2: Commit**

```bash
git add backend/controllers/komikWebsiteController.js
git commit -m "feat: add komik-website mapping controller with crud endpoints"
```

---

## Task 11: Create Language Routes

**Files:**
- Create: `backend/routes/admin/languages.js`

**Step 1: Create the languages route file**

```javascript
const express = require('express');
const router = express.Router();
const languageController = require('../../controllers/languageController');
const { requireAuth } = require('../../middleware/auth');

// Apply auth to all routes
router.use(requireAuth);

router.get('/', languageController.getAll);
router.get('/:id', languageController.getById);
router.post('/', languageController.create);
router.put('/:id', languageController.update);
router.delete('/:id', languageController.delete);

module.exports = router;
```

**Step 2: Commit**

```bash
git add backend/routes/admin/languages.js
git commit -m "feat: add languages routes with auth middleware"
```

---

## Task 12: Create Websites Routes

**Files:**
- Create: `backend/routes/admin/websites.js`

**Step 1: Create the websites route file**

```javascript
const express = require('express');
const router = express.Router();
const websiteController = require('../../controllers/websiteController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', websiteController.getAll);
router.get('/:id', websiteController.getById);
router.post('/', websiteController.create);
router.put('/:id', websiteController.update);
router.delete('/:id', websiteController.delete);

module.exports = router;
```

**Step 2: Commit**

```bash
git add backend/routes/admin/websites.js
git commit -m "feat: add websites routes with auth middleware"
```

---

## Task 13: Create Komiks Routes

**Files:**
- Create: `backend/routes/admin/komiks.js`

**Step 1: Create the komiks route file**

```javascript
const express = require('express');
const router = express.Router();
const komikManagementController = require('../../controllers/komikManagementController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', komikManagementController.getAll);
router.get('/:id', komikManagementController.getById);
router.get('/:id/websites', komikManagementController.getWebsites);
router.post('/', komikManagementController.create);
router.put('/:id', komikManagementController.update);
router.delete('/:id', komikManagementController.delete);

module.exports = router;
```

**Step 2: Commit**

```bash
git add backend/routes/admin/komiks.js
git commit -m "feat: add komiks routes with auth middleware"
```

---

## Task 14: Create Komik-Websites Routes

**Files:**
- Create: `backend/routes/admin/komik-websites.js`

**Step 1: Create the komik-websites route file**

```javascript
const express = require('express');
const router = express.Router();
const komikWebsiteController = require('../../controllers/komikWebsiteController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', komikWebsiteController.getAll);
router.get('/:id', komikWebsiteController.getById);
router.post('/', komikWebsiteController.create);
router.put('/:id', komikWebsiteController.update);
router.delete('/:id', komikWebsiteController.delete);

module.exports = router;
```

**Step 2: Commit**

```bash
git add backend/routes/admin/komik-websites.js
git commit -m "feat: add komik-websites mapping routes with auth middleware"
```

---

## Task 15: Update Main Admin Routes

**Files:**
- Modify: `backend/routes/admin.js`

**Step 1: Update admin routes to include new sub-routes**

Replace the entire content of `backend/routes/admin.js` with:

```javascript
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Auth routes (no auth required for login)
router.post('/auth/login', adminController.login);
router.post('/auth/logout', adminController.logout);
router.get('/auth/me', adminController.getMe);

// Management routes (authenticated)
router.use('/languages', require('./admin/languages'));
router.use('/websites', require('./admin/websites'));
router.use('/komiks', require('./admin/komiks'));
router.use('/komik-websites', require('./admin/komik-websites'));

module.exports = router;
```

**Step 2: Commit**

```bash
git add backend/routes/admin.js
git commit -m "feat: update admin routes to include management sub-routes"
```

---

## Task 16: Install Frontend Dependency

**Files:**
- Modify: `frontend/package.json`

**Step 1: Install TanStack Table**

```bash
cd frontend
pnpm add @tanstack/react-table
```

**Step 2: Commit**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml
git commit -m "chore: add @tanstack/react-table dependency"
```

---

## Task 17: Create Admin Auth Store

**Files:**
- Create: `frontend/src/stores/adminAuthStore.js`

**Step 1: Create the admin auth Zustand store**

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_URL}/admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
          }

          const data = await response.json();
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        try {
          await fetch(`${API_URL}/admin/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        try {
          const response = await fetch(`${API_URL}/admin/auth/me`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            set({ user: data.user, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Check auth error:', error);
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAdminAuthStore;
```

**Step 2: Commit**

```bash
git add frontend/src/stores/adminAuthStore.js
git commit -m "feat: add admin auth zustand store with persistence"
```

---

## Task 18: Create Admin API Client

**Files:**
- Create: `frontend/src/lib/api/admin.js`

**Step 1: Create the admin API client**

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Languages API
export const languagesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/languages?${query}`);
  },
  getById: (id) => apiCall(`/admin/languages/${id}`),
  create: (data) => apiCall('/admin/languages', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/admin/languages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/admin/languages/${id}`, { method: 'DELETE' }),
};

// Websites API
export const websitesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/websites?${query}`);
  },
  getById: (id) => apiCall(`/admin/websites/${id}`),
  create: (data) => apiCall('/admin/websites', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/admin/websites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/admin/websites/${id}`, { method: 'DELETE' }),
};

// Komiks API
export const komiksApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/komiks?${query}`);
  },
  getById: (id) => apiCall(`/admin/komiks/${id}`),
  getWebsites: (id) => apiCall(`/admin/komiks/${id}/websites`),
  create: (data) => apiCall('/admin/komiks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/admin/komiks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/admin/komiks/${id}`, { method: 'DELETE' }),
};

// Komik-Websites API
export const komikWebsitesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/komik-websites?${query}`);
  },
  getById: (id) => apiCall(`/admin/komik-websites/${id}`),
  create: (data) => apiCall('/admin/komik-websites', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/admin/komik-websites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/admin/komik-websites/${id}`, { method: 'DELETE' }),
};
```

**Step 2: Commit**

```bash
git add frontend/src/lib/api/admin.js
git commit -m "feat: add admin api client for crud operations"
```

---

## Task 19: Create Protected Route Component

**Files:**
- Create: `frontend/src/components/Admin/ProtectedRoute.jsx`

**Step 1: Create the ProtectedRoute component**

```javascript
import { Navigate } from 'react-router-dom';
import useAdminAuthStore from '../../stores/adminAuthStore';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAdminAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

**Step 2: Commit**

```bash
git add frontend/src/components/Admin/ProtectedRoute.jsx
git commit -m "feat: add protected route component for admin pages"
```

---

## Task 20: Create Sidebar Component

**Files:**
- Create: `frontend/src/components/Admin/Sidebar.jsx`

**Step 1: Create the Sidebar component**

```javascript
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Globe, Link2, BookOpen, LogOut } from 'lucide-react';
import useAdminAuthStore from '../../stores/adminAuthStore';

const menuItems = [
  { path: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/admin/languages', icon: Globe, label: 'Languages' },
  { path: '/admin/websites', icon: Link2, label: 'Websites' },
  { path: '/admin/komiks', icon: BookOpen, label: 'Komiks' },
];

function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAdminAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Cuma Baca</h1>
        <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-800">
        <p className="text-sm text-gray-400">Logged in as</p>
        <p className="font-medium">{user?.username || 'Admin'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
```

**Step 2: Commit**

```bash
git add frontend/src/components/Admin/Sidebar.jsx
git commit -m "feat: add admin sidebar component with navigation"
```

---

## Task 21: Create Admin Layout Component

**Files:**
- Create: `frontend/src/pages/Admin/AdminLayout.jsx`

**Step 1: Create the AdminLayout component**

```javascript
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Admin/Sidebar';

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/AdminLayout.jsx
git commit -m "feat: add admin layout component with sidebar"
```

---

## Task 22: Create Admin Login Page

**Files:**
- Create: `frontend/src/pages/Admin/Login/Login.jsx`

**Step 1: Create the Login page**

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuthStore from '../../../stores/adminAuthStore';

function Login() {
  const navigate = useNavigate();
  const { login } = useAdminAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Cuma Baca</h1>
          <p className="text-gray-600 mt-1">Admin Login</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Login/Login.jsx
git commit -m "feat: add admin login page with form validation"
```

---

## Task 23: Create Dashboard Page

**Files:**
- Create: `frontend/src/pages/Admin/Dashboard/Dashboard.jsx`

**Step 1: Create the Dashboard page**

```javascript
import { useEffect, useState } from 'react';
import { languagesApi, websitesApi, komiksApi } from '../../../lib/api/admin';

function Dashboard() {
  const [stats, setStats] = useState({
    languages: 0,
    websites: 0,
    komiks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [languages, websites, komiks] = await Promise.all([
          languagesApi.getAll({ limit: 1 }),
          websitesApi.getAll({ limit: 1 }),
          komiksApi.getAll({ limit: 1 }),
        ]);

        setStats({
          languages: languages.pagination?.total || 0,
          websites: websites.pagination?.total || 0,
          komiks: komiks.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Languages', value: stats.languages, color: 'bg-blue-500' },
    { label: 'Websites', value: stats.websites, color: 'bg-green-500' },
    { label: 'Komiks', value: stats.komiks, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {isLoading ? (
        <div className="text-gray-500">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg shadow-md p-6">
              <div className={`w-12 h-12 ${card.color} rounded-lg mb-4`} />
              <p className="text-gray-600 text-sm">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Dashboard/Dashboard.jsx
git commit -m "feat: add admin dashboard with stats overview"
```

---

## Task 24: Create Languages Page with Table

**Files:**
- Create: `frontend/src/pages/Admin/Languages/index.jsx`

**Step 1: Create the Languages page**

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { languagesApi } from '../../../lib/api/admin';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function Languages() {
  const [languages, setLanguages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLanguages();
  }, [pagination.page, search]);

  async function fetchLanguages() {
    setIsLoading(true);
    try {
      const response = await languagesApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
      });
      setLanguages(response.data);
      setPagination((prev) => ({ ...prev, total: response.pagination.total }));
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this language?')) return;

    try {
      await languagesApi.delete(id);
      fetchLanguages();
    } catch (error) {
      alert('Failed to delete language: ' + error.message);
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Languages</h1>
        <Link
          to="/admin/languages/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Language
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search languages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {languages.map((lang) => (
                <tr key={lang.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{lang.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{lang.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lang.code}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      lang.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {lang.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <Link
                      to={`/admin/languages/${lang.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Pencil size={16} className="inline" />
                    </Link>
                    <button
                      onClick={() => handleDelete(lang.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {languages.length === 0 && (
            <div className="text-center py-8 text-gray-500">No languages found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Languages;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Languages/index.jsx
git commit -m "feat: add languages page with table and pagination"
```

---

## Task 25: Create Language Form Component

**Files:**
- Create: `frontend/src/pages/Admin/Languages/components/LanguageForm.jsx`

**Step 1: Create the Language form component**

```javascript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { languagesApi } from '../../../../lib/api/admin';

function LanguageForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({ name: '', code: '', is_active: true });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    async function fetchLanguage() {
      if (!id) return;

      try {
        const response = await languagesApi.getById(id);
        setFormData({
          name: response.data.name,
          code: response.data.code,
          is_active: response.data.is_active === 1,
        });
      } catch (error) {
        setError('Failed to load language');
      } finally {
        setIsFetching(false);
      }
    }

    fetchLanguage();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        is_active: formData.is_active ? 1 : 0,
      };

      if (isEdit) {
        await languagesApi.update(id, payload);
      } else {
        await languagesApi.create(payload);
      }

      navigate('/admin/languages');
    } catch (error) {
      setError(error.message || 'Failed to save language');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Language' : 'Add Language'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., Bahasa Indonesia"
            required
          />
        </div>

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Code *
          </label>
          <input
            id="code"
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., id"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            id="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
            Active
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/languages')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default LanguageForm;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Languages/components/LanguageForm.jsx
git commit -m "feat: add language form component for create/edit"
```

---

## Task 26: Create Websites Page

**Files:**
- Create: `frontend/src/pages/Admin/Websites/index.jsx`

**Step 1: Create the Websites page**

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { websitesApi } from '../../../lib/api/admin';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function Websites() {
  const [websites, setWebsites] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');

  useEffect(() => {
    fetchWebsites();
    fetchLanguages();
  }, [pagination.page, search, filterLang]);

  async function fetchWebsites() {
    setIsLoading(true);
    try {
      const response = await websitesApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        language_id: filterLang,
      });
      setWebsites(response.data);
      setPagination((prev) => ({ ...prev, total: response.pagination.total }));
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLanguages() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/languages`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLanguages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this website?')) return;

    try {
      await websitesApi.delete(id);
      fetchWebsites();
    } catch (error) {
      alert('Failed to delete website: ' + error.message);
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Websites</h1>
        <Link
          to="/admin/websites/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Website
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search websites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Browser</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NSFW</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {websites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{site.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{site.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{site.url}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{site.language_name || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      site.use_browser ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {site.use_browser ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      site.is_nsfw ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {site.is_nsfw ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <Link
                      to={`/admin/websites/${site.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Pencil size={16} className="inline" />
                    </Link>
                    <button
                      onClick={() => handleDelete(site.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {websites.length === 0 && (
            <div className="text-center py-8 text-gray-500">No websites found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Websites;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Websites/index.jsx
git commit -m "feat: add websites page with table and filters"
```

---

## Task 27: Create Website Form Component

**Files:**
- Create: `frontend/src/pages/Admin/Websites/components/WebsiteForm.jsx`

**Step 1: Create the Website form component**

```javascript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { websitesApi } from '../../../../lib/api/admin';

function WebsiteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    language_id: '',
    use_browser: false,
    search_endpoint: '',
    is_nsfw: false,
    is_active: true,
  });
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    async function fetchData() {
      // Fetch languages
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/languages`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setLanguages(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }

      // Fetch website if editing
      if (id) {
        try {
          const response = await websitesApi.getById(id);
          setFormData({
            name: response.data.name,
            url: response.data.url,
            language_id: response.data.language_id || '',
            use_browser: response.data.use_browser === 1,
            search_endpoint: response.data.search_endpoint || '',
            is_nsfw: response.data.is_nsfw === 1,
            is_active: response.data.is_active === 1,
          });
        } catch (error) {
          setError('Failed to load website');
        } finally {
          setIsFetching(false);
        }
      } else {
        setIsFetching(false);
      }
    }

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        use_browser: formData.use_browser ? 1 : 0,
        is_nsfw: formData.is_nsfw ? 1 : 0,
        is_active: formData.is_active ? 1 : 0,
      };

      if (isEdit) {
        await websitesApi.update(id, payload);
      } else {
        await websitesApi.create(payload);
      }

      navigate('/admin/websites');
    } catch (error) {
      setError(error.message || 'Failed to save website');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Website' : 'Add Website'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., Komiku"
            required
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            URL *
          </label>
          <input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., https://komiku.org"
            required
          />
        </div>

        <div>
          <label htmlFor="language_id" className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            id="language_id"
            value={formData.language_id}
            onChange={(e) => setFormData({ ...formData, language_id: e.target.value || null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select language</option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name} ({lang.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="search_endpoint" className="block text-sm font-medium text-gray-700 mb-2">
            Search Endpoint
          </label>
          <input
            id="search_endpoint"
            type="text"
            value={formData.search_endpoint}
            onChange={(e) => setFormData({ ...formData, search_endpoint: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., /comics?search={query}"
          />
          <p className="text-xs text-gray-500 mt-1">Use {'{query}'} as placeholder for search term</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="use_browser"
              type="checkbox"
              checked={formData.use_browser}
              onChange={(e) => setFormData({ ...formData, use_browser: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="use_browser" className="ml-2 text-sm text-gray-700">
              Use headless browser (Puppeteer)
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="is_nsfw"
              type="checkbox"
              checked={formData.is_nsfw}
              onChange={(e) => setFormData({ ...formData, is_nsfw: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_nsfw" className="ml-2 text-sm text-gray-700">
              NSFW content
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/websites')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default WebsiteForm;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Websites/components/WebsiteForm.jsx
git commit -m "feat: add website form component for create/edit"
```

---

## Task 28: Create Komiks Page

**Files:**
- Create: `frontend/src/pages/Admin/Komiks/index.jsx`

**Step 1: Create the Komiks page**

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { komiksApi } from '../../../lib/api/admin';
import { Plus, Pencil, Trash2, Link2 } from 'lucide-react';

function Komiks() {
  const [komiks, setKomiks] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchKomiks();
    fetchLanguages();
  }, [pagination.page, search, filterLang, filterStatus]);

  async function fetchKomiks() {
    setIsLoading(true);
    try {
      const response = await komiksApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        language_id: filterLang,
        status: filterStatus,
      });
      setKomiks(response.data);
      setPagination((prev) => ({ ...prev, total: response.pagination.total }));
    } catch (error) {
      console.error('Failed to fetch komiks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLanguages() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/languages`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLanguages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this komik?')) return;

    try {
      await komiksApi.delete(id);
      fetchKomiks();
    } catch (error) {
      alert('Failed to delete komik: ' + error.message);
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Komiks</h1>
        <Link
          to="/admin/komiks/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Komik
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search komiks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="hiatus">Hiatus</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {komiks.map((komik) => (
                <tr key={komik.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{komik.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{komik.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{komik.language_name || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      komik.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                      komik.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {komik.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <Link
                      to={`/admin/komiks/${komik.id}/websites`}
                      className="text-green-600 hover:text-green-800 mr-3"
                      title="Manage websites"
                    >
                      <Link2 size={16} className="inline" />
                    </Link>
                    <Link
                      to={`/admin/komiks/${komik.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Pencil size={16} className="inline" />
                    </Link>
                    <button
                      onClick={() => handleDelete(komik.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {komiks.length === 0 && (
            <div className="text-center py-8 text-gray-500">No komiks found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Komiks;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Komiks/index.jsx
git commit -m "feat: add komiks page with table and filters"
```

---

## Task 29: Create Komik Form Component

**Files:**
- Create: `frontend/src/pages/Admin/Komiks/components/KomikForm.jsx`

**Step 1: Create the Komik form component**

```javascript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { komiksApi } from '../../../../lib/api/admin';

function KomikForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    language_id: '',
    cover_image: '',
    status: 'ongoing',
    is_active: true,
  });
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    async function fetchData() {
      // Fetch languages
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/languages`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setLanguages(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }

      // Fetch komik if editing
      if (id) {
        try {
          const response = await komiksApi.getById(id);
          setFormData({
            title: response.data.title,
            synopsis: response.data.synopsis || '',
            language_id: response.data.language_id || '',
            cover_image: response.data.cover_image || '',
            status: response.data.status || 'ongoing',
            is_active: response.data.is_active === 1,
          });
        } catch (error) {
          setError('Failed to load komik');
        } finally {
          setIsFetching(false);
        }
      } else {
        setIsFetching(false);
      }
    }

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        language_id: formData.language_id || null,
        is_active: formData.is_active ? 1 : 0,
      };

      if (isEdit) {
        await komiksApi.update(id, payload);
      } else {
        await komiksApi.create(payload);
      }

      navigate('/admin/komiks');
    } catch (error) {
      setError(error.message || 'Failed to save komik');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Komik' : 'Add Komik'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., One Piece"
            required
          />
        </div>

        <div>
          <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700 mb-2">
            Synopsis
          </label>
          <textarea
            id="synopsis"
            value={formData.synopsis}
            onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Brief description of the comic..."
          />
        </div>

        <div>
          <label htmlFor="language_id" className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            id="language_id"
            value={formData.language_id}
            onChange={(e) => setFormData({ ...formData, language_id: e.target.value || null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select language</option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name} ({lang.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image URL
          </label>
          <input
            id="cover_image"
            type="url"
            value={formData.cover_image}
            onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="https://example.com/cover.jpg"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="hiatus">Hiatus</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
            Active
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/komiks')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default KomikForm;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Komiks/components/KomikForm.jsx
git commit -m "feat: add komik form component for create/edit"
```

---

## Task 30: Create Komik Websites Management Page

**Files:**
- Create: `frontend/src/pages/Admin/Komiks/components/KomikWebsiteModal.jsx`

**Step 1: Create the Komik website management modal**

```javascript
import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { komikWebsitesApi } from '../../../../lib/api/admin';

function KomikWebsiteModal({ komikId, komikTitle, onClose }) {
  const [mappings, setMappings] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [newMapping, setNewMapping] = useState({
    website_id: '',
    url: '',
    total_chapters: 0,
  });

  useEffect(() => {
    fetchData();
  }, [komikId]);

  async function fetchData() {
    try {
      // Fetch mappings
      const mappingsResponse = await komikWebsitesApi.getAll({ komik_id: komikId });
      setMappings(mappingsResponse.data);

      // Fetch websites
      const websitesResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/websites`, {
        credentials: 'include',
      });
      if (websitesResponse.ok) {
        const data = await websitesResponse.json();
        setWebsites(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddMapping(e) {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      await komikWebsitesApi.create({
        komik_id: komikId,
        ...newMapping,
        total_chapters: parseInt(newMapping.total_chapters) || 0,
      });
      setNewMapping({ website_id: '', url: '', total_chapters: 0 });
      fetchData();
    } catch (error) {
      setError(error.message || 'Failed to add website');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteMapping(id) {
    if (!confirm('Remove this website link?')) return;

    try {
      await komikWebsitesApi.delete(id);
      fetchData();
    } catch (error) {
      alert('Failed to remove: ' + error.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Manage Websites: {komikTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Add new mapping */}
              <form onSubmit={handleAddMapping} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Link Website</h3>
                {error && (
                  <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={newMapping.website_id}
                    onChange={(e) => setNewMapping({ ...newMapping, website_id: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                    required
                  >
                    <option value="">Select website</option>
                    {websites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={newMapping.url}
                    onChange={(e) => setNewMapping({ ...newMapping, url: e.target.value })}
                    placeholder="Comic URL"
                    className="px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                  <input
                    type="number"
                    value={newMapping.total_chapters}
                    onChange={(e) => setNewMapping({ ...newMapping, total_chapters: e.target.value })}
                    placeholder="Chapters"
                    className="px-3 py-2 border rounded-lg text-sm"
                    min="0"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <Plus size={16} />
                  Add Link
                </button>
              </form>

              {/* Existing mappings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Linked Websites</h3>
                {mappings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No websites linked yet</p>
                ) : (
                  <div className="space-y-2">
                    {mappings.map((mapping) => (
                      <div
                        key={mapping.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{mapping.website_name}</p>
                          <p className="text-sm text-gray-600 truncate">{mapping.url}</p>
                          <p className="text-xs text-gray-500">
                            {mapping.total_chapters} chapters
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMapping(mapping.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default KomikWebsiteModal;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Komiks/components/KomikWebsiteModal.jsx
git commit -m "feat: add komik website management modal"
```

---

## Task 31: Update Komiks Page to Include Website Modal

**Files:**
- Modify: `frontend/src/pages/Admin/Komiks/index.jsx`

**Step 1: Update Komiks page to add modal support**

Add the modal state and component to the existing Komiks page. Replace the Komiks page with this updated version:

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { komiksApi } from '../../../lib/api/admin';
import { Plus, Pencil, Trash2, Link2 } from 'lucide-react';
import KomikWebsiteModal from './components/KomikWebsiteModal';

function Komiks() {
  const [komiks, setKomiks] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalKomik, setModalKomik] = useState(null);

  useEffect(() => {
    fetchKomiks();
    fetchLanguages();
  }, [pagination.page, search, filterLang, filterStatus]);

  async function fetchKomiks() {
    setIsLoading(true);
    try {
      const response = await komiksApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        language_id: filterLang,
        status: filterStatus,
      });
      setKomiks(response.data);
      setPagination((prev) => ({ ...prev, total: response.pagination.total }));
    } catch (error) {
      console.error('Failed to fetch komiks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLanguages() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/languages`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLanguages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this komik?')) return;

    try {
      await komiksApi.delete(id);
      fetchKomiks();
    } catch (error) {
      alert('Failed to delete komik: ' + error.message);
    }
  }

  const openWebsiteModal = (komik) => {
    setModalKomik(komik);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Komiks</h1>
        <Link
          to="/admin/komiks/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Komik
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search komiks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="hiatus">Hiatus</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {komiks.map((komik) => (
                <tr key={komik.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{komik.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{komik.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{komik.language_name || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      komik.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                      komik.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {komik.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => openWebsiteModal(komik)}
                      className="text-green-600 hover:text-green-800 mr-3"
                      title="Manage websites"
                    >
                      <Link2 size={16} className="inline" />
                    </button>
                    <Link
                      to={`/admin/komiks/${komik.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Pencil size={16} className="inline" />
                    </Link>
                    <button
                      onClick={() => handleDelete(komik.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {komiks.length === 0 && (
            <div className="text-center py-8 text-gray-500">No komiks found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Website Modal */}
      {modalKomik && (
        <KomikWebsiteModal
          komikId={modalKomik.id}
          komikTitle={modalKomik.title}
          onClose={() => setModalKomik(null)}
        />
      )}
    </div>
  );
}

export default Komiks;
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Admin/Komiks/index.jsx
git commit -m "feat: integrate website modal into komiks page"
```

---

## Task 32: Update Routes to Include Admin Pages

**Files:**
- Modify: `frontend/src/routes.jsx` (or `frontend/src/main.jsx` depending on current setup)

**Step 1: Update the routes file**

First, check the current routes file structure:

```bash
cat frontend/src/routes.jsx
```

Or if routes are in main.jsx:

```bash
cat frontend/src/main.jsx
```

Then update it to include admin routes. The exact update depends on the current file structure. Generally, add:

```javascript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './components/Admin/ProtectedRoute';
import AdminLayout from './pages/Admin/AdminLayout';
import Login from './pages/Admin/Login/Login';
import Dashboard from './pages/Admin/Dashboard/Dashboard';
import Languages from './pages/Admin/Languages/index';
import LanguageForm from './pages/Admin/Languages/components/LanguageForm';
import Websites from './pages/Admin/Websites/index';
import WebsiteForm from './pages/Admin/Websites/components/WebsiteForm';
import Komiks from './pages/Admin/Komiks/index';
import KomikForm from './pages/Admin/Komiks/components/KomikForm';

// ... existing imports for other pages ...

const router = createBrowserRouter([
  // Existing public routes
  {
    path: '/',
    element: <App />,
    children: [
      // ... your existing routes ...
    ],
  },

  // Admin routes
  {
    path: '/admin',
    children: [
      { path: 'login', element: <Login /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/dashboard" /> },
              { path: 'dashboard', element: <Dashboard /> },
              { path: 'languages', element: <Languages /> },
              { path: 'languages/new', element: <LanguageForm /> },
              { path: 'languages/:id/edit', element: <LanguageForm /> },
              { path: 'websites', element: <Websites /> },
              { path: 'websites/new', element: <WebsiteForm /> },
              { path: 'websites/:id/edit', element: <WebsiteForm /> },
              { path: 'komiks', element: <Komiks /> },
              { path: 'komiks/new', element: <KomikForm /> },
              { path: 'komiks/:id/edit', element: <KomikForm /> },
            ],
          },
        ],
      },
    ],
  },
]);

// Update your root render to use RouterProvider
```

**Step 2: Commit**

```bash
git add frontend/src/routes.jsx frontend/src/main.jsx
git commit -m "feat: add admin routes with protected routes"
```

---

## Task 33: Add Admin Port to CORS Configuration

**Files:**
- Modify: `backend/app.js`

**Step 1: Update CORS origins to include admin port**

Update the allowedOrigins in `backend/app.js` to include port 5174 for admin:

```javascript
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5174']; // 5174 for admin
```

**Step 2: Commit**

```bash
git add backend/app.js
git commit -m "fix: add admin port 5174 to cors allowed origins"
```

---

## Task 34: Test the Complete System

**Step 1: Start the backend**

```bash
cd /var/home/mizu/Workspaces/personal/projects/cumabaca
pnpm run dev:backend
```

**Step 2: In another terminal, start the frontend**

```bash
cd /var/home/mizu/Workspaces/personal/projects/cumabaca
pnpm run dev:frontend
```

**Step 3: Access the admin panel**

Navigate to: `http://localhost:5173/admin/login`

**Step 4: Test the workflow**

1. **Login** with existing admin credentials (you may need to create an admin user first via the database)

2. **Create a Language:**
   - Go to Languages → Add Language
   - Enter: Name "Bahasa Indonesia", Code "id"
   - Submit

3. **Create a Website:**
   - Go to Websites → Add Website
   - Enter: Name "Komiku", URL "https://komiku.org", select the language
   - Submit

4. **Create a Komik:**
   - Go to Komiks → Add Komik
   - Enter title, select language
   - Submit

5. **Link Website to Komik:**
   - In Komiks page, click the link icon on a komik
   - Add a website with URL and chapter count

**Step 5: Verify API endpoints work**

Use curl or a tool like Postman:

```bash
# Check auth
curl -X POST http://localhost:3100/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}' \
  -c cookies.txt

# Get languages (should work with auth cookie)
curl http://localhost:3100/admin/languages -b cookies.txt

# Get websites
curl http://localhost:3100/admin/websites -b cookies.txt

# Get komiks
curl http://localhost:3100/admin/komiks -b cookies.txt
```

**Step 6: Fix any issues**

Check console for errors, verify:
- Database tables are created
- API endpoints return correct data
- Frontend displays data correctly
- Forms submit successfully

**Step 7: Create initial admin user if needed**

If no admin user exists, you may need to create one manually in the SQLite database or add a seed script.

---

## Summary

This implementation plan covers:

1. **Backend:**
   - SQLite schema updates (4 new tables)
   - Auth middleware for JWT verification
   - 4 Models (Language, Website, Komik, KomikWebsite)
   - 4 Controllers with full CRUD operations
   - Route organization with auth protection

2. **Frontend:**
   - Admin auth store with Zustand
   - API client for all CRUD operations
   - Protected route component
   - Admin layout with sidebar
   - Login page
   - Dashboard with stats
   - Languages CRUD page
   - Websites CRUD page
   - Komiks CRUD page with website linking modal

3. **Dependencies:**
   - `@tanstack/react-table` for frontend tables

4. **Testing:**
   - Complete end-to-end testing workflow

---

**Estimated total commits:** 34+

**Time estimate:** 4-6 hours for full implementation
