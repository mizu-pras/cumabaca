# Admin Chapter Scraping UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add chapter scraping UI to the admin panel — scrape buttons per source, chapter lists, and a sync-all dashboard action.

**Architecture:** Extend existing admin frontend patterns. Add API methods to adminApi.js, enhance the WebsiteSources component with scrape buttons and chapter viewing, and add a sync-all action on the Dashboard. All UI follows existing Tailwind + Radix UI patterns.

**Tech Stack:** React 19, React Router 7, TanStack Table, Radix UI, Tailwind CSS v4, Axios, Lucide icons

---

### Task 1: Add Scraping API Methods

**Files:**
- Modify: `admin/src/lib/adminApi.js`

**Context:** All API modules live in `admin/src/lib/adminApi.js`. Each module is an object with methods that call `api.get/post/put/delete`. The axios instance at `admin/src/lib/api.js` has `withCredentials: true` and a 401 interceptor.

**Step 1: Read the current file**

Read `admin/src/lib/adminApi.js` to see existing modules.

**Step 2: Add scraping methods to komikWebsitesApi**

Add these methods to the existing `komikWebsitesApi` object:

```javascript
scrapeChapters: (id) => api.post(`/admin/komik-websites/${id}/scrape-chapters`),
getChapters: (id) => api.get(`/admin/komik-websites/${id}/chapters`),
```

**Step 3: Add new scrapeApi module**

Add a new export after the existing modules:

```javascript
export const scrapeApi = {
  syncAll: () => api.post('/admin/scrape/sync'),
};
```

**Step 4: Verify**

Run: `cd admin && npx vite build 2>&1 | tail -5`
Expected: Build succeeds (no import errors)

**Step 5: Commit**

```bash
git add admin/src/lib/adminApi.js
git commit -m "feat(admin): add scraping API methods to adminApi"
```

---

### Task 2: Add Scrape Button and Chapter Count to WebsiteSources

**Files:**
- Modify: `admin/src/pages/Komiks/components/WebsiteSources.jsx`

**Context:** WebsiteSources is a child component of KomikDetail. It renders a table of komik-website associations with columns: Website, URL, Total Chapters, Last Checked, Actions (Edit/Delete). Each row represents a source website for a komik.

**Step 1: Read the current file**

Read `admin/src/pages/Komiks/components/WebsiteSources.jsx` fully.

**Step 2: Add imports**

Add to existing imports:

```javascript
import { RefreshCw, Eye } from 'lucide-react';
import { komikWebsitesApi } from '../../../lib/adminApi';
```

Note: `komikWebsitesApi` may already be imported — check and adjust. Also import `useState` if not already imported.

**Step 3: Add scraping state**

Inside the WebsiteSources component, add state:

```javascript
const [scrapingId, setScrapingId] = useState(null);
const [scrapeResult, setScrapeResult] = useState(null);
```

**Step 4: Add handleScrape function**

```javascript
async function handleScrape(komikWebsite) {
  setScrapingId(komikWebsite.id);
  setScrapeResult(null);
  try {
    const response = await komikWebsitesApi.scrapeChapters(komikWebsite.id);
    setScrapeResult({
      id: komikWebsite.id,
      success: true,
      ...response.data.data,
    });
    fetchWebsites(); // Refetch to update total_chapters
  } catch (error) {
    setScrapeResult({
      id: komikWebsite.id,
      success: false,
      error: error.response?.data?.error || error.message,
    });
  } finally {
    setScrapingId(null);
  }
}
```

**Step 5: Update the Actions column**

Find the actions column definition (the cell with Edit/Delete buttons). Add a Scrape button and a View Chapters button BEFORE the existing Edit and Delete buttons:

```jsx
// Scrape button
<button
  onClick={() => handleScrape(row.original)}
  disabled={scrapingId === row.original.id}
  className="text-green-600 hover:text-green-800 disabled:text-gray-400"
  title="Scrape Chapters"
>
  <RefreshCw size={16} className={scrapingId === row.original.id ? 'animate-spin' : ''} />
</button>

// View chapters button
<button
  onClick={() => onViewChapters && onViewChapters(row.original)}
  className="text-blue-600 hover:text-blue-800"
  title="View Chapters"
>
  <Eye size={16} />
</button>
```

**Step 6: Add scrape result feedback below the table**

After the table element, add:

```jsx
{scrapeResult && (
  <div className={`mt-3 p-3 rounded-lg text-sm ${
    scrapeResult.success
      ? 'bg-green-50 border border-green-200 text-green-700'
      : 'bg-red-50 border border-red-200 text-red-600'
  }`}>
    {scrapeResult.success
      ? `Scraped ${scrapeResult.chapters_found} chapters (${scrapeResult.skipped} skipped)`
      : `Scrape failed: ${scrapeResult.error}`
    }
  </div>
)}
```

**Step 7: Add `onViewChapters` prop**

Add `onViewChapters` to the component's props destructuring. This prop will be passed from KomikDetail (connected in Task 3).

**Step 8: Verify**

Run: `cd admin && npx vite build 2>&1 | tail -5`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add admin/src/pages/Komiks/components/WebsiteSources.jsx
git commit -m "feat(admin): add scrape button and chapter count to WebsiteSources"
```

---

### Task 3: Create ChaptersModal Component

**Files:**
- Create: `admin/src/pages/Komiks/components/ChaptersModal.jsx`
- Modify: `admin/src/pages/Komiks/components/KomikDetail.jsx`

**Context:** When user clicks "View Chapters" on a website source, a modal opens showing all stored chapters for that KomikWebsite. Follows the existing modal pattern from AddWebsiteModal.jsx (fixed overlay, white card).

**Step 1: Read existing modal pattern**

Read `admin/src/pages/Komiks/components/AddWebsiteModal.jsx` for the modal structure pattern.

**Step 2: Create ChaptersModal.jsx**

Create `admin/src/pages/Komiks/components/ChaptersModal.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { komikWebsitesApi } from '../../../lib/adminApi';

export default function ChaptersModal({ komikWebsite, onClose }) {
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchChapters() {
      try {
        const response = await komikWebsitesApi.getChapters(komikWebsite.id);
        setChapters(response.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load chapters');
      } finally {
        setIsLoading(false);
      }
    }
    fetchChapters();
  }, [komikWebsite.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chapters</h2>
            <p className="text-sm text-gray-500 mt-1">
              {komikWebsite.website_name} &mdash; {chapters.length} chapters
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin mr-2 text-gray-400" />
              <span className="text-gray-500">Loading chapters...</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No chapters found. Try scraping first.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 text-sm font-medium text-gray-500">Chapter</th>
                  <th className="pb-3 text-sm font-medium text-gray-500">URL</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((ch) => (
                  <tr key={ch.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">
                      {ch.chapter_number}
                    </td>
                    <td className="py-3 text-sm">
                      <a
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span className="truncate max-w-xs">{ch.url}</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Read KomikDetail.jsx**

Read `admin/src/pages/Komiks/components/KomikDetail.jsx` to understand current structure.

**Step 4: Wire ChaptersModal into KomikDetail**

Add to imports in KomikDetail.jsx:

```javascript
import ChaptersModal from './ChaptersModal';
```

Add state inside the KomikDetail component:

```javascript
const [viewingChaptersFor, setViewingChaptersFor] = useState(null);
```

Pass the callback to WebsiteSources:

```jsx
<WebsiteSources
  komikId={id}
  onViewChapters={(komikWebsite) => setViewingChaptersFor(komikWebsite)}
/>
```

Add the modal render at the end of the component's JSX (before closing fragment/div):

```jsx
{viewingChaptersFor && (
  <ChaptersModal
    komikWebsite={viewingChaptersFor}
    onClose={() => setViewingChaptersFor(null)}
  />
)}
```

**Step 5: Verify**

Run: `cd admin && npx vite build 2>&1 | tail -5`
Expected: Build succeeds

**Step 6: Manual test**

Run: `pnpm run dev:admin` and navigate to a Komik detail page. Verify:
- "View Chapters" button appears on each website source row
- Clicking it opens a modal (may show "No chapters found" if none scraped yet)

**Step 7: Commit**

```bash
git add admin/src/pages/Komiks/components/ChaptersModal.jsx admin/src/pages/Komiks/components/KomikDetail.jsx
git commit -m "feat(admin): add chapters modal to view scraped chapters per source"
```

---

### Task 4: Add Sync All to Dashboard

**Files:**
- Modify: `admin/src/pages/Dashboard.jsx` (or wherever the dashboard component lives)

**Context:** The Dashboard page needs a "Sync All Sources" action that calls `POST /admin/scrape/sync`. This triggers chapter scraping for ALL active KomikWebsites. Used for manual admin triggering (external cron calls the same endpoint automatically).

**Step 1: Read the Dashboard page**

Read the Dashboard page component to understand its current structure.

**Step 2: Add sync functionality**

Add imports:

```javascript
import { RefreshCw } from 'lucide-react';
import { scrapeApi } from '../lib/adminApi';
```

Add state:

```javascript
const [isSyncing, setIsSyncing] = useState(false);
const [syncResult, setSyncResult] = useState(null);
```

Add handler:

```javascript
async function handleSyncAll() {
  if (!confirm('Sync chapters for all sources? This may take a while.')) return;
  setIsSyncing(true);
  setSyncResult(null);
  try {
    const response = await scrapeApi.syncAll();
    setSyncResult(response.data.data);
  } catch (error) {
    setSyncResult({ error: error.response?.data?.error || error.message });
  } finally {
    setIsSyncing(false);
  }
}
```

**Step 3: Add Sync UI section**

Add a card/section to the Dashboard JSX. Follow existing card pattern from the project:

```jsx
<div className="rounded-lg border bg-card p-6">
  <h3 className="text-lg font-semibold mb-2">Chapter Sync</h3>
  <p className="text-sm text-muted-foreground mb-4">
    Scrape chapters for all active comic sources. This is also called automatically by external cron.
  </p>
  <button
    onClick={handleSyncAll}
    disabled={isSyncing}
    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
  >
    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
    {isSyncing ? 'Syncing...' : 'Sync All Sources'}
  </button>

  {syncResult && !syncResult.error && (
    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
      <p className="font-medium">Sync complete</p>
      <p>Total: {syncResult.total} | Success: {syncResult.success} | Failed: {syncResult.failed}</p>
      {syncResult.errors?.length > 0 && (
        <ul className="mt-2 list-disc list-inside text-red-600">
          {syncResult.errors.map((err, i) => (
            <li key={i}>{err.url}: {err.error}</li>
          ))}
        </ul>
      )}
    </div>
  )}

  {syncResult?.error && (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
      Sync failed: {syncResult.error}
    </div>
  )}
</div>
```

**Step 4: Verify**

Run: `cd admin && npx vite build 2>&1 | tail -5`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add admin/src/pages/Dashboard.jsx
git commit -m "feat(admin): add sync all sources action to dashboard"
```

---

## Summary of Changes

### Modified Files
| File | Change |
|------|--------|
| `admin/src/lib/adminApi.js` | Add `scrapeChapters`, `getChapters` to komikWebsitesApi; add `scrapeApi` |
| `admin/src/pages/Komiks/components/WebsiteSources.jsx` | Add scrape button, view chapters button, scrape result feedback |
| `admin/src/pages/Komiks/components/KomikDetail.jsx` | Wire ChaptersModal via state + callback |
| `admin/src/pages/Dashboard.jsx` | Add sync-all card with results |

### Created Files
| File | Purpose |
|------|---------|
| `admin/src/pages/Komiks/components/ChaptersModal.jsx` | Modal to view stored chapters per source |
