# Cuma Baca - Admin Workspace

Admin panel for managing languages, websites, and komiks.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Radix UI** - Headless component primitives
- **TanStack Table** - Data tables
- **Zustand** - State management (auth)
- **Axios** - HTTP client with httpOnly cookie auth
- **Tailwind CSS v4** - Styling

## Development Commands

```bash
# Development server (runs on port 5174)
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

**Note:** Dev server proxies `/admin` requests to `http://localhost:3100` backend.

## Environment Variables

Create a `.env` file in the `admin/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3100` |

**Note:** Variables must be prefixed with `VITE_` to be exposed to client-side code.

## Authentication

Admin uses JWT-based authentication with httpOnly cookies:

- **Login:** `POST /admin/auth/login` → sets `admin_token` cookie
- **Logout:** `POST /admin/auth/logout` → clears cookie
- **Verify:** `GET /admin/auth/me` → returns current user

**Auth state:** Managed by `src/stores/authStore.js` (persisted to localStorage)

**Protected routes:** All routes except `/login` require authentication via `src/components/Admin/ProtectedRoute.jsx`

## Project Structure

```
admin/
├── index.html                 # HTML entry point
├── vite.config.js             # Vite config with /admin proxy
├── components.json            # shadcn/ui component config
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Root app with routing
│   ├── components/
│   │   ├── ui/                # Radix UI components (button, dialog, etc.)
│   │   ├── layout/            # Layout components (sidebar, header)
│   │   └── Admin/             # Admin-specific components (ProtectedRoute)
│   ├── pages/
│   │   ├── Login/             # Login page
│   │   ├── Dashboard/         # Dashboard overview
│   │   ├── Languages/         # Languages CRUD
│   │   ├── Websites/          # Websites CRUD
│   │   └── Komiks/            # Komiks CRUD with website sources
│   ├── stores/
│   │   └── authStore.js       # Auth state (Zustand + persist)
│   └── lib/
│       ├── api.js             # Axios instance with 401 interceptor
│       ├── adminApi.js        # API modules (languages, websites, komiks)
│       ├── utils.js           # cn() utility for class merging
│       └── cookies.js         # Cookie utilities
```

## API Modules (src/lib/adminApi.js)

All API calls are organized by resource:

```javascript
import { languagesApi, websitesApi, komiksApi, komikWebsitesApi } from './lib/adminApi';

// Examples
await languagesApi.getAll({ page: 1, limit: 10 });
await websitesApi.create({ name: 'Example', domain: 'example.com' });
await komiksApi.update(id, { title: 'Updated Title' });
```

## Pages & Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | Login | Admin authentication |
| `/dashboard` | Dashboard | Overview/stats |
| `/languages` | Languages | Manage languages (CRUD) |
| `/languages/new` | LanguageForm | Create language |
| `/languages/:id/edit` | LanguageForm | Edit language |
| `/websites` | Websites | Manage websites (CRUD) |
| `/websites/new` | WebsiteForm | Create website |
| `/websites/:id/edit` | WebsiteForm | Edit website |
| `/komiks` | Komiks | Manage komiks (CRUD) |
| `/komiks/new` | KomikForm | Create komik |
| `/komiks/:id` | KomikDetail | View komik with website sources |
| `/komiks/:id/edit` | KomikForm | Edit komik |

## Key Patterns

### 401 Redirect Handling

The axios interceptor in `src/lib/api.js` automatically redirects to `/login` on 401 errors (except when already on login page or attempting login).

### Protected Routes

Wrap protected routes with `<ProtectedRoute>`:

```jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Table Components

Pages use TanStack Table for data display with pagination. See `src/pages/Languages/index.jsx` for reference.

## Backend Integration

Admin panel communicates with backend admin routes:

- **Auth:** `/admin/auth/*`
- **Languages:** `/admin/languages`
- **Websites:** `/admin/websites`
- **Komiks:** `/admin/komiks`
- **Komik-Websites:** `/admin/komik-websites`

See `backend/CLAUDE.md` for backend admin API documentation.
