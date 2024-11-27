import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Image, FileCode, MoreVertical, Upload } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

function MediaFolders() {
  const [isLoading, setIsLoading] = useState(true);
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    // Simulate API call
    const loadFolders = async () => {
      try {
        // Mock data
        const mockFolders = [
          {
            id: 1,
            name: 'Product Images',
            type: 'images',
            itemCount: 24,
            lastModified: '2024-03-15'
          },
          {
            id: 2,
            name: 'Campaign Templates',
            type: 'html',
            itemCount: 8,
            lastModified: '2024-03-14'
          },
          {
            id: 3,
            name: 'Landing Pages',
            type: 'html',
            itemCount: 12,
            lastModified: '2024-03-13'
          }
        ];
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        setFolders(mockFolders);
      } finally {
        setIsLoading(false);
      }
    };

    loadFolders();
  }, []);

  const getFolderIcon = (type) => {
    switch (type) {
      case 'images':
        return <Image size={20} />;
      case 'html':
        return <FileCode size={20} />;
      default:
        return <Folder size={20} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
            { label: 'Media Folders' }
          ]}
        />

        <div className="mt-4 flex justify-between">
          <button className="inline-flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">
            <Plus size={20} />
            New Folder
          </button>

          <button className="inline-flex items-center gap-2 px-6 py-2 border border-sky-500 text-sky-500 rounded-md hover:bg-sky-50">
            <Upload size={20} />
            Upload Assets
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-50 text-sky-500 rounded-lg">
                    {getFolderIcon(folder.type)}
                  </div>
                  <div>
                    <h3 className="font-medium">{folder.name}</h3>
                    <p className="text-sm text-gray-500">
                      {folder.itemCount} items
                    </p>
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                <span>Last modified: {folder.lastModified}</span>
                <Link
                  to={`/media-folders/${folder.id}`}
                  className="text-sky-500 hover:text-sky-600"
                >
                  View Assets →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default MediaFolders;