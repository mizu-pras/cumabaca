# Komik Website Relations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a komik detail page with website associations management - allowing admins to link multiple websites to a komik, view/edit URLs, and track chapter counts.

**Architecture:** New detail page component at `/komiks/:id` that fetches komik data and linked websites separately. Modal-based add/edit forms for website associations.

**Tech Stack:** React, React Router, Zustand, TanStack Table, Lucide React, Tailwind CSS

---

## Prerequisites

Ensure the following API endpoints exist (from previous implementation):
- `GET /admin/komiks/:id` - Get komik detail
- `GET /admin/komiks/:id/websites` - Get linked websites
- `POST /admin/komik-websites` - Add website to komik
- `PUT /admin/komik-websites/:id` - Update website URL
- `DELETE /admin/komik-websites/:id` - Remove website

---

## Task 1: Create Komik Detail Page Component

**Files:**
- Create: `admin/src/pages/Komiks/KomikDetail.jsx`

**Step 1: Create the component structure**

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { komiksApi } from '../../../lib/adminApi';
import { komikWebsitesApi } from '../../../lib/adminApi';

function KomikDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [komik, setKomik] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data
  useEffect(() => {
    Promise.all([
      komiksApi.getById(id),
      komikWebsitesApi.getAll({ komik_id: id })
    ]).then(([komikRes, websitesRes]) => {
      setKomik(komikRes.data.data);
      setWebsites(websitesRes.data.data);
      setIsLoading(false);
    }).catch((err) => {
      if (err.response?.status === 404) {
        navigate('/komiks');
      } else {
        setError('Failed to load komik data');
        setIsLoading(false);
      }
    });
  }, [id, navigate]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!komik) return null;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/komiks" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <ArrowLeft size={16} />
          Back to Komiks
        </Link>
      </div>

      {/* Komik Detail Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{komik.title}</h1>
          <div className="flex gap-2">
            <Link
              to={`/komiks/${id}/edit`}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit size={16} />
              Edit
            </Link>
            <button
              onClick={() => handleDelete(id)}
              className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {komik.cover_image && (
            <img src={komik.cover_image} alt="" className="w-32 h-48 object-cover rounded-lg" />
          )}
          <div className="flex-1">
            <p className="text-gray-600 mb-4">{komik.synopsis || 'No synopsis'}</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {komik.language_name}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                komik.status === 'completed' ? 'bg-green-100 text-green-700' :
                komik.status === 'dropped' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {komik.status || 'Ongoing'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Website Sources Section */}
      <WebsiteSourcesSection
        komikId={id}
        websites={websites}
        onRefresh={() => refreshWebsites()}
      />
    </div>
  );

  function handleDelete(komikId) {
    if (!confirm('Are you sure you want to delete this komik?')) return;
    komiksApi.delete(komikId).then(() => {
      navigate('/komiks');
    }).catch((err) => {
      alert('Failed to delete komik');
    });
  }

  function refreshWebsites() {
    komikWebsitesApi.getAll({ komik_id: id }).then((res) => {
      setWebsites(res.data.data);
    });
  }
}

export default KomikDetail;
```

**Step 2: Commit**

```bash
git add admin/src/pages/Komiks/KomikDetail.jsx
git commit -m "feat: add komik detail page structure"
```

---

## Task 2: Create Website Sources Section Component

**Files:**
- Create: `admin/src/pages/Komiks/components/WebsiteSourcesSection.jsx`

**Step 1: Create the component**

```jsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { websitesApi } from '../../../../lib/adminApi';
import { komikWebsitesApi } from '../../../../lib/adminApi';
import WebsiteTable from './WebsiteTable';
import AddWebsiteModal from './AddWebsiteModal';

function WebsiteSourcesSection({ komikId, websites, onRefresh }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allWebsites, setAllWebsites] = useState([]);

  useEffect(() => {
    websitesApi.getAll().then((res) => {
      setAllWebsites(res.data.data);
    });
  }, []);

  const addedWebsiteIds = websites.map(w => w.website_id);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Website Sources</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Website
        </button>
      </div>

      {websites.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Belum ada website yang ditambahkan</p>
      ) : (
        <WebsiteTable
          websites={websites}
          onRefresh={onRefresh}
        />
      )}

      {isAddModalOpen && (
        <AddWebsiteModal
          komikId={komikId}
          availableWebsites={allWebsites.filter(w => !addedWebsiteIds.includes(w.id))}
          onClose={() => setIsAddModalOpen(false)}
          onAdded={() => {
            setIsAddModalOpen(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

export default WebsiteSourcesSection;
```

**Step 2: Commit**

```bash
git add admin/src/pages/Komiks/components/WebsiteSourcesSection.jsx
git commit -m "feat: add website sources section component"
```

---

## Task 3: Create Website Table Component

**Files:**
- Create: `admin/src/pages/Komiks/components/WebsiteTable.jsx`

**Step 1: Create the table component**

```jsx
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import EditWebsiteModal from './EditWebsiteModal';

function WebsiteTable({ websites, onRefresh }) {
  const [editingWebsite, setEditingWebsite] = useState(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Website</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">URL</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Total Chapters</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Last Checked</th>
            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {websites.map((site) => (
            <tr key={site.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{site.website_name}</td>
              <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{site.url}</td>
              <td className="px-4 py-3 text-sm">{site.total_chapters || 0}</td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {site.last_checked_at ? new Date(site.last_checked_at).toLocaleDateString() : '-'}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => setEditingWebsite(site)}
                  className="text-blue-600 hover:text-blue-800 mr-3"
                >
                  <Pencil size={14} className="inline" />
                </button>
                <button
                  onClick={() => handleDelete(site.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={14} className="inline" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingWebsite && (
        <EditWebsiteModal
          website={editingWebsite}
          onClose={() => setEditingWebsite(null)}
          onUpdated={() => {
            setEditingWebsite(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );

  async function handleDelete(id) {
    if (!confirm('Remove this website source?')) return;
    try {
      await komikWebsitesApi.delete(id);
      onRefresh();
    } catch (error) {
      alert('Failed to remove website');
    }
  }
}

export default WebsiteTable;
```

**Step 2: Commit**

```bash
git add admin/src/pages/Komiks/components/WebsiteTable.jsx
git commit -m "feat: add website table component"
```

---

## Task 4: Create Add Website Modal

**Files:**
- Create: `admin/src/pages/Komiks/components/AddWebsiteModal.jsx`

**Step 1: Create the add modal**

```jsx
import { useState } from 'react';
import { websitesApi } from '../../../../lib/adminApi';
import { komikWebsitesApi } from '../../../../lib/adminApi';

function AddWebsiteModal({ komikId, availableWebsites, onClose, onAdded }) {
  const [formData, setFormData] = useState({ website_id: '', url: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await komikWebsitesApi.create({
        komik_id: komikId,
        website_id: parseInt(formData.website_id),
        url: formData.url
      });
      onAdded();
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Website ini sudah ditambahkan ke komik');
      } else {
        setError(err.response?.data?.error || 'Failed to add website');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Website Source</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website *</label>
            <select
              value={formData.website_id}
              onChange={(e) => setFormData({ ...formData, website_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Pilih website</option>
              {availableWebsites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="https://..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Adding...' : 'Add Website'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddWebsiteModal;
```

**Step 2: Commit**

```bash
git add admin/src/pages/Komiks/components/AddWebsiteModal.jsx
git commit -m "feat: add add website modal"
```

---

## Task 5: Create Edit Website Modal

**Files:**
- Create: `admin/src/pages/Komiks/components/EditWebsiteModal.jsx`

**Step 1: Create the edit modal**

```jsx
import { useState } from 'react';
import { komikWebsitesApi } from '../../../../lib/adminApi';

function EditWebsiteModal({ website, onClose, onUpdated }) {
  const [url, setUrl] = useState(website.url);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await komikWebsitesApi.update(website.id, { url });
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Website Source</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="text"
              value={website.website_name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditWebsiteModal;
```

**Step 2: Commit**

```bash
git add admin/src/pages/Komiks/components/EditWebsiteModal.jsx
git commit -m "feat: add edit website modal"
```

---

## Task 6: Update App Routing

**Files:**
- Modify: `admin/src/App.jsx`

**Step 1: Add the detail route**

Find the komiks routes section and add the detail route:

```jsx
{/* Inside the AdminLayout route group */}
<Route path="komiks" element={<Komiks />} />
<Route path="komiks/new" element={<KomikForm />} />
<Route path="komiks/:id/edit" element={<KomikForm />} />
<Route path="komiks/:id" element={<KomikDetail />} />  {/* NEW */}
```

Also add the import at the top:
```jsx
import KomikDetail from './pages/Komiks/KomikDetail';
```

**Step 2: Update Komiks table to have clickable rows**

Modify `admin/src/pages/Komiks/index.jsx` - wrap the title cell with Link:

```jsx
// In the columns definition, replace the title cell with:
{
  accessorKey: 'title',
  header: 'Title',
  cell: ({ row, getValue }) => (
    <Link
      to={`/komiks/${row.original.id}`}
      className="font-medium text-blue-600 hover:text-blue-800"
    >
      {getValue()}
    </Link>
  ),
},
```

**Step 3: Commit**

```bash
git add admin/src/App.jsx admin/src/pages/Komiks/index.jsx
git commit -m "feat: add komik detail route and clickable table rows"
```

---

## Task 7: Update KomikDetail Import

**Files:**
- Modify: `admin/src/pages/Komiks/KomikDetail.jsx`

**Step 1: Fix imports**

Add the missing import for komikWebsitesApi at the top of the file:

```jsx
import { komikWebsitesApi } from '../../../lib/adminApi';
```

**Step 2: Commit**

```bash
git add admin/src/pages/Komiks/KomikDetail.jsx
git commit -m "fix: add missing import in komik detail"
```

---

## Task 8: Verify Implementation

**Files:**
- No changes, manual testing

**Step 1: Start backend**

```bash
cd backend
pnpm run dev
```

**Step 2: Start admin frontend**

```bash
cd admin
pnpm run dev
```

**Step 3: Manual test checklist**

1. Navigate to `http://localhost:5174/komiks`
2. Click on any komik title → should go to detail page
3. Verify breadcrumb "Back to Komiks" works
4. Verify komik info displays correctly
5. Click "[+ Add Website]" → modal opens
6. Select a website and enter URL → click Add
7. Verify website appears in table
8. Click Edit on website → change URL → Update
9. Click Delete → confirm → website removed
10. Test error cases (duplicate website, invalid URL)

**Step 4: Fix any issues found**

If tests reveal bugs, fix them and commit with descriptive messages.

---

## Task 9: Optional Polish

**Files:**
- As needed

**Step 1: Add loading skeleton (optional)**

Create `admin/src/pages/Komiks/components/KomikDetailSkeleton.jsx` for better loading experience.

**Step 2: Add toast notifications (optional)**

Replace `alert()` calls with proper toast notifications using a toast library or simple custom implementation.

**Step 3: Commit if implemented**

```bash
git add .
git commit -m "chore: add loading skeleton and toast notifications"
```

---

## Summary

This implementation adds:
1. New `/komiks/:id` detail page with komik info
2. Website sources section with table
3. Add website modal with validation
4. Edit/delete website functionality
5. Clickable komik rows in list view

**Total new files:** 5 components
**Total modifications:** 2 files (App.jsx, Komiks index.jsx)
