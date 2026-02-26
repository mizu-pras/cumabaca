import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { websitesApi } from '../../../lib/adminApi';
import { languagesApi } from '../../../lib/adminApi';

function WebsiteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    language_id: '',
    use_browser: false,
    search_endpoint: '',
    is_nsfw: false,
    is_active: true,
  });
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);

  useEffect(() => {
    async function fetchData() {
      // Fetch languages
      try {
        const response = await languagesApi.getAll();
        setLanguages(response.data.data);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }

      // Fetch website if editing
      if (id) {
        try {
          const response = await websitesApi.getById(id);
          const data = response.data.data;
          setFormData({
            name: data.name,
            url: data.url,
            language_id: data.language_id || '',
            use_browser: Boolean(data.use_browser),
            search_endpoint: data.search_endpoint || '',
            is_nsfw: Boolean(data.is_nsfw),
            is_active: Boolean(data.is_active),
          });
        } catch (error) {
          setError('Failed to load website');
        } finally {
          setIsFetching(false);
        }
      } else {
        setIsFetching(false);
      }
    }

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        use_browser: formData.use_browser ? 1 : 0,
        is_nsfw: formData.is_nsfw ? 1 : 0,
        is_active: formData.is_active ? 1 : 0,
      };

      if (isEdit) {
        await websitesApi.update(id, payload);
      } else {
        await websitesApi.create(payload);
      }

      navigate('/websites');
    } catch (error) {
      setError(error.message || 'Failed to save website');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Website' : 'Add Website'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., Komiku"
            required
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            URL *
          </label>
          <input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., https://komiku.org"
            required
          />
        </div>

        <div>
          <label htmlFor="language_id" className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            id="language_id"
            value={formData.language_id}
            onChange={(e) => setFormData({ ...formData, language_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select Language</option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="search_endpoint" className="block text-sm font-medium text-gray-700 mb-2">
            Search Endpoint
          </label>
          <input
            id="search_endpoint"
            type="text"
            value={formData.search_endpoint}
            onChange={(e) => setFormData({ ...formData, search_endpoint: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., /search?q="
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="use_browser"
              type="checkbox"
              checked={formData.use_browser}
              onChange={(e) => setFormData({ ...formData, use_browser: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="use_browser" className="ml-2 text-sm text-gray-700">
              Use Headless Browser
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="is_nsfw"
              type="checkbox"
              checked={formData.is_nsfw}
              onChange={(e) => setFormData({ ...formData, is_nsfw: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_nsfw" className="ml-2 text-sm text-gray-700">
              NSFW Content
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/websites')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default WebsiteForm;
