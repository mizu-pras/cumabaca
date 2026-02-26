import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { komiksApi } from '../../../lib/adminApi';
import { komikWebsitesApi } from '../../../lib/adminApi';
import { websitesApi } from '../../../lib/adminApi';
import { ArrowLeft, Plus, ExternalLink, Trash2, Edit2, Globe, CheckCircle, XCircle } from 'lucide-react';
import WebsiteSources from './WebsiteSources';

function KomikDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [komik, setKomik] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchKomik() {
      try {
        const response = await komiksApi.getById(id);
        setKomik(response.data.data);
      } catch (error) {
        setError('Failed to load komik details');
        console.error('Failed to fetch komik:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchKomik();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Loading komik details...</div>
      </div>
    );
  }

  if (error || !komik) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate('/komiks')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Komiks
        </button>
        <div className="text-red-600">{error || 'Komik not found'}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/komiks')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Komiks
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{komik.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                komik.status === 'completed' ? 'bg-green-100 text-green-700' :
                komik.status === 'dropped' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {komik.status?.charAt(0).toUpperCase() + komik.status?.slice(1) || 'Ongoing'}
              </span>
              {komik.language_name && (
                <span className="text-sm text-gray-600">{komik.language_name}</span>
              )}
              <span className={`flex items-center gap-1 text-xs ${
                komik.is_active ? 'text-green-600' : 'text-gray-400'
              }`}>
                {komik.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {komik.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate(`/komiks/${komik.id}/edit`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Komik
          </button>
        </div>
      </div>

      {/* Komik Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Cover Image */}
        {komik.cover_image && (
          <div className="lg:col-span-1">
            <img
              src={komik.cover_image}
              alt={komik.title}
              className="w-full max-w-sm rounded-lg shadow-md object-cover"
            />
          </div>
        )}

        {/* Synopsis */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Synopsis</h2>
            <p className="text-gray-700 leading-relaxed">
              {komik.synopsis || 'No synopsis available.'}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Created:</span>
                <span className="ml-2 text-gray-900">
                  {komik.created_at ? new Date(komik.created_at).toLocaleDateString() : '-'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Last Updated:</span>
                <span className="ml-2 text-gray-900">
                  {komik.updated_at ? new Date(komik.updated_at).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Website Sources Section */}
      <WebsiteSources komikId={komik.id} komikTitle={komik.title} />
    </div>
  );
}

export default KomikDetail;
