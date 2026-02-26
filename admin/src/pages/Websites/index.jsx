import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { websitesApi } from '../../lib/adminApi';
import { languagesApi } from '../../lib/adminApi';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

function Websites() {
  const [websites, setWebsites] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');

  useEffect(() => {
    fetchWebsites();
    fetchLanguages();
  }, [pagination.pageIndex, search, filterLang]);

  async function fetchWebsites() {
    setIsLoading(true);
    try {
      const response = await websitesApi.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search,
        language_id: filterLang,
      });
      setWebsites(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch websites:', error);
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
    if (!confirm('Are you sure you want to delete this website?')) return;

    try {
      await websitesApi.delete(id);
      fetchWebsites();
    } catch (error) {
      alert('Failed to delete website: ' + error.message);
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
        accessorKey: 'name',
        header: 'Name',
        cell: ({ getValue }) => <span className="text-sm text-gray-900">{getValue()}</span>,
      },
      {
        accessorKey: 'url',
        header: 'URL',
        cell: ({ getValue }) => <span className="text-sm text-gray-600 max-w-xs truncate block">{getValue()}</span>,
      },
      {
        accessorKey: 'language_name',
        header: 'Language',
        cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue() || '-'}</span>,
      },
      {
        accessorKey: 'use_browser',
        header: 'Browser',
        cell: ({ getValue }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            getValue() ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {getValue() ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        accessorKey: 'is_nsfw',
        header: 'NSFW',
        cell: ({ getValue }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            getValue() ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {getValue() ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="text-right">
            <Link
              to={`/websites/${row.original.id}/edit`}
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
    data: websites,
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
        <h1 className="text-2xl font-bold text-gray-900">Websites</h1>
        <Link
          to="/websites/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Website
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search websites..."
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

          {websites.length === 0 && (
            <div className="text-center py-8 text-gray-500">No websites found</div>
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

export default Websites;
