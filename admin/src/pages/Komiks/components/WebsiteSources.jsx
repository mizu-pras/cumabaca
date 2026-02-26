import { useState, useEffect, useMemo } from 'react';
import { komikWebsitesApi } from '../../../lib/adminApi';
import { websitesApi } from '../../../lib/adminApi';
import { Plus, ExternalLink, Trash2, Edit2, Globe, Loader2 } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import AddWebsiteModal from './AddWebsiteModal';
import EditWebsiteModal from './EditWebsiteModal';

function WebsiteSources({ komikId, komikTitle }) {
  const [websites, setWebsites] = useState([]);
  const [availableWebsites, setAvailableWebsites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null);

  useEffect(() => {
    fetchWebsites();
    fetchAvailableWebsites();
  }, [komikId]);

  async function fetchWebsites() {
    try {
      const response = await komikWebsitesApi.getAll({ komik_id: komikId });
      setWebsites(response.data.data);
    } catch (error) {
      setError('Failed to load website sources');
      console.error('Failed to fetch komik websites:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAvailableWebsites() {
    try {
      const response = await websitesApi.getAll();
      setAvailableWebsites(response.data.data);
    } catch (error) {
      console.error('Failed to fetch available websites:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this website source?')) return;

    try {
      await komikWebsitesApi.delete(id);
      fetchWebsites();
    } catch (error) {
      alert('Failed to remove website: ' + (error.response?.data?.error || error.message));
    }
  }

  function handleAdd() {
    setShowAddModal(true);
  }

  function handleEdit(komikWebsite) {
    setEditingWebsite(komikWebsite);
    setShowEditModal(true);
  }

  function handleAddSuccess() {
    setShowAddModal(false);
    fetchWebsites();
  }

  function handleEditSuccess() {
    setShowEditModal(false);
    setEditingWebsite(null);
    fetchWebsites();
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'website_name',
        header: 'Website',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Globe size={18} className="text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-sm text-gray-900">{row.original.website_name}</div>
              <a
                href={row.original.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Visit site <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'url',
        header: 'Comic URL',
        cell: ({ getValue }) => (
          <div className="max-w-xs">
            <a
              href={getValue()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <span className="truncate block">{getValue()}</span>
              <ExternalLink size={14} className="shrink-0" />
            </a>
          </div>
        ),
      },
      {
        accessorKey: 'total_chapters',
        header: 'Total Chapters',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600">{getValue() || 0}</span>
        ),
      },
      {
        accessorKey: 'last_checked_at',
        header: 'Last Checked',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600">
            {getValue() ? new Date(getValue()).toLocaleDateString() : 'Never'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
              title="Edit website source"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
              title="Remove website source"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: websites,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Website Sources</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Website Source
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="animate-spin mr-2" size={20} />
          Loading website sources...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {websites.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Globe size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No website sources added yet</p>
              <p className="text-sm mt-1">Add a website source to track where this komik is available</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())
                        }
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Website Modal */}
      {showAddModal && (
        <AddWebsiteModal
          komikId={komikId}
          komikTitle={komikTitle}
          availableWebsites={availableWebsites}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Website Modal */}
      {showEditModal && editingWebsite && (
        <EditWebsiteModal
          komikWebsite={editingWebsite}
          onClose={() => {
            setShowEditModal(false);
            setEditingWebsite(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

export default WebsiteSources;
