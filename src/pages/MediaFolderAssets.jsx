import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Image, FileCode, Download, Trash2, Plus, Upload } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import UploadModal from '../components/UploadModal';

function MediaFolderAssets() {
  const { id } = useParams();
  const [folder, setFolder] = useState(null);
  const [assets, setAssets] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    // Simulate fetching folder data
    const mockFolder = {
      id: parseInt(id),
      name: id === '1' ? 'Product Images' : id === '2' ? 'Campaign Templates' : 'Landing Pages',
      type: id === '1' ? 'images' : 'html'
    };

    const mockAssets = [
      {
        id: 1,
        name: mockFolder.type === 'images' ? 'product-hero.jpg' : 'landing-template.html',
        type: mockFolder.type,
        size: '2.4 MB',
        lastModified: '2024-03-15',
        url: mockFolder.type === 'images' 
          ? 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'
          : null
      },
      {
        id: 2,
        name: mockFolder.type === 'images' ? 'features-banner.jpg' : 'success-page.html',
        type: mockFolder.type,
        size: '1.8 MB',
        lastModified: '2024-03-14',
        url: mockFolder.type === 'images'
          ? 'https://images.unsplash.com/photo-1460925895917-afdab827c52f'
          : null
      }
    ];

    setFolder(mockFolder);
    setAssets(mockAssets);
  }, [id]);

  if (!folder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Media Folders', path: '/media-folders' },
            { label: folder.name }
          ]}
        />

        <div className="mt-4 flex justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
            >
              <Plus size={20} />
              Add {folder.type === 'images' ? 'Image' : 'Template'}
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2 border border-sky-500 text-sky-500 rounded-md hover:bg-sky-50"
            >
              <Upload size={20} />
              Upload Files
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">Assets</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {asset.type === 'images' ? (
                <div className="aspect-video bg-gray-100">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <FileCode size={48} className="text-gray-400" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium truncate" title={asset.name}>
                      {asset.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {asset.size} • {asset.lastModified}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      title="Download"
                      className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      title="Delete"
                      className="p-1 hover:bg-gray-100 rounded text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        type={folder.type === 'images' ? 'image' : 'file'}
      />
    </>
  );
}

export default MediaFolderAssets;