import { useSearchParams } from 'react-router';
import { useReaderStore } from '@/stores/readerStore';
import { useNsfwStore } from '@/stores/nsfwStore';

function validateAndFormatURL(url) {
  try {
    let parsedUrl = new URL(url);
    let formattedUrl = parsedUrl.origin + parsedUrl.pathname;
    if (formattedUrl.endsWith('/')) {
      formattedUrl = formattedUrl.slice(0, -1);
    }
    return formattedUrl;
  } catch (e) {
    console.error('URL tidak valid:', url);
    return null;
  }
}

export function ChapterForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { komik, setKomik } = useReaderStore();
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = validateAndFormatURL(formData.get('url'));
    if (!url) return;

    setKomik(url);
    setSearchParams({ url });
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-1 flex items-center flex-wrap gap-2">
      <div className="flex items-center gap-1">
        <label htmlFor="url">URL Komik:</label>
        <input
          type="text"
          name="url"
          placeholder="url komik"
          defaultValue={komik || ''}
          className="w-[250px] px-4 py-2 border-b border-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
      >
        Kirim
      </button>
      <button
        type="reset"
        className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:border-indigo-400 hover:text-indigo-700 transition-colors"
      >
        Hapus
      </button>
      {nsfwEnabled && (
        <input type="hidden" name="mode" value="secret" />
      )}
    </form>
  );
}
