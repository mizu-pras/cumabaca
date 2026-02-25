import { useState, useEffect } from 'react';
import { fetchChapters } from '@/lib/data-sources';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useReaderStore } from '@/stores/readerStore';

export function useChapterList() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const komik = useReaderStore(state => state.komik);

  const [data, setData] = useState({ entities: {}, ids: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!komik) {
      setData({ entities: {}, ids: [] });
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // Use cached fetchChapters - multiple calls share the same promise
    fetchChapters(komik, nsfwEnabled)
      .then(response => {
        if (cancelled) return;
        const chapters = response?.data || [];

        const entities = chapters.reduce((acc, item) => {
          acc[item.chapter] = item;
          return acc;
        }, {});

        const ids = chapters.map(item => item.chapter);

        setData({ entities, ids });
      })
      .catch(err => {
        if (cancelled) return;
        setError(err);
        setData({ entities: {}, ids: [] });
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [komik, nsfwEnabled]);

  return { ...data, isLoading, error };
}
