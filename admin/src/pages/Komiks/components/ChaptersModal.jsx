import { useState, useEffect } from 'react';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { komikWebsitesApi } from '../../../lib/adminApi';

export default function ChaptersModal({ komikWebsite, onClose }) {
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchChapters() {
      try {
        const response = await komikWebsitesApi.getChapters(komikWebsite.id);
        setChapters(response.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load chapters');
      } finally {
        setIsLoading(false);
      }
    }
    fetchChapters();
  }, [komikWebsite.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chapters</h2>
            <p className="text-sm text-gray-500 mt-1">
              {komikWebsite.website_name} &mdash; {chapters.length} chapters
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin mr-2 text-gray-400" />
              <span className="text-gray-500">Loading chapters...</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No chapters found. Try scraping first.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 text-sm font-medium text-gray-500">Chapter</th>
                  <th className="pb-3 text-sm font-medium text-gray-500">URL</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((ch) => (
                  <tr key={ch.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">
                      {ch.chapter_number}
                    </td>
                    <td className="py-3 text-sm">
                      <a
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <span className="truncate max-w-xs">{ch.url}</span>
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
