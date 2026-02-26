import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { komiksApi } from '../../../lib/adminApi';
import { languagesApi } from '../../../lib/adminApi';

function KomikForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    language_id: '',
    cover_image: '',
    status: 'ongoing',
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

      // Fetch komik if editing
      if (id) {
        try {
          const response = await komiksApi.getById(id);
          const data = response.data.data;
          setFormData({
            title: data.title,
            synopsis: data.synopsis || '',
            language_id: data.language_id || '',
            cover_image: data.cover_image || '',
            status: data.status || 'ongoing',
            is_active: Boolean(data.is_active),
          });
        } catch (error) {
          setError('Failed to load komik');
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
        is_active: formData.is_active ? 1 : 0,
      };

      if (isEdit) {
        await komiksApi.update(id, payload);
      } else {
        await komiksApi.create(payload);
      }

      navigate('/komiks');
    } catch (error) {
      setError(error.message || 'Failed to save komik');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Komik' : 'Add Komik'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., One Piece"
            required
          />
        </div>

        <div>
          <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700 mb-2">
            Synopsis
          </label>
          <textarea
            id="synopsis"
            value={formData.synopsis}
            onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Brief description of the komik..."
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
          <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image URL
          </label>
          <input
            id="cover_image"
            type="url"
            value={formData.cover_image}
            onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="https://example.com/cover.jpg"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
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
            onClick={() => navigate('/komiks')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default KomikForm;
