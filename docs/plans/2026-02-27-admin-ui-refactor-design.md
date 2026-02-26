# Admin UI Refactor Design Document

**Date:** 2026-02-27
**Status:** Approved
**Approach:** Copy-Paste Adaptation from shadcn-admin

## Overview

Refactor the admin panel UI to use a modern design inspired by [shadcn-admin](https://github.com/satnaing/shadcn-admin). The refactoring will copy layout components from shadcn-admin and adapt them to work with React Router v7.

### Scope

**Included:**
- Modern collapsible sidebar with state persistence
- Header with breadcrumbs, collapse toggle, and user dropdown
- Light theme only (no dark mode)
- All existing pages updated with new styling
- New Komik Detail page with Website Sources management

**Excluded:**
- Dark mode theme switching
- Command palette (Cmd+K)
- Search functionality in header
- Migration to TanStack Router (staying with React Router v7)

## Architecture

### Folder Structure

```
admin/src/
├── components/
│   ├── ui/              # Existing + NEW from shadcn-admin
│   │   ├── alert.jsx, button.jsx, card.jsx, input.jsx, label.jsx (existing)
│   │   ├── sidebar.jsx, sidebar-trigger.jsx, sidebar-inset.jsx (NEW)
│   │   ├── dropdown-menu.jsx (NEW)
│   │   ├── avatar.jsx, breadcrumb.jsx (NEW)
│   │   └── dialog.jsx (NEW)
│   ├── layout/          # NEW - Copied/adapted from shadcn-admin
│   │   ├── app-sidebar.tsx
│   │   ├── header.tsx
│   │   ├── nav-user.tsx
│   │   ├── data/
│   │   │   └── sidebar-data.ts
│   │   └── types.ts
│   └── Admin/
│       ├── ProtectedRoute.jsx (keep)
│       └── Sidebar.jsx (REMOVE - replaced by app-sidebar)
├── lib/
│   ├── utils.js (keep)
│   └── cookies.js (NEW)
├── context/
│   └── layout-provider.tsx (NEW)
└── pages/
    ├── Admin/
    │   └── AdminLayout.jsx (MODIFY)
    ├── Dashboard/
    │   └── Dashboard.jsx (MODIFY)
    ├── Komiks/
    │   ├── index.jsx (MODIFY)
    │   ├── KomikForm.jsx (MODIFY)
    │   ├── KomikDetail.jsx (MODIFY - breadcrumb integration)
    │   ├── WebsiteSources.jsx (MODIFY - table styling)
    │   ├── AddWebsiteModal.jsx (MODIFY - use Dialog)
    │   └── EditWebsiteModal.jsx (MODIFY - use Dialog)
    ├── Languages/ (MODIFY)
    └── Websites/ (MODIFY)
```

## Components

### Layout Components (from shadcn-admin)

| Component | Purpose | Adaptation |
|-----------|---------|------------|
| `app-sidebar.tsx` | Collapsible sidebar | Adapt to React Router v7, update menu items |
| `header.tsx` | Top header | Remove search, keep collapse + breadcrumbs + user dropdown |
| `nav-user.tsx` | User avatar dropdown | Connect to authStore |
| `sidebar-data.ts` | Navigation structure | Update to our menu items |

### UI Components to Add

| Component | Package | Purpose |
|-----------|---------|---------|
| `sidebar.jsx` | Radix UI | Sidebar primitive |
| `sidebar-trigger.jsx` | Radix UI | Collapse toggle button |
| `sidebar-inset.jsx` | Radix UI | Content wrapper |
| `dropdown-menu.jsx` | Radix UI | User dropdown menu |
| `avatar.jsx` | Radix UI | User avatar display |
| `breadcrumb.jsx` | Radix UI | Breadcrumb navigation |
| `dialog.jsx` | Radix UI | Modal dialogs |

## Data Flow

### Sidebar State

```
Cookie (sidebar_state) ←→ lib/cookies.js ←→ SidebarProvider ←→ AppSidebar/Header
```

- Default: expanded on desktop, collapsed on mobile
- Persists to `sidebar_state` cookie
- Read on mount to restore state

### Auth Flow (Unchanged)

- `authStore.js` (Zustand) - remains unchanged
- `ProtectedRoute.jsx` - remains unchanged
- User dropdown reads from `useAuthStore()`

### Breadcrumb Generation

```
React Router location → Header → Generate breadcrumbs from path
```

## Dependencies

### New Dependencies

```json
{
  "@radix-ui/react-avatar": "^1.1.3",
  "@radix-ui/react-dropdown-menu": "^2.1.4",
  "@radix-ui/react-dialog": "^1.1.5",
  "@radix-ui/react-scroll-area": "^1.2.2"
}
```

### Existing (Keep)

- React Router v7
- TanStack React Table
- Zustand
- Tailwind CSS v4
- Lucide React
- All existing Radix UI components

## Styling

### Color Palette (Light Theme)

```css
/* Primary - Actions, links */
--primary: 222.2 47.4% 11.2%          /* #0f172a */
--primary-foreground: 210 40% 98%     /* #f8fafc */

/* Secondary */
--secondary: 210 40% 96%              /* #f1f5f9 */
--secondary-foreground: 222.2 47.4% 11.2%  /* #0f172a */

/* Muted */
--muted: 210 40% 96%                  /* #f1f5f9 */
--muted-foreground: 215 4% 46%        /* #64748b */

/* Borders, Inputs */
--border: 214.3 31.8% 91%             /* #e2e8f0 */
--input: 214.3 31.8% 91%              /* #e2e8f0 */

/* Backgrounds */
--background: 0 0% 100%               /* #ffffff */
--foreground: 222.2 47.4% 11.2%       /* #0f172a */

/* Sidebar */
--sidebar-background: 0 0% 98%       /* #fafafa */
--sidebar-foreground: 222.2 47.4% 11.2%  /* #0f172a */
--sidebar-border: 214.3 31.8% 91%    /* #e2e8f0 */
```

## Implementation Phases

### Phase 1: Setup & UI Components
1. Add new dependencies
2. Add new UI components from shadcn
3. Create `lib/cookies.js`
4. Create `context/layout-provider.tsx`

### Phase 2: Layout Components
1. Copy and adapt `app-sidebar.tsx`
2. Copy and adapt `header.tsx`
3. Copy and adapt `nav-user.tsx`
4. Update `AdminLayout.jsx`

### Phase 3: Update Pages
1. Update `Dashboard.jsx` stat cards
2. Update `Komiks/index.jsx` table
3. Update `KomikDetail.jsx` with breadcrumb
4. Update modals to use shadcn Dialog
5. Update form styling

### Phase 4: Cleanup
1. Remove old `Sidebar.jsx`
2. Test sidebar collapse
3. Test breadcrumbs
4. Verify all CRUD operations

## Edge Cases

### Mobile Responsive
- Sidebar collapses to icons-only on mobile (< 768px)
- Hamburger menu toggles sidebar
- Full-width content when collapsed

### Breadcrumb Edge Cases
- `/dashboard` → "Dashboard" only (not linked)
- `/komiks` → "Dashboard > Komiks" (Komiks linked)
- `/komiks/:id` → "Dashboard > Komiks > [Title]"
- `/komiks/:id/edit` → "Dashboard > Komiks > [Title] > Edit"

### Modal Backdrops
- Use shadcn Dialog for consistent z-index
- Ensure modals work with collapsed sidebar

## Testing Checklist

- [ ] Sidebar collapses/expands correctly
- [ ] Sidebar state persists across page reloads
- [ ] Mobile responsive behavior works
- [ ] Breadcrumbs display correctly on all pages
- [ ] User dropdown and logout works
- [ ] All CRUD operations function
- [ ] Modals open/close correctly
- [ ] Komik Detail page shows breadcrumbs
- [ ] Website Sources table displays properly
