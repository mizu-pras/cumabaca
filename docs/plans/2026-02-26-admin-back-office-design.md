# Admin Back Office Design

**Date**: 2026-02-26
**Status**: Approved

## Overview

Create a back office admin application for the Cuma Baca comic scraper platform. Initial scope includes authentication only, with extensible architecture for future admin features.

## Architecture

### Monorepo Structure

New `admin` workspace added to existing pnpm monorepo:

```
cumabaca/
├── backend/        # Existing API + new admin API routes
├── frontend/       # Existing user-facing app
└── admin/          # NEW: Admin back office
    ├── src/
    │   ├── pages/      # Login, Dashboard (future)
    │   ├── components/ # ShadCN components + custom
    │   ├── lib/        # API client, utils
    │   ├── stores/     # Zustand state
    │   └── main.jsx    # Entry point
    └── package.json
```

### Tech Stack

- **Admin Frontend**: React 19 + Vite + ShadCN UI + Tailwind CSS v4
- **Backend**: Extended Express.js backend with admin routes
- **Database**: SQLite for admin data (users, sessions, audit logs)
- **Auth**: JWT tokens stored in httpOnly cookies
- **State**: Zustand for auth state management

## Authentication Design

### Backend Structure

```
backend/
├── config/
│   └── sqlite.js          # SQLite connection setup
├── models/
│   └── AdminUser.js       # Admin user model
├── controllers/
│   └── adminController.js # Auth logic (login, logout, verify)
├── routes/
│   └── admin.js           # Admin API routes
└── cli/
    └── admin-cli.js       # CLI for registering admins
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/auth/login` | POST | Authenticate admin, return JWT |
| `/admin/auth/logout` | POST | Clear cookie |
| `/admin/auth/me` | GET | Verify token, return current admin |

### SQLite Schema

```sql
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

### Security

- Passwords hashed with bcrypt (12 rounds)
- JWT signed with HS256, 24h expiration
- httpOnly cookies prevent XSS
- CSRF protection via sameSite cookies

## Frontend Design

### Admin Workspace Structure

```
admin/
├── src/
│   ├── main.jsx              # Entry + ShadCN providers
│   ├── App.jsx               # Root with auth check
│   ├── pages/
│   │   ├── Login.jsx         # Login page (ShadCN form)
│   │   └── Dashboard.jsx     # Protected dashboard (placeholder)
│   ├── components/
│   │   └── ui/               # ShadCN components
│   ├── lib/
│   │   ├── api.js            # Axios instance with interceptors
│   │   └── utils.js          # cn() utility
│   └── stores/
│       └── authStore.js      # Zustand for auth state
├── package.json
├── vite.config.js
├── tailwind.config.js
└── components.json           # ShadCN config
```

### State Management (Zustand)

```javascript
// authStore.js
{
  user: null | { id, username, email },
  isAuthenticated: boolean,
  isLoading: boolean,
  login: (credentials) => Promise<void>,
  logout: () => void,
  checkAuth: () => Promise<void>
}
```

### Protected Route Pattern

- Wrapper component redirects to `/login` if not authenticated
- API interceptor auto-redirects on 401 responses

## UI Design

### Aesthetic Direction

**Style**: Clean minimal data - Professional, distraction-free, data-focused dashboard

### Color Palette

| Role | Color |
|------|-------|
| Background | White (#FFFFFF) + Light Gray (#F9FAFB) |
| Surface | White with subtle borders |
| Text Primary | Slate (#0F172A) |
| Text Secondary | Slate (#475569) |
| Text Muted | Slate (#94A3B8) |
| Primary | Indigo (#6366F1) |
| Danger | Red (#EF4444) |
| Success | Green (#10B981) |

### Typography

- **Display**: Inter (clean, highly readable)
- **Body**: System font stack for performance
- **Code**: JetBrains Mono for CLI output reference

### Login Page Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Logo / Branding]                  │
│                                                 │
│           Cuma Baca - Admin Panel               │
│                                                 │
│   ┌─────────────────────────────────────────┐  │
│   │  Username                    [Input]    │  │
│   │  Password                    [Input]    │  │
│   │                                         │  │
│   │           [Sign In]  [Button]           │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### ShadCN Components

- `Card` - Login container, dashboard cards
- `Input` - Form fields with proper labels
- `Button` - Primary actions with loading states
- `Label` - Form field labels
- `Alert` - Error/success messages

### Responsive

- Mobile: Full-width, stacked
- Tablet+: Centered card, 400px max-width

## Data Flow

### Login Flow

1. User enters credentials → Submit form
2. POST /admin/auth/login with credentials
3. Backend validates → Creates JWT → Sets httpOnly cookie
4. Response returns user data → Store in Zustand
5. Redirect to /dashboard

### Auth Check Flow

1. App mount → Call checkAuth()
2. GET /admin/auth/me (cookie auto-sent)
3. Backend validates JWT → Returns user or 401
4. Update authStore state
5. Redirect if needed

### Error Handling

- **Network errors**: Retry logic with exponential backoff
- **401 Unauthorized**: Auto-logout, redirect to login
- **4xx/5xx**: Display inline error with ShadCN Alert
- **Validation errors**: Field-level error messages

### Loading States

- Login button shows spinner during request
- Auth check shows full-page loader

## CLI Registration Tool

```bash
# From root directory
node backend/cli/admin-cli.js register

# Interactive prompts:
# → Username: admin
# → Email: admin@cumabaca.com
# → Password: ********
# → Confirm: ********
#
# ✓ Admin user registered successfully!
```

## Environment Variables

Add to `backend/.env`:

```env
JWT_SECRET=your-secret-key-here-change-in-production
ADMIN_JWT_EXPIRY=24h
SQLITE_PATH=./data/admin.db
```

Add to `admin/.env`:

```env
VITE_API_URL=http://localhost:3100
```

## Testing Checklist

1. Register admin via CLI
2. Login with invalid credentials → Show error
3. Login with valid credentials → Redirect to dashboard
4. Refresh page → Stay logged in (cookie persists)
5. Logout → Clear cookie, redirect to login
6. Access /dashboard without auth → Redirect to login

## Root Workspace Updates

Update `pnpm-workspace.yaml`:

```yaml
packages:
  - 'backend'
  - 'frontend'
  - 'admin'  # NEW
```

Update root `package.json` scripts:

```json
{
  "scripts": {
    "dev:admin": "pnpm run dev --workspace=admin",
    "build:admin": "pnpm run build --workspace=admin"
  }
}
```

## Future Extensibility

The architecture is designed for easy addition of:
- Dashboard with statistics
- Comic/Chapter management
- Cache management UI
- User management (if users are added)
- Settings/configuration panel
- Audit logs viewing
