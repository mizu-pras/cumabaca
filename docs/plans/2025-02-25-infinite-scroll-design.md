# Infinite Scroll Feature Design

## Overview

Fitur infinite scroll untuk pembaca komik yang memungkinkan user membaca secara kontinyu tanpa perlu klik next/previous. Chapter berikutnya di-load secara otomatis dan di-append ke bawah konten saat ini.

## Requirements

1. **Infinite Scroll**: Scroll ke bawah otomatis load dan append chapter berikutnya
2. **Chapter Separator**: Header jelas antar chapter (e.g., "Chapter 2 - One Piece")
3. **Preload Strategy**: Eagerly load 2-3 chapter ke depan untuk smooth experience
4. **Active Chapter Detection**: Detect chapter yang sedang dilihat berdasarkan viewport
5. **Scroll Persistence**: Simpan dan restore scroll position per chapter di localStorage
6. **Memory Management**: Cleanup chapter lama untuk mencegah memory leak
7. **Navigation Controls**: Tombol Next/Previous berfungsi sebagai scroll shortcut

## Architecture

### Approach: Single Component with Loaded Chapters Array

State `loadedChapters` menyimpan array chapter yang sudah diload. Semua loaded chapter dirender sekaligus dalam satu komponen dengan Intersection Observer untuk deteksi chapter aktif.

**Rationale:** Sederhana, mudah maintain, dan performa cukup baik untuk 2-3 chapter (±150 gambar).

## Components

### New Hooks

1. **`useInfiniteChapters`**
   - Mengelola state `loadedChapters` (normalized: entities + ids)
   - Handle initial load chapter pertama
   - Preload 2-3 chapter ke depan secara eager
   - Memory management: hapus chapter yang jauh dari active
   - Return: `{ loadedChapters, activeChapter, isLoading, error }`

2. **`useActiveChapterDetection`**
   - Setup Intersection Observer pada first image setiap chapter
   - Update `activeChapter` di readerStore saat chapter berubah
   - Trigger: saat gambar pertama masuk viewport (threshold: 0)
   - Return: cleanup function

3. **`useScrollPosition`**
   - Simpan scroll Y position ke localStorage (throttle 200ms)
   - Key format: `cumabaca_scroll_${comicUrl}_${chapterId}`
   - Restore position saat active chapter berubah (delay 100ms)
   - Return: cleanup function

### New Components

1. **`ChapterSeparator`**
   - Render pembatas antar chapter dengan sticky header
   - Tampilkan "Chapter X - [Title]"
   - Show error state & retry button jika load gagal
   - Props: `{ chapter, title, error, onRetry }`

### Modified Components

1. **`ChapterContent`**
   - Render MULTIPLE chapters dari `loadedChapters.ids`
   - Setiap chapter dibungkus `ChapterSeparator`
   - First image setiap chapter: `data-chapter-id={id}` untuk Intersection Observer

2. **`NavigationControls`**
   - Next: scroll ke top chapter berikutnya di loadedChapters
   - Previous: scroll ke top chapter sebelumnya di loadedChapters
   - Gunakan `scrollIntoView({ behavior: 'smooth' })`

## State Management

### readerStore (New State)

```javascript
{
   // Existing
   komik: null,
   activeChapter: null,

   // New
   loadedChapterIds: [],        // Chapter IDs yang sudah diload
   activeScrollChapter: null,   // Chapter yang sedang dilihat (viewport)
}
```

### LocalStorage Schema

```javascript
// Key format
`cumabaca_scroll_${comicUrl}_${chapterId}`

// Value
"1234" // scroll Y position dalam pixels
```

## Data Flow

```
User buka komik dengan URL
    ↓
useInfiniteChapters detect komik & activeChapter
    ↓
Fetch activeChapter data (cached via data-sources.js)
    ↓
Simpan ke loadedChapters state
    ↓
Preload N+1, N+2, N+3 (parallel fetch)
    ↓
Render semua loaded chapters dengan separator
    ↓
Intersection Observer detect active chapter (first image in viewport)
    ↓
Update activeScrollChapter di store
    ↓
ChapterSelector sync otomatis
    ↓
User scroll → simpan position ke localStorage
```

## Preload Strategy

```javascript
// Saat activeChapter berubah
const currentIndex = allChapterIds.indexOf(activeChapter);

// Preload 2-3 chapter berikutnya (descending order: N+1, N+2, N+3)
for (let i = 1; i <= 3; i++) {
   const nextId = allChapterIds[currentIndex - i];
   if (nextId && !loadedChapterIds.includes(nextId)) {
      loadChapter(nextId);
   }
}
```

## Memory Management

**Cleanup Rules:**
- Minimum 10 chapter sebelum cleanup dimulai
- Simpan 5 chapter sebelum active chapter (user bisa scroll up)
- Chapter yang sudah lewat > 5 dari active dihapus dari memory
- Preload tetap 3 chapter ke depan

```javascript
// Hapus chapter yang jauh dari active
const toRemove = loadedChapterIds.filter(id => {
   const index = allChapterIds.indexOf(id);
   return index < activeIndex - 5; // keep 5 chapters before active
});

if (toRemove.length > 0 && loadedChapterIds.length > 10) {
   // Remove from state
}
```

## Intersection Observer

**Target:** Gambar pertama dari setiap chapter

**Options:**
```javascript
{
   root: null,        // viewport
   rootMargin: '0px',
   threshold: 0       // trigger saat any part enters viewport
}
```

**Implementation:**
- Set `data-chapter-id={id}` pada first image setiap chapter
- Observer trigger saat image masuk viewport → update `activeChapter`
- Multiple chapters bisa be visible, gunakan yang paling atas

## Error Handling

**State per chapter:**
```javascript
{
   id: 'chapter-2',
   loaded: false,
   error: 'Network error'  // atau null
}
```

**UI:**
- Tampilkan pesan error di `ChapterSeparator`
- "Failed to load Chapter 2. Tap to retry."
- Tombol retry trigger `loadChapter(id)` lagi

## Implementation Files

### New Files
1. `src/pages/Reader/hooks/useInfiniteChapters.js`
2. `src/pages/Reader/hooks/useActiveChapterDetection.js`
3. `src/pages/Reader/hooks/useScrollPosition.js`
4. `src/pages/Reader/components/ChapterSeparator.jsx`

### Modified Files
1. `src/pages/Reader/hooks/useChapterList.js` - Keep for chapter IDs
2. `src/pages/Reader/hooks/useChapterData.js` - Merge/refactor into useInfiniteChapters
3. `src/pages/Reader/components/ChapterContent.jsx` - Render multiple chapters
4. `src/pages/Reader/components/NavigationControls.jsx` - Scroll shortcut logic
5. `src/stores/readerStore.js` - Add new state
6. `src/pages/Reader/Reader.jsx` - Wire up new hooks

## Testing Checklist

- [ ] Chapter pertama load
- [ ] Scroll ke bawah → next chapter muncul dengan separator
- [ ] 2-3 chapter ke depan ter-load otomatis
- [ ] Active chapter berubah di selector saat scroll
- [ ] Selector sync dengan visible chapter
- [ ] Scroll position save & restore
- [ ] Chapter lama dihapus dari DOM (memory management)
- [ ] Scroll up ke deleted chapter → re-render
- [ ] First chapter & last chapter edge cases
- [ ] Network error → retry UI works
- [ ] NSFW mode works

## Edge Cases

1. **First Chapter**: Tidak ada previous chapter, prev button disabled
2. **Last Chapter**: Tidak ada next chapter, selesai preload
3. **Network Error**: Tampilkan error di separator, allow retry
4. **Chapter Deleted**: Scroll up ke chapter yang dihapus → re-fetch
5. **Refresh Browser**: Restore ke saved chapter & scroll position

## Performance Considerations

- Cache via `data-sources.js` sudah mencegah duplicate requests
- Memory: 10 chapter × 50 gambar = 500 gambar (reasonable)
- Throttle scroll listener 200ms untuk localStorage writes
- Intersection Observer lebih efficient daripada scroll event polling

## Future Enhancements (Out of Scope)

- Virtual list untuk chapter count sangat tinggi
- Image lazy loading per chapter
- Predictive preload berdasarkan reading speed
- Save reading progress ke backend (sync across devices)
