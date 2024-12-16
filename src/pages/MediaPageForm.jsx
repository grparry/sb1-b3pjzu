import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { fetchMediaItem, createMedia, updateMedia } from '../services/api';
import { logger } from '../services/utils/logging'; // Assuming logger is imported from a separate file

function MediaPageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'landing',
    content: '',
    status: 'draft',
    url: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        try {
          setIsLoading(true);
          setError(null);
          const data = await fetchMediaItem(id);
          setFormData(data);
        } catch (err) {
          logger.error('Error loading media', err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (id) {
        await updateMedia(id, formData);
      } else {
        await createMedia(formData);
      }

      navigate('/media');
    } catch (err) {
      logger.error('Error saving media', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

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

        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

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
              className="w-full border-gray-300 rounded-md shadow-sm"
              rows="10"
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

          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              onClick={() => navigate('/media')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : id ? 'Update Page' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default MediaPageForm;