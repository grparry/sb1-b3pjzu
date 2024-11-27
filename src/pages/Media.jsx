import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layout, Eye, Pencil, Trash2, Globe } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

function Media() {
  const [pages] = useState([
    {
      id: 1,
      name: 'Product Landing Page',
      type: 'landing',
      status: 'published',
      lastModified: '2024-03-15',
      url: '/landing/product'
    },
    {
      id: 2,
      name: 'Campaign Success Page',
      type: 'success',
      status: 'draft',
      lastModified: '2024-03-14',
      url: '/campaign/success'
    },
    {
      id: 3,
      name: 'Loan Application Form',
      type: 'form',
      status: 'published',
      lastModified: '2024-03-13',
      url: '/forms/loan'
    }
  ]);

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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">Web Pages</h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-4 px-6 font-medium">Name</th>
              <th className="text-left py-4 px-6 font-medium">Type</th>
              <th className="text-left py-4 px-6 font-medium">Status</th>
              <th className="text-left py-4 px-6 font-medium">URL</th>
              <th className="text-left py-4 px-6 font-medium">Last Modified</th>
              <th className="text-left py-4 px-6 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <Layout
                      size={20}
                      className="text-sky-500"
                    />
                    {page.name}
                  </div>
                </td>
                <td className="py-4 px-6 capitalize">{page.type}</td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      page.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {page.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-400" />
                    <span className="text-gray-600">{page.url}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-500">
                  {page.lastModified}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button
                      title="Preview"
                      className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
                    >
                      <Eye size={16} />
                    </button>
                    <Link
                      to={`/media/edit/${page.id}`}
                      title="Edit"
                      className="p-1 hover:bg-gray-100 rounded text-sky-500 hover:text-sky-600"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      title="Delete"
                      className="p-1 hover:bg-gray-100 rounded text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Media;