# Cuma Baca - Frontend Workspace

This is the frontend workspace for Cuma Baca, a minimalist comic reader interface.

## Overview

React 19 SPA providing a clean, distraction-free reading experience with infinite scroll chapter loading.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **React Router v7** - Routing
- **Zustand** - State management
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons

## Development Commands

```bash
# Development server (Vite, runs on port 5173)
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Environment Variables

Create a `.env` file in the `frontend/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3100` |

**Note:** Variables must be prefixed with `VITE_` to be exposed to client-side code.

## Deployment

### Vercel
Configuration: `vercel.json`
```bash
npm i -g vercel
vercel
```

### Netlify
Configuration: `netlify.toml`
```bash
npm i -g netlify-cli
netlify deploy --prod
```

**Important:** Update `VITE_API_URL` in deployment settings to point to your backend URL.

## Project Structure

```
frontend/
├── index.html                 # HTML entry point
├── vite.config.js             # Vite configuration
├── postcss.config.js          # PostCSS for Tailwind v4
├── public/
│   └── input.css              # Tailwind CSS v4 source
└── src/
    ├── main.jsx               # React entry point
    ├── App.jsx                # Root app component
    ├── components/            # Shared components
    │   ├── BackToTop/
    │   ├── ErrorMessage/
    │   ├── Header/
    │   └── LoadingSpinner/
    ├── pages/                 # Page components
    │   ├── Reader/            # Main reader page
    │   │   ├── hooks/
    │   │   │   ├── useInfiniteChapters.js
    │   │   │   ├── useScrollPosition.js
    │   │   │   ├── useActiveChapterDetection.js
    │   │   │   └── useChapterNavigation.js
    │   │   └── components/
    │   │       ├── ChapterForm.jsx
    │   │       ├── ChapterSelector.jsx
    │   │       ├── FloatingChapterSelector.jsx
    │   │       ├── NavigationControls.jsx
    │   │       ├── ChapterImage.jsx
    │   │       ├── ChapterSeparator.jsx
    │   │       └── ChapterContent.jsx
    │   ├── Cached/            # Cached comics management
    │   ├── Secret/            # NSFW mode settings
    │   ├── Websites/          # Supported websites
    │   └── About/
    ├── stores/                # Zustand state stores
    │   ├── nsfwStore.js       # NSFW mode (localStorage persisted)
    │   └── readerStore.js     # Reader state
    ├── lib/                   # Utilities and API client
    │   ├── api.js             # Axios instance
    │   └── data-sources.js    # Data source definitions
    └── styles/                # Global styles
```

## State Management (Zustand)

### `nsfwStore.js`
- **Purpose:** NSFW mode toggle
- **Persistence:** `localStorage` key `nsfwEnabled`
- **State:** `nsfwEnabled` (boolean)

### `readerStore.js`
- **Purpose:** Reader state management
- **Features:** Infinite scroll, chapter tracking
- **State:** chapters, loading, hasMore, etc.

## Custom Hooks (Reader)

| Hook | Purpose |
|------|---------|
| `useInfiniteChapters` | Infinite scroll chapter loading |
| `useScrollPosition` | Track and restore scroll position |
| `useActiveChapterDetection` | Detect active chapter from scroll |
| `useChapterNavigation` | Chapter navigation logic |

## NSFW/Secret Mode

- Client-side toggle with warning messages
- Server-side validation via `mode=secret` parameter
- NSFW websites (e.g., sektedoujin.cc) filtered by default
- Zustand store with localStorage persistence

## API Integration

The frontend communicates with the backend API:

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

// Get chapters
axios.get(`${API_URL}/komik/chapters?url=${comicUrl}`)

// Get chapter data
axios.get(`${API_URL}/komik/data?url=${chapterUrl}`)

// Image proxy (for hotlink-protected images)
axios.get(`${API_URL}/komik/image?url=${imageUrl}`, { responseType: 'blob' })
```

## Key Features

- **Infinite Scroll:** Dynamically loads chapters as user scrolls
- **Chapter Detection:** Automatically highlights active chapter based on scroll position
- **Responsive:** Mobile-first design with Tailwind CSS
- **NSFW Filtering:** Opt-in secret mode for NSFW content
- **Vite HMR:** Fast hot module replacement during development
