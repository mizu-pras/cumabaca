# Komik Website Relations Design

**Date:** 2025-02-26
**Status:** Approved

## Overview

Menambahkan fitur untuk mengelola hubungan antara komik dan sumber website (many-to-many relationship) melalui halaman detail komik. Satu komik bisa berasal dari multiple website, dan setiap website link memiliki URL spesifik dan tracking chapter count.

## Page Layout

**Route:** `/komiks/:id`

**Structure:** Vertical sections stacked

```
┌─────────────────────────────────────────────┐
│  Breadcrumb: Komiks > One Piece             │
│  [Back button]                              │
├─────────────────────────────────────────────┤
│  KOMIK DETAIL SECTION                        │
│  - Cover, title, synopsis                   │
│  - Language, status, active toggle          │
│  - Actions: Edit, Delete                    │
├─────────────────────────────────────────────┤
│  WEBSITE SOURCES SECTION                    │
│  [+ Add Website]                             │
│  - Table of linked websites                  │
└─────────────────────────────────────────────┘
```

## Sections

### 1. Komik Detail Section

**Layout:** Cover image left, info right

**Fields:**
- Title (h2)
- Synopsis
- Language badge (name + code, green)
- Status badge (Ongoing=blue, Completed=green, Dropped=red)
- Active toggle (direct editable)
- Actions: Edit Komik, Delete Komik buttons

### 2. Website Sources Section

**Header:** "Website Sources" + "[+ Add Website]" button

**Table columns:**
| Column | Description |
|--------|-------------|
| Website Name | Name from websites table |
| URL | Full URL to komik page on that website |
| Total Chapters | Chapter count (integer) |
| Last Checked | Date or "-" if never checked |
| Actions | Edit, Delete buttons |

**Empty state:** "Belum ada website yang ditambahkan"

### 3. Add Website Modal

**Trigger:** "[+ Add Website]" button

**Fields:**
- Website *: Dropdown of active websites (excluding already added)
- URL *: Input field for komik URL on that website

**Behavior:**
- Centered modal with backdrop
- Validation on submit
- Success: Close modal, refresh table, toast "Website added"
- Error: Show error in modal

### 4. Edit/Delete Website

**Edit:** Opens modal with same form, Website dropdown disabled, URL editable

**Delete:** Confirmation dialog with website name and URL

## Routing

**New route:** `/komiks/:id` - Detail view

**Navigation:**
- Table → Click row → Navigate to detail
- Breadcrumb: "Komiks" → "Title"
- Back button → Returns to `/komiks`

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/komiks/:id` | Get komik detail |
| GET | `/admin/komiks/:id/websites` | Get linked websites |
| POST | `/admin/komik-websites` | Add website to komik |
| PUT | `/admin/komik-websites/:id` | Update website URL |
| DELETE | `/admin/komik-websites/:id` | Remove website |

## Error Handling

| Error | Handling |
|-------|----------|
| Network | Toast: "Gagal memuat data. Silakan coba lagi." |
| 404 | Redirect to `/komiks`, toast: "Komik tidak ditemukan" |
| 409 (duplicate) | Toast: "Website ini sudah ditambahkan" |
| Validation | Show error in modal/form |

## Loading States

- Initial load: Skeleton/spinner
- Add/Edit/Delete: Button disabled, text changes
