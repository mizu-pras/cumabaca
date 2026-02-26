import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { komikWebsitesApi } from '../../../lib/adminApi';

function EditWebsiteModal({ komikWebsite, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    url: '',
    total_chapters: 0,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData({
      url: komikWebsite.url || '',
      total_chapters: komikWebsite.total_chapters || 0,
    });
  }, [komikWebsite]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.url) {
      setError('Please enter the comic URL');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        url: formData.url.trim(),
        total_chapters: parseInt(formData.total_chapters) || 0,
      };

      await komikWebsitesApi.update(komikWebsite.id, payload);
      onSuccess();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update website source';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Website Source</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Display website name (read-only) */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Website:</span> {komikWebsite.website_name}
            </p>
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Comic URL *
            </label>
            <input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="https://example.com/manga/one-piece"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The specific URL for this komik on {komikWebsite.website_name}
            </p>
          </div>

          <div>
            <label htmlFor="total_chapters" className="block text-sm font-medium text-gray-700 mb-2">
              Total Chapters
            </label>
            <input
              id="total_chapters"
              type="number"
              min="0"
              value={formData.total_chapters}
              onChange={(e) => setFormData({ ...formData, total_chapters: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="0"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Changing the URL will update the source location for this komik.
              Make sure the new URL is valid and accessible.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditWebsiteModal;
