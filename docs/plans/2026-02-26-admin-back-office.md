# Admin Back Office Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a standalone admin back office application with JWT authentication for the Cuma Baca comic scraper platform.

**Architecture:** New `admin` workspace in monorepo with React + ShadCN UI. Backend extended with admin API routes and SQLite database for user management. JWT tokens stored in httpOnly cookies for secure authentication.

**Tech Stack:** React 19, Vite, ShadCN UI, Tailwind CSS v4, Zustand, Express.js, SQLite, bcrypt, jsonwebtoken

---

## Phase 1: Monorepo Setup

### Task 1: Add admin workspace to pnpm-workspace

**Files:**
- Modify: `pnpm-workspace.yaml`

**Step 1: Add admin workspace to workspace list**

```yaml
packages:
  - 'backend'
  - 'frontend'
  - 'admin'
```

**Step 2: Commit**

```bash
git add pnpm-workspace.yaml
git commit -m "feat: add admin workspace to monorepo"
```

### Task 2: Add admin scripts to root package.json

**Files:**
- Modify: `package.json`

**Step 1: Add admin scripts**

```json
{
  "scripts": {
    "dev:admin": "pnpm run dev --workspace=admin",
    "build:admin": "pnpm run build --workspace=admin"
  }
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "feat: add admin scripts to root package.json"
```

---

## Phase 2: Backend - SQLite Setup

### Task 3: Install SQLite dependencies

**Files:**
- Modify: `backend/package.json`

**Step 1: Install better-sqlite3 and bcrypt packages**

```bash
cd backend && pnpm add better-sqlite3 bcrypt jsonwebtoken && cd ..
```

**Step 2: Commit**

```bash
git add backend/package.json pnpm-lock.yaml
git commit -m "feat: add sqlite and auth dependencies to backend"
```

### Task 4: Create SQLite configuration

**Files:**
- Create: `backend/config/sqlite.js`

**Step 1: Create SQLite connection module**

```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../data/admin.db');

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );
`);

module.exports = db;
```

**Step 2: Commit**

```bash
git add backend/config/sqlite.js
git commit -m "feat: add sqlite configuration and admin_users table"
```

---

## Phase 3: Backend - Admin User Model

### Task 5: Create AdminUser model

**Files:**
- Create: `backend/models/AdminUser.js`

**Step 1: Create AdminUser model with CRUD methods**

```javascript
const db = require('../config/sqlite');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

class AdminUser {
  static create({ username, password, email }) {
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const stmt = db.prepare(
      'INSERT INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)'
    );
    return stmt.run(username, passwordHash, email);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM admin_users WHERE username = ?');
    return stmt.get(username);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM admin_users WHERE id = ?');
    return stmt.get(id);
  }

  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }

  static updateLastLogin(id) {
    const stmt = db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
  }

  static toJSON(user) {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = AdminUser;
```

**Step 2: Commit**

```bash
git add backend/models/AdminUser.js
git commit -m "feat: add AdminUser model with bcrypt password hashing"
```

---

## Phase 4: Backend - Auth Controller

### Task 6: Create admin auth controller

**Files:**
- Create: `backend/controllers/adminController.js`

**Step 1: Create auth controller with login, logout, verify methods**

```javascript
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '24h';

const adminController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = AdminUser.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = AdminUser.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      AdminUser.updateLastLogin(user.id);

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      // Set httpOnly cookie
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        user: AdminUser.toJSON(user)
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async logout(req, res) {
    res.clearCookie('admin_token');
    res.json({ message: 'Logged out successfully' });
  },

  async getMe(req, res) {
    try {
      const token = req.cookies.admin_token;

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = AdminUser.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({ user: AdminUser.toJSON(user) });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = adminController;
```

**Step 2: Commit**

```bash
git add backend/controllers/adminController.js
git commit -m "feat: add admin auth controller with JWT"
```

---

## Phase 5: Backend - Admin Routes

### Task 7: Create admin routes

**Files:**
- Create: `backend/routes/admin.js`

**Step 1: Create admin auth routes**

```javascript
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Auth routes
router.post('/auth/login', adminController.login);
router.post('/auth/logout', adminController.logout);
router.get('/auth/me', adminController.getMe);

module.exports = router;
```

**Step 2: Register admin routes in app.js**

Modify: `backend/app.js`

```javascript
// Add after line 11
const adminRouter = require('./routes/admin');

// Add after line 41
app.use('/admin', adminRouter);
```

**Step 3: Commit**

```bash
git add backend/routes/admin.js backend/app.js
git commit -m "feat: add admin auth routes"
```

---

## Phase 6: Backend - CLI Registration Tool

### Task 8: Create CLI admin registration

**Files:**
- Create: `backend/cli/admin-cli.js`

**Step 1: Create interactive CLI for admin registration**

```javascript
const readline = require('readline');
const AdminUser = require('../models/AdminUser');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function register() {
  console.log('\n--- Admin User Registration ---\n');

  try {
    const username = await question('Username: ');
    const email = await question('Email: ');
    const password = await question('Password: ');
    const confirm = await question('Confirm Password: ');

    if (password !== confirm) {
      console.error('Error: Passwords do not match');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('Error: Password must be at least 6 characters');
      process.exit(1);
    }

    const result = AdminUser.create({ username, password, email });

    console.log('\n✓ Admin user registered successfully!');
    console.log(`  User ID: ${result.lastInsertRowid}`);
    console.log(`  Username: ${username}\n`);

    process.exit(0);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      console.error('Error: Username or email already exists');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

const command = process.argv[2];

if (command === 'register') {
  register();
} else {
  console.log('Usage: node admin-cli.js register');
  process.exit(1);
}
```

**Step 2: Add CLI script to package.json**

Modify: `backend/package.json`

```json
{
  "scripts": {
    "admin:register": "node cli/admin-cli.js register"
  }
}
```

**Step 3: Commit**

```bash
git add backend/cli/admin-cli.js backend/package.json
git commit -m "feat: add CLI tool for admin user registration"
```

---

## Phase 7: Admin Workspace Setup

### Task 9: Initialize admin workspace

**Files:**
- Create: `admin/package.json`
- Create: `admin/vite.config.js`
- Create: `admin/index.html`
- Create: `admin/postcss.config.js`
- Create: `admin/.gitignore`

**Step 1: Create admin package.json**

```json
{
  "name": "cumabaca-admin",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "lucide-react": "^0.575.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router": "^7.13.1",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "@vitejs/plugin-react": "^5.1.4",
    "autoprefixer": "^10.4.24",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "vite": "^7.3.1"
  }
}
```

**Step 2: Create admin vite.config.js**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/admin': {
        target: 'http://localhost:3100',
        changeOrigin: true
      }
    }
  }
});
```

**Step 3: Create admin index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cuma Baca - Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 4: Create admin postcss.config.js**

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**Step 5: Create admin .gitignore**

```
# Dependencies
node_modules

# Build output
dist

# Environment
.env.local
.env.*.local
```

**Step 6: Commit**

```bash
git add admin/
git commit -m "feat: initialize admin workspace with vite config"
```

---

## Phase 8: Admin Frontend - Tailwind Setup

### Task 10: Create Tailwind CSS v4 configuration

**Files:**
- Create: `admin/src/styles.css`
- Create: `admin/tailwind.config.js`

**Step 1: Create Tailwind v4 styles**

Create `admin/src/styles.css`:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 239 84% 58%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 239 84% 58%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: system-ui, -apple-system, sans-serif;
  }
}
```

**Step 2: Create Tailwind config**

Create `admin/tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
};
```

**Step 3: Commit**

```bash
git add admin/src/styles.css admin/tailwind.config.js
git commit -m "feat: add Tailwind CSS v4 configuration"
```

---

## Phase 9: Admin Frontend - Core Setup

### Task 11: Create core React files

**Files:**
- Create: `admin/src/main.jsx`
- Create: `admin/src/App.jsx`
- Create: `admin/src/lib/utils.js`

**Step 1: Create main.jsx entry point**

```javascript
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Step 2: Create App.jsx root component**

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useEffect } from 'react';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Step 3: Create utils.js with cn helper**

```javascript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

**Step 4: Commit**

```bash
git add admin/src/main.jsx admin/src/App.jsx admin/src/lib/utils.js
git commit -m "feat: add core React setup with protected routes"
```

---

## Phase 10: Admin Frontend - State Management

### Task 12: Create Zustand auth store

**Files:**
- Create: `admin/src/stores/authStore.js`

**Step 1: Create auth store with Zustand**

```javascript
import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    const response = await api.post('/admin/auth/login', credentials);
    set({
      user: response.data.user,
      isAuthenticated: true,
      isLoading: false
    });
  },

  logout: async () => {
    await api.post('/admin/auth/logout');
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  },

  checkAuth: async () => {
    try {
      const response = await api.get('/admin/auth/me');
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }
}));
```

**Step 2: Commit**

```bash
git add admin/src/stores/authStore.js
git commit -m "feat: add Zustand auth store"
```

---

## Phase 11: Admin Frontend - API Client

### Task 13: Create API client with interceptors

**Files:**
- Create: `admin/src/lib/api.js`

**Step 1: Create Axios instance with interceptors**

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for handling 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on 401
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Step 2: Create .env file**

Create `admin/.env`:

```env
VITE_API_URL=http://localhost:3100
```

**Step 3: Commit**

```bash
git add admin/src/lib/api.js admin/.env
git commit -m "feat: add API client with auth interceptors"
```

---

## Phase 12: Admin Frontend - ShadCN Setup

### Task 14: Initialize ShadCN UI

**Files:**
- Create: `admin/components.json`
- Modify: `admin/package.json`

**Step 1: Install ShadCN dependencies**

```bash
cd admin && pnpm add class-variance-authority clsx tailwind-merge && cd ..
```

**Step 2: Create ShadCN config**

Create `admin/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": false,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils"
  }
}
```

**Step 3: Commit**

```bash
git add admin/components.json admin/package.json pnpm-lock.yaml
git commit -m "feat: initialize ShadCN UI configuration"
```

---

## Phase 13: Admin Frontend - ShadCN Components

### Task 15: Install required ShadCN components

**Files:**
- Create: `admin/src/components/ui/button.jsx`
- Create: `admin/src/components/ui/card.jsx`
- Create: `admin/src/components/ui/input.jsx`
- Create: `admin/src/components/ui/label.jsx`
- Create: `admin/src/components/ui/alert.jsx`

**Step 1: Add ShadCN dependencies**

```bash
cd admin && pnpm add @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-separator && cd ..
```

**Step 2: Create Button component**

Create `admin/src/components/ui/button.jsx`:

```javascript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
```

**Step 3: Create Card component**

Create `admin/src/components/ui/card.jsx`:

```javascript
import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

**Step 4: Create Input component**

Create `admin/src/components/ui/input.jsx`:

```javascript
import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
```

**Step 5: Create Label component**

Create `admin/src/components/ui/label.jsx`:

```javascript
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

**Step 6: Create Alert component**

Create `admin/src/components/ui/alert.jsx`:

```javascript
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };
```

**Step 7: Commit**

```bash
git add admin/src/components/ui/
git commit -m "feat: add ShadCN base components"
```

---

## Phase 14: Admin Frontend - Pages

### Task 16: Create Login page

**Files:**
- Create: `admin/src/pages/Login.jsx`

**Step 1: Create Login page component**

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Cuma Baca</CardTitle>
          <CardDescription>Admin Panel - Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/pages/Login.jsx
git commit -m "feat: add login page with form validation"
```

### Task 17: Create Dashboard page

**Files:**
- Create: `admin/src/pages/Dashboard.jsx`

**Step 1: Create Dashboard placeholder page**

```javascript
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Cuma Baca</h1>
              <span className="text-sm text-slate-500">Admin Panel</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>{user?.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600">Welcome back, {user?.username}!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>More features will be added here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                This dashboard will display statistics and management tools for the Cuma Baca platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Info</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-slate-500">Username:</span> {user?.username}</div>
              <div><span className="text-slate-500">Email:</span> {user?.email}</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/pages/Dashboard.jsx
git commit -m "feat: add dashboard placeholder page"
```

---

## Phase 15: Installation and Testing

### Task 18: Install all dependencies

**Files:**
- None

**Step 1: Install dependencies for all workspaces**

```bash
pnpm install
```

**Step 2: Commit package lock**

```bash
git add pnpm-lock.yaml
git commit -m "chore: install admin dependencies"
```

### Task 19: Test admin registration via CLI

**Files:**
- None

**Step 1: Create data directory and register admin**

```bash
mkdir -p backend/data
pnpm run admin:register --workspace=backend
```

Follow prompts:
- Username: `admin`
- Email: `admin@cumabaca.com`
- Password: `admin123`
- Confirm: `admin123`

**Expected output:**
```
✓ Admin user registered successfully!
  User ID: 1
  Username: admin
```

### Task 20: Test the application

**Files:**
- None

**Step 1: Start backend in one terminal**

```bash
pnpm run dev:backend
```

**Step 2: Start admin in another terminal**

```bash
pnpm run dev:admin
```

**Step 3: Test login flow**

1. Navigate to `http://localhost:5174`
2. Should redirect to login page
3. Try invalid credentials → Should show error
4. Login with `admin` / `admin123` → Should redirect to dashboard
5. Refresh page → Should stay logged in
6. Click logout → Should redirect to login

**Step 4: Stop servers and commit**

```bash
git add .
git commit -m "feat: complete admin back office implementation"
```

---

## Phase 16: Documentation

### Task 21: Update README with admin section

**Files:**
- Modify: `README.md`

**Step 1: Add admin section to README**

Add after the Frontend section:

```markdown
## Admin Back Office

### Overview

The admin back office provides a secure interface for managing the Cuma Baca platform.

### Setup

1. **Register an admin user:**
   ```bash
   pnpm run admin:register --workspace=backend
   ```

2. **Start the admin application:**
   ```bash
   pnpm run dev:admin
   ```

3. **Access the admin panel:**
   - Navigate to `http://localhost:5174`
   - Login with registered credentials

### Environment Variables

Create a `.env` file in `admin/`:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3100` |

Add to `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret | `change-this-secret-in-production` |
| `ADMIN_JWT_EXPIRY` | Token expiration time | `24h` |
| `SQLITE_PATH` | SQLite database path | `./data/admin.db` |
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add admin back office documentation"
```

---

## Testing Checklist

After implementation, verify:

- [ ] Admin user can be registered via CLI
- [ ] Login with invalid credentials shows error message
- [ ] Login with valid credentials redirects to dashboard
- [ ] Page refresh maintains authentication (cookie persists)
- [ ] Logout clears cookie and redirects to login
- [ ] Accessing /dashboard without auth redirects to login
- [ ] API returns 401 for expired/invalid tokens
- [ ] UI is responsive on mobile and desktop
- [ ] All ShadCN components render correctly

---

## Implementation Complete

The admin back office is now ready with:
- Standalone admin workspace in monorepo
- JWT authentication with httpOnly cookies
- SQLite database for admin users
- CLI tool for admin registration
- Modern React + ShadCN UI with clean minimal design
- Protected routes with automatic redirect
- API interceptors for error handling

**Future enhancements:**
- Dashboard statistics
- Comic/chapter management UI
- Cache management interface
- Audit logs viewing
