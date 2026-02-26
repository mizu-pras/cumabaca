import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { komiksApi } from '../../lib/adminApi';
import { languagesApi } from '../../lib/adminApi';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

function Komiks() {
  const [komiks, setKomiks] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchKomiks();
    fetchLanguages();
  }, [pagination.pageIndex, search, filterLang, filterStatus]);

  async function fetchKomiks() {
    setIsLoading(true);
    try {
      const response = await komiksApi.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search,
        language_id: filterLang,
        status: filterStatus,
      });
      setKomiks(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch komiks:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLanguages() {
    try {
      const response = await languagesApi.getAll();
      setLanguages(response.data.data);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this komik?')) return;

    try {
      await komiksApi.delete(id);
      fetchKomiks();
    } catch (error) {
      alert('Failed to delete komik: ' + error.message);
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ getValue }) => <span className="text-sm text-gray-900">{getValue()}</span>,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.cover_image && (
              <img
                src={row.original.cover_image}
                alt=""
                className="w-10 h-10 object-cover rounded"
              />
            )}
            <div>
              <Link
                to={`/komiks/${row.original.id}`}
                className="font-medium text-sm text-blue-600 hover:text-blue-800"
              >
                {row.original.title}
              </Link>
              {row.original.synopsis && (
                <div className="text-xs text-gray-500 truncate max-w-xs">
                  {row.original.synopsis}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'language_name',
        header: 'Language',
        cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue() || '-'}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() || 'ongoing';
          return (
            <span className={`px-2 py-1 rounded-full text-xs ${
              status === 'completed' ? 'bg-green-100 text-green-700' :
              status === 'dropped' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="text-right">
            <Link
              to={`/komiks/${row.original.id}/edit`}
              className="text-blue-600 hover:text-blue-800 mr-3"
            >
              <Pencil size={16} className="inline" />
            </Link>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 size={16} className="inline" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: komiks,
    columns,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Komiks</h1>
        <Link
          to="/komiks/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Komik
        </Link>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search komiks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="dropped">Dropped</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {komiks.length === 0 && (
            <div className="text-center py-8 text-gray-500">No komiks found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex justify-center gap-2 mt-6 items-center">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            &laquo;
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            &raquo;
          </button>
        </div>
      )}
    </div>
  );
}

export default Komiks;
