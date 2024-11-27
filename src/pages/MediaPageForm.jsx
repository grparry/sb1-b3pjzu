import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

function MediaPageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'landing',
    content: '',
    status: 'draft',
    url: ''
  });

  useEffect(() => {
    if (id) {
      // Simulate fetching page data
      const mockData = {
        name: 'Product Landing Page',
        type: 'landing',
        content: '<div>Landing page content</div>',
        status: 'published',
        url: '/landing/product'
      };
      setFormData(mockData);
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    navigate('/media');
  };

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Media', path: '/media' },
            { label: id ? 'Edit Page' : 'New Page' }
          ]}
        />
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-semibold">
            {id ? 'Edit Page' : 'Create New Page'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Name *
            </label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Type *
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="landing">Landing Page</option>
              <option value="success">Success Page</option>
              <option value="form">Form Page</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Path *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">/</span>
              <input
                type="text"
                className="flex-1 border-gray-300 rounded-md shadow-sm"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="e.g., landing/product"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              className="w-full border-gray-300 rounded-md shadow-sm font-mono"
              rows={12}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/media')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600"
            >
              {id ? 'Update Page' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default MediaPageForm;