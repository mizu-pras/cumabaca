# Database Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor database schema to move website-specific attributes (synopsis, cover_url) from komiks table to new komik_websites_detail table.

**Architecture:** Create new komik_websites_detail table with 1:1 relationship to komik_websites. Migrate existing data from komiks.synopsis and komiks.cover_image to detail table. Simplify komiks and komik_websites tables. Update backend models, controllers, routes, and admin panel.

**Tech Stack:** SQLite (sql.js), Express.js, React 19, TanStack Table

---

## Task 1: Create Backend Model - KomikWebsiteDetail

**Files:**
- Create: `backend/models/KomikWebsiteDetail.js`

**Step 1: Write the KomikWebsiteDetail model**

```javascript
const sqlite = require('../config/sqlite');

class KomikWebsiteDetail {
  static async getByKomikWebsiteId(komik_website_id) {
    const db = await sqlite.getDb();
    const result = db.exec(`
      SELECT * FROM komik_websites_detail
      WHERE komik_website_id = ?
    `, [komik_website_id]);
    const rows = KomikWebsiteDetail._parseResult(result);
    return rows[0] || null;
  }

  static async create({ komik_website_id, synopsis, cover_url }) {
    const db = await sqlite.getDb();
    db.run(
      'INSERT INTO komik_websites_detail (komik_website_id, synopsis, cover_url) VALUES (?, ?, ?)',
      [komik_website_id, synopsis, cover_url]
    );
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    sqlite.save();
    return { id: lastId };
  }

  static async update(id, data) {
    const updates = [];
    const params = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id' && key !== 'komik_website_id') {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (updates.length === 0) return false;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const db = await sqlite.getDb();
    db.run(`UPDATE komik_websites_detail SET ${updates.join(', ')} WHERE id = ?`, params);
    sqlite.save();
    return true;
  }

  static async delete(id) {
    const db = await sqlite.getDb();
    db.run('DELETE FROM komik_websites_detail WHERE id = ?', [id]);
    sqlite.save();
    return true;
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

module.exports = KomikWebsiteDetail;
```

**Step 2: Commit**

```bash
git add backend/models/KomikWebsiteDetail.js
git commit -m "feat: add KomikWebsiteDetail model"
```

---

## Task 2: Update Komik Model - Remove synopsis, language_id, cover_image

**Files:**
- Modify: `backend/models/Komik.js`

**Step 1: Update the create method**

Remove `synopsis`, `language_id`, `cover_image` parameters:

```javascript
static async create({ title, status, is_active }) {
  const db = await sqlite.getDb();
  db.run(
    'INSERT INTO komiks (title, status, is_active) VALUES (?, ?, ?)',
    [title, status || 'ongoing', is_active !== undefined ? (is_active ? 1 : 0) : 1]
  );
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  sqlite.save();
  return { id: lastId };
}
```

**Step 2: Update the findAll method**

Remove language JOIN and language filter:

```javascript
static async findAll(filters = {}) {
  const db = await sqlite.getDb();
  let query = 'SELECT * FROM komiks WHERE 1=1';
  const params = [];

  if (filters.is_active !== undefined) {
    query += ' AND is_active = ?';
    params.push(filters.is_active ? 1 : 0);
  }

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.search) {
    query += ' AND title LIKE ?';
    params.push(`%${filters.search}%`);
  }

  query += ' ORDER BY id DESC';

  if (filters.limit) {
    query += ' LIMIT ? OFFSET ?';
    params.push(filters.limit, ((filters.page || 1) - 1) * filters.limit);
  }

  const result = db.exec(query, params);
  return this._parseResult(result);
}
```

**Step 3: Update the findById method**

Remove language JOIN:

```javascript
static async findById(id) {
  const db = await sqlite.getDb();
  const result = db.exec('SELECT * FROM komiks WHERE id = ?', [id]);
  const rows = this._parseResult(result);
  return rows[0] || null;
}
```

**Step 4: Update the count method**

Remove language filter and synopsis search:

```javascript
static async count(filters = {}) {
  const db = await sqlite.getDb();
  let query = 'SELECT COUNT(*) as count FROM komiks WHERE 1=1';
  const params = [];

  if (filters.is_active !== undefined) {
    query += ' AND is_active = ?';
    params.push(filters.is_active ? 1 : 0);
  }

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.search) {
    query += ' AND title LIKE ?';
    params.push(`%${filters.search}%`);
  }

  const result = db.exec(query, params);
  return result[0]?.values[0]?.[0] || 0;
}
```

**Step 5: Commit**

```bash
git add backend/models/Komik.js
git commit -m "refactor: remove synopsis, language_id, cover_image from Komik model"
```

---

## Task 3: Update KomikWebsite Model - Remove total_chapters

**Files:**
- Modify: `backend/models/KomikWebsite.js`

**Step 1: Update the create method**

Remove `total_chapters` parameter:

```javascript
static async create({ komik_id, website_id, url }) {
  const db = await sqlite.getDb();
  db.run(
    'INSERT INTO komik_websites (komik_id, website_id, url) VALUES (?, ?, ?)',
    [komik_id, website_id, url]
  );
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  sqlite.save();
  return { id: lastId };
}
```

**Step 2: Update the update method**

Remove handling for `total_chapters`:

```javascript
static async update(id, data) {
  const updates = [];
  const params = [];

  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && key !== 'id' && key !== 'total_chapters' && !key.includes('komik') && !key.includes('website')) {
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
```

**Step 3: Commit**

```bash
git add backend/models/KomikWebsite.js
git commit -m "refactor: remove total_chapters from KomikWebsite model"
```

---

## Task 4: Create KomikWebsiteDetail Controller

**Files:**
- Create: `backend/controllers/komikWebsiteDetailController.js`

**Step 1: Write the controller**

```javascript
const KomikWebsiteDetail = require('../models/KomikWebsiteDetail');
const asyncHandler = require('../utils/asyncHandler');

// Get detail by komik_website_id
exports.getByKomikWebsiteId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const detail = await KomikWebsiteDetail.getByKomikWebsiteId(id);

  if (!detail) {
    return res.status(404).json({
      success: false,
      error: 'Detail not found'
    });
  }

  res.json({
    success: true,
    data: detail
  });
});

// Create detail
exports.create = asyncHandler(async (req, res) => {
  const { id: komik_website_id } = req.params;
  const { synopsis, cover_url } = req.body;

  const result = await KomikWebsiteDetail.create({
    komik_website_id,
    synopsis,
    cover_url
  });

  const detail = await KomikWebsiteDetail.getByKomikWebsiteId(result.id);

  res.status(201).json({
    success: true,
    data: detail
  });
});

// Update detail
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { synopsis, cover_url } = req.body;

  const existing = await KomikWebsiteDetail.getByKomikWebsiteId(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Detail not found'
    });
  }

  await KomikWebsiteDetail.update(existing.id, { synopsis, cover_url });

  const detail = await KomikWebsiteDetail.getByKomikWebsiteId(id);

  res.json({
    success: true,
    data: detail
  });
});

// Delete detail
exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await KomikWebsiteDetail.getByKomikWebsiteId(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Detail not found'
    });
  }

  await KomikWebsiteDetail.delete(existing.id);

  res.json({
    success: true,
    message: 'Detail deleted successfully'
  });
});
```

**Step 2: Commit**

```bash
git add backend/controllers/komikWebsiteDetailController.js
git commit -m "feat: add KomikWebsiteDetail controller"
```

---

## Task 5: Update KomikManagement Controller

**Files:**
- Modify: `backend/controllers/komikManagementController.js`

**Step 1: Update create method**

Remove `synopsis`, `language_id`, `cover_image` handling:

```javascript
exports.create = asyncHandler(async (req, res) => {
  const { title, status, is_active } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      error: 'Title is required'
    });
  }

  const result = await Komik.create({ title, status, is_active });

  res.status(201).json({
    success: true,
    data: { id: result.id }
  });
});
```

**Step 2: Update update method**

Remove `synopsis`, `language_id`, `cover_image` handling:

```javascript
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, status, is_active } = req.body;

  const komik = await Komik.findById(id);
  if (!komik) {
    return res.status(404).json({
      success: false,
      error: 'Komik not found'
    });
  }

  await Komik.update(id, { title, status, is_active });

  const updated = await Komik.findById(id);

  res.json({
    success: true,
    data: updated
  });
});
```

**Step 3: Commit**

```bash
git add backend/controllers/komikManagementController.js
git commit -m "refactor: remove synopsis, language_id, cover_image from komik controller"
```

---

## Task 6: Create KomikWebsiteDetail Routes

**Files:**
- Create: `backend/routes/admin/komik-website-details.js`

**Step 1: Write the routes file**

```javascript
const express = require('express');
const router = express.Router();
const komikWebsiteDetailController = require('../../controllers/komikWebsiteDetailController');
const { requireAuth } = require('../../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// GET /admin/komik-websites/:id/detail - Get detail by komik_website_id
router.get('/:id/detail', komikWebsiteDetailController.getByKomikWebsiteId);

// POST /admin/komik-websites/:id/detail - Create detail
router.post('/:id/detail', komikWebsiteDetailController.create);

// PUT /admin/komik-websites/:id/detail - Update detail
router.put('/:id/detail', komikWebsiteDetailController.update);

// DELETE /admin/komik-websites/:id/detail - Delete detail
router.delete('/:id/detail', komikWebsiteDetailController.delete);

module.exports = router;
```

**Step 2: Register routes in backend/app.js**

Find the admin routes section and add:

```javascript
const komikWebsiteDetailRoutes = require('./routes/admin/komik-website-details');
app.use('/admin/komik-websites', komikWebsiteDetailRoutes);
```

**Step 3: Commit**

```bash
git add backend/routes/admin/komik-website-details.js backend/app.js
git commit -m "feat: add komik-website-detail routes"
```

---

## Task 7: Update Admin API Client - Add KomikWebsiteDetails

**Files:**
- Modify: `admin/src/lib/adminApi.js`

**Step 1: Add komikWebsiteDetails API module**

Add to the exports object:

```javascript
komikWebsiteDetails: {
  getByKomikWebsiteId: (id) => api.get(`/admin/komik-websites/${id}/detail`),
  create: (komikWebsiteId, data) => api.post(`/admin/komik-websites/${komikWebsiteId}/detail`, data),
  update: (id, data) => api.put(`/admin/komik-websites/${id}/detail`, data),
  delete: (id) => api.delete(`/admin/komik-websites/${id}/detail`),
}
```

**Step 2: Commit**

```bash
git add admin/src/lib/adminApi.js
git commit -m "feat: add komikWebsiteDetails API client"
```

---

## Task 8: Create WebsiteDetailModal Component

**Files:**
- Create: `admin/src/pages/Komiks/components/WebsiteDetailModal.jsx`

**Step 1: Write the modal component**

```jsx
import { useState, useEffect } from 'react';
import { komikWebsiteDetails } from '../../../lib/adminApi';
import { X } from 'lucide-react';

function WebsiteDetailModal({ komikWebsite, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    synopsis: '',
    cover_url: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const response = await komikWebsiteDetails.getByKomikWebsiteId(komikWebsite.id);
        if (response.data.data) {
          setFormData({
            synopsis: response.data.data.synopsis || '',
            cover_url: response.data.data.cover_url || ''
          });
        }
      } catch (error) {
        // Detail might not exist yet, that's ok
        console.log('No existing detail found');
      } finally {
        setIsFetching(false);
      }
    }

    fetchDetail();
  }, [komikWebsite.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        synopsis: formData.synopsis || null,
        cover_url: formData.cover_url || null
      };

      // Try update first, if fails try create
      try {
        await komikWebsiteDetails.update(komikWebsite.id, payload);
      } catch (updateError) {
        if (updateError.response?.status === 404) {
          await komikWebsiteDetails.create(komikWebsite.id, payload);
        } else {
          throw updateError;
        }
      }

      onSuccess();
    } catch (error) {
      setError(error.message || 'Failed to save detail');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Website Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Website: <span className="font-medium">{komikWebsite.website_name}</span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700 mb-2">
              Synopsis
            </label>
            <textarea
              id="synopsis"
              value={formData.synopsis}
              onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Website-specific synopsis..."
            />
          </div>

          <div>
            <label htmlFor="cover_url" className="block text-sm font-medium text-gray-700 mb-2">
              Cover URL
            </label>
            <input
              id="cover_url"
              type="url"
              value={formData.cover_url}
              onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WebsiteDetailModal;
```

**Step 2: Commit**

```bash
git add admin/src/pages/Komiks/components/WebsiteDetailModal.jsx
git commit -m "feat: add WebsiteDetailModal component"
```

---

## Task 9: Update WebsiteSources Component

**Files:**
- Modify: `admin/src/pages/Komiks/components/WebsiteSources.jsx`

**Step 1: Remove total_chapters column and add detail columns**

Update the columns array - remove total_chapters, add synopsis display:

```javascript
const columns = useMemo(
  () => [
    {
      accessorKey: 'website_name',
      header: 'Website',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Globe size={18} className="text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium text-sm">{row.original.website_name}</div>
            <a
              href={row.original.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Visit site <ExternalLink size={12} />
            </a>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'url',
      header: 'Comic URL',
      cell: ({ getValue }) => (
        <div className="max-w-xs">
          <a
            href={getValue()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <span className="truncate block">{getValue()}</span>
            <ExternalLink size={14} className="shrink-0" />
          </a>
        </div>
      ),
    },
    {
      accessorKey: 'last_checked_at',
      header: 'Last Checked',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue() ? new Date(getValue()).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditDetail(row.original)}
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ],
  []
);
```

**Step 2: Add detail modal state and handler**

Add to component state:

```javascript
const [showDetailModal, setShowDetailModal] = useState(false);
const [editingKomikWebsite, setEditingKomikWebsite] = useState(null);
```

**Step 3: Add handler functions**

```javascript
function handleEditDetail(komikWebsite) {
  setEditingKomikWebsite(komikWebsite);
  setShowDetailModal(true);
}

function handleDetailSuccess() {
  setShowDetailModal(false);
  setEditingKomikWebsite(null);
}
```

**Step 4: Add modal to JSX**

Add before the closing `</CardContent>`:

```jsx
{/* Website Detail Modal */}
{showDetailModal && editingKomikWebsite && (
  <WebsiteDetailModal
    komikWebsite={editingKomikWebsite}
    onClose={() => {
      setShowDetailModal(false);
      setEditingKomikWebsite(null);
    }}
    onSuccess={handleDetailSuccess}
  />
)}
```

**Step 5: Add import for WebsiteDetailModal**

```javascript
import WebsiteDetailModal from './WebsiteDetailModal';
```

**Step 6: Commit**

```bash
git add admin/src/pages/Komiks/components/WebsiteSources.jsx
git commit -m "refactor: update WebsiteSources to use detail modal, remove total_chapters"
```

---

## Task 10: Update KomikForm Component

**Files:**
- Modify: `admin/src/pages/Komiks/components/KomikForm.jsx`

**Step 1: Remove synopsis, language_id, cover_image from formData**

```javascript
const [formData, setFormData] = useState({
  title: '',
  status: 'ongoing',
  is_active: true,
});
```

**Step 2: Remove languages state and fetch**

Remove:
```javascript
const [languages, setLanguages] = useState([]);
```

And remove the languages fetch from useEffect.

**Step 3: Update data loading for edit**

```javascript
if (id) {
  try {
    const response = await komiksApi.getById(id);
    const data = response.data.data;
    setFormData({
      title: data.title,
      status: data.status || 'ongoing',
      is_active: Boolean(data.is_active),
    });
  } catch (error) {
    setError('Failed to load komik');
  } finally {
    setIsFetching(false);
  }
}
```

**Step 4: Remove form fields**

Remove the synopsis textarea, language select, and cover_image input from the form. Keep only title, status, and is_active.

**Step 5: Simplified form JSX**

```jsx
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
      <option value="dropped">Dropped</option>
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
      onClick={() => navigate('/komiks')}
      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
    >
      Cancel
    </button>
  </div>
</form>
```

**Step 6: Remove unused imports**

Remove `languagesApi` import.

**Step 7: Commit**

```bash
git add admin/src/pages/Komiks/components/KomikForm.jsx
git commit -m "refactor: simplify KomikForm - remove synopsis, language, cover_image"
```

---

## Task 11: Create Database Migration Script

**Files:**
- Create: `backend/scripts/migrate-refactor.js`

**Step 1: Write the migration script**

```javascript
const sqlite = require('../config/sqlite');

async function migrate() {
  console.log('Starting database refactoring migration...');

  const db = await sqlite.getDb();

  try {
    // Step 1: Create komik_websites_detail table
    console.log('1. Creating komik_websites_detail table...');
    db.run(`
      CREATE TABLE IF NOT EXISTS komik_websites_detail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        komik_website_id INTEGER NOT NULL REFERENCES komik_websites(id) ON DELETE CASCADE,
        synopsis TEXT,
        cover_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Step 2: Migrate existing data
    console.log('2. Migrating existing synopsis and cover_image data...');
    db.exec(`
      INSERT INTO komik_websites_detail (komik_website_id, synopsis, cover_url)
      SELECT kw.id, k.synopsis, k.cover_image
      FROM komik_websites kw
      JOIN komiks k ON kw.komik_id = k.id
      WHERE k.synopsis IS NOT NULL OR k.cover_image IS NOT NULL;
    `);
    console.log(`   Migrated ${db.exec('SELECT COUNT(*) as count FROM komik_websites_detail')[0].values[0][0]} detail records`);

    // Step 3: Rebuild komiks table
    console.log('3. Rebuilding komiks table...');
    db.run(`
      CREATE TABLE komiks_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'ongoing',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      INSERT INTO komiks_new (id, title, status, is_active, created_at, updated_at)
      SELECT id, title, status, is_active, created_at, updated_at FROM komiks;
    `);
    console.log(`   Migrated ${db.exec('SELECT COUNT(*) as count FROM komiks_new')[0].values[0][0]} komiks`);

    db.run('DROP TABLE komiks;');
    db.run('ALTER TABLE komiks_new RENAME TO komiks;');

    // Step 4: Rebuild komik_websites table
    console.log('4. Rebuilding komik_websites table...');
    db.run(`
      CREATE TABLE komik_websites_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
        website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        last_checked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(komik_id, website_id)
      );
    `);

    db.exec(`
      INSERT INTO komik_websites_new (id, komik_id, website_id, url, last_checked_at, created_at, updated_at)
      SELECT id, komik_id, website_id, url, last_checked_at, created_at, updated_at FROM komik_websites;
    `);
    console.log(`   Migrated ${db.exec('SELECT COUNT(*) as count FROM komik_websites_new')[0].values[0][0]} komik_websites`);

    db.run('DROP TABLE komik_websites;');
    db.run('ALTER TABLE komik_websites_new RENAME TO komik_websites;');

    // Step 5: Update indexes
    console.log('5. Updating indexes...');
    db.run('DROP INDEX IF EXISTS idx_komiks_language;');
    db.run('CREATE INDEX IF NOT EXISTS idx_komik_websites_detail_komik_website ON komik_websites_detail(komik_website_id);');

    // Save changes
    sqlite.save();

    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- Komiks: ${db.exec('SELECT COUNT(*) FROM komiks')[0].values[0][0]} records`);
    console.log(`- Komik Websites: ${db.exec('SELECT COUNT(*) FROM komik_websites')[0].values[0][0]} records`);
    console.log(`- Komik Website Details: ${db.exec('SELECT COUNT(*) FROM komik_websites_detail')[0].values[0][0]} records`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate().then(() => process.exit(0));
```

**Step 2: Commit**

```bash
git add backend/scripts/migrate-refactor.js
git commit -m "feat: add database migration script for refactoring"
```

---

## Task 12: Run Migration Script

**Step 1: Run the migration**

```bash
cd backend && node scripts/migrate-refactor.js
```

**Expected output:**
```
Starting database refactoring migration...
1. Creating komik_websites_detail table...
2. Migrating existing synopsis and cover_image data...
   Migrated X detail records
3. Rebuilding komiks table...
   Migrated Y komiks
4. Rebuilding komik_websites table...
   Migrated Z komik_websites
5. Updating indexes...

✅ Migration completed successfully!

Summary:
- Komiks: Y records
- Komik Websites: Z records
- Komik Website Details: X records
```

---

## Task 13: Test the Changes

**Step 1: Start backend server**

```bash
pnpm run dev:backend
```

**Step 2: Start admin panel**

```bash
pnpm run dev:admin
```

**Step 3: Manual testing checklist**

1. Login to admin panel
2. Create a new komik (should only have title, status, is_active fields)
3. Edit the komik and add a website source
4. Click the edit button on the website source to add synopsis and cover_url
5. Verify the data is saved correctly
6. List all komiks and verify data displays correctly

**Step 4: Commit with completed implementation**

```bash
git add .
git commit -m "chore: complete database refactoring implementation"
```

---

## Verification

**Before marking complete, verify:**
- [ ] Migration script runs without errors
- [ ] All existing data is migrated correctly
- [ ] Admin panel creates new komiks with simplified form
- [ ] Admin panel edits website-specific details
- [ ] No console errors in browser or server
