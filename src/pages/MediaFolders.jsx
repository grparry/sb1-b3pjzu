import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Image, FileCode, MoreVertical, Upload, AlertCircle } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { fetchFolders, createFolder, deleteFolder } from '../services/api';
import useConfigStore from '../services/config';
import { initializeStores } from '../mocks/initializeStores';
import { resetDatabase } from '../services/storage';

function MediaFolders() {
  const { useMockData } = useConfigStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folders, setFolders] = useState([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize mock data if needed
        if (useMockData) {
          await initializeStores(false);
        }
        
        // Load the folders
        const data = await fetchFolders();
        setFolders(data || []);
      } catch (err) {
        console.error('Error loading folders:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [useMockData]);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchFolders();
      setFolders(data || []);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const newFolder = await createFolder({ name: newFolderName.trim() });
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setShowNewFolderModal(false);
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err.message);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) return;

    try {
      await deleteFolder(folderId);
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError(err.message);
    }
  };

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
          <button 
            onClick={() => setShowNewFolderModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
          >
            <Plus size={20} />
            New Folder
          </button>

          <Link 
            to="/media/upload"
            className="inline-flex items-center gap-2 px-6 py-2 border border-sky-500 text-sky-500 rounded-md hover:bg-sky-50"
          >
            <Upload size={20} />
            Upload Assets
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

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
                <div className="relative">
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-full"
                    onClick={() => handleDeleteFolder(folder.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Last modified</span>
                  <span>{new Date(folder.lastModified).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  to={`/media/folders/${folder.id}`}
                  className="block w-full text-center py-2 border border-sky-500 text-sky-500 rounded hover:bg-sky-50"
                >
                  View Contents
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium mb-4">Create New Folder</h2>
            <input
              type="text"
              placeholder="Folder name"
              className="w-full px-4 py-2 border rounded mb-4"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
                onClick={handleCreateFolder}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MediaFolders;