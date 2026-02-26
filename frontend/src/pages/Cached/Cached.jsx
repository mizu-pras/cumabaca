import { Suspense } from 'react';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useCachedComics } from './hooks/useCachedComics';
import { ComicCard } from './components/ComicCard';
import { LoadingSpinner } from '@/components/LoadingSpinner/LoadingSpinner';

function CachedContent() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const comics = useCachedComics();

  const visibleComics = comics.filter(comic =>
    !comic.isNsfw || nsfwEnabled
  );

  if (comics.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Belum ada komik yang di-cache
        </h2>
        <p className="text-gray-600">
          Baca komik pertama Anda untuk melihatnya muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleComics.map(comic => (
        <ComicCard key={comic.url} comic={comic} />
      ))}
    </div>
  );
}

export function Cached() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Komik Ter-Cache</h1>
      <p className="text-gray-600 mb-8">
        Daftar komik yang sudah di-scrape dan tersimpan di cache.
      </p>
      <Suspense fallback={<LoadingSpinner message="Memuat daftar komik ter-cache..." />}>
        <CachedContent />
      </Suspense>
    </div>
  );
}
