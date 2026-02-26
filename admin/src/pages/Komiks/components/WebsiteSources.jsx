import { useState, useEffect, useMemo } from 'react';
import { komikWebsitesApi } from '../../../lib/adminApi';
import { websitesApi } from '../../../lib/adminApi';
import { Plus, ExternalLink, Trash2, Edit2, Globe, Loader2 } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
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
            <div className="p-2 bg-muted rounded-lg">
              <Globe size={18} className="text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium text-sm">{row.original.website_name}</div>
              <a
                href={row.original.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
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
              className="text-sm text-primary hover:underline flex items-center gap-1"
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
          <span className="text-sm text-muted-foreground">{getValue() || 0}</span>
        ),
      },
      {
        accessorKey: 'last_checked_at',
        header: 'Last Checked',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue() ? new Date(getValue()).toLocaleDateString() : 'Never'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Website Sources</CardTitle>
          <Button onClick={handleAdd} size="sm" className="gap-2">
            <Plus size={16} />
            Add Source
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Loading website sources...</span>
          </div>
        ) : websites.length === 0 ? (
          <div className="text-center py-12">
            <Globe size={48} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-lg font-medium">No website sources added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add a website source to track where this komik is available</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground"
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
              <tbody className="divide-y">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
      </CardContent>
    </Card>
  );
}

export default WebsiteSources;
