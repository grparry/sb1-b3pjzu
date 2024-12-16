import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layout, Eye, Pencil, Trash2, Globe } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { fetchMedia } from '../services/api';

function Media() {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchMedia();
        setPages(data);
      } catch (err) {
        console.error('Error loading media:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, []);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Media' }
          ]}
        />

        <div className="mt-4">
          <Link
            to="/media/new"
            className="inline-flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
          >
            <Plus size={20} />
            Create Page
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Last Modified</th>
                <th className="text-left py-2">URL</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b">
                  <td className="py-2">{page.name}</td>
                  <td className="py-2">{page.type}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="py-2">{new Date(page.updatedAt).toLocaleDateString()}</td>
                  <td className="py-2">{page.url}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <Link
                        to={`/media/edit/${page.id}`}
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="View on site"
                      >
                        <Globe size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Media;