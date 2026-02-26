import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit2, Trash2, Loader2, ChevronRight } from 'lucide-react';
import { komiksApi } from '../../lib/adminApi';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

function Komiks() {
  const navigate = useNavigate();
  const [komiks, setKomiks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchKomiks();
  }, [pagination.page]);

  async function fetchKomiks() {
    try {
      const response = await komiksApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
      });
      setKomiks(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch komiks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this komik?')) return;
    try {
      await komiksApi.delete(id);
      fetchKomiks();
    } catch (error) {
      alert('Failed to delete komik: ' + (error.response?.data?.error || error.message));
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/komiks/${row.original.id}`)}
            className="flex items-center gap-2 font-medium text-left hover:text-primary transition-colors group"
          >
            <span className="flex-1 text-left">{row.getValue('title')}</span>
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
          </button>
        ),
      },
      {
        accessorKey: 'language_name',
        header: 'Language',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              status === 'completed' ? 'bg-green-100 text-green-700' :
              status === 'dropped' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Ongoing'}
            </span>
          );
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Active',
        cell: ({ getValue }) => (
          <span className={getValue() ? 'text-green-600' : 'text-muted-foreground'}>
            {getValue() ? 'Yes' : 'No'}
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
              onClick={() => navigate(`/komiks/${row.original.id}/edit`)}
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
    [navigate]
  );

  const table = useReactTable({
    data: komiks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Komiks</h1>
          <p className="text-muted-foreground">Manage your comic collection</p>
        </div>
        <Button onClick={() => navigate('/komiks/new')} className="gap-2">
          <Plus size={20} />
          Add Komik
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Komiks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Loading komiks...</span>
            </div>
          ) : komiks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No komiks found. Add your first komik to get started.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
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

              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Komiks;
