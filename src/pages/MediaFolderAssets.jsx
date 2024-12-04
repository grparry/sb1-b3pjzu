import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Image, FileCode, Download, Trash2, Plus, Upload, AlertCircle, Search, Filter, Check, ChevronDown } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import UploadModal from '../components/UploadModal';
import { fetchFolder, fetchMedia, uploadMedia, deleteMedia } from '../services/api';

function MediaFolderAssets() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folder, setFolder] = useState(null);
  const [assets, setAssets] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'size'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [filterType, setFilterType] = useState('all'); // 'all', 'images', 'templates'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 20;

  // Load initial data
  useEffect(() => {
    loadFolderAndAssets();
    setSelectedAssets(new Set());
    setPage(1);
  }, [id]);

  // Load more assets when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        === document.documentElement.offsetHeight
      ) {
        if (hasMore && !isLoading) {
          setPage(prev => prev + 1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading]);

  const loadFolderAndAssets = async (loadMore = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [folderData, assetsData] = await Promise.all([
        loadMore ? Promise.resolve(folder) : fetchFolder(id),
        fetchMedia(id, { page, limit: ITEMS_PER_PAGE })
      ]);

      if (!loadMore) {
        setFolder(folderData);
        setAssets(assetsData || []);
      } else {
        setAssets(prev => [...prev, ...(assetsData || [])]);
      }
      
      setHasMore((assetsData || []).length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Error loading folder and assets:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files) => {
    try {
      setError(null);
      const uploadPromises = files.map(file => uploadMedia(file, id));
      const newAssets = await Promise.all(uploadPromises);
      setAssets(prev => [...newAssets, ...prev]);
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (assetIds) => {
    const idsArray = Array.isArray(assetIds) ? assetIds : [assetIds];
    const message = idsArray.length === 1
      ? 'Are you sure you want to delete this asset?'
      : `Are you sure you want to delete these ${idsArray.length} assets?`;

    if (!window.confirm(message)) return;

    try {
      await Promise.all(idsArray.map(id => deleteMedia(id)));
      setAssets(prev => prev.filter(a => !idsArray.includes(a.id)));
      setSelectedAssets(new Set());
    } catch (err) {
      console.error('Error deleting assets:', err);
      setError(err.message);
    }
  };

  const toggleAssetSelection = useCallback((assetId) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedAssets(prev => 
      prev.size === filteredAssets.length
        ? new Set()
        : new Set(filteredAssets.map(a => a.id))
    );
  }, [filteredAssets]);

  // Memoized filtered and sorted assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || asset.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'date':
          default:
            comparison = new Date(b.lastModified) - new Date(a.lastModified);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [assets, searchQuery, filterType, sortBy, sortOrder]);

  if (!folder && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600">
        <AlertCircle size={48} className="mb-4" />
        <p className="text-lg">Folder not found</p>
        <Link to="/media/folders" className="mt-4 text-sky-500 hover:underline">
          Return to Media Folders
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Media Folders', path: '/media/folders' },
            { label: folder.name }
          ]}
        />

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
              >
                <Plus size={20} />
                Add {folder.type === 'images' ? 'Image' : 'Template'}
              </button>
              
              {selectedAssets.size > 0 && (
                <button
                  onClick={() => handleDelete(Array.from(selectedAssets))}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Trash2 size={20} />
                  Delete Selected ({selectedAssets.size})
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="relative flex-grow">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Types</option>
                <option value="images">Images</option>
                <option value="templates">Templates</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-desc">Size (Largest)</option>
                <option value="size-asc">Size (Smallest)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">
            Assets {filteredAssets.length > 0 && `(${filteredAssets.length})`}
          </h2>
          
          {filteredAssets.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {selectedAssets.size === filteredAssets.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={`group border rounded-lg overflow-hidden hover:shadow-md transition-all ${
                selectedAssets.has(asset.id) ? 'ring-2 ring-sky-500' : ''
              }`}
              onClick={() => toggleAssetSelection(asset.id)}
            >
              <div className="relative">
                {asset.type === 'images' ? (
                  <div className="aspect-video bg-gray-100">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <FileCode size={40} className="text-gray-400" />
                  </div>
                )}
                
                <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedAssets.has(asset.id)
                    ? 'bg-sky-500 border-sky-500'
                    : 'bg-white border-gray-300 group-hover:border-sky-500'
                }`}>
                  {selectedAssets.has(asset.id) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="mb-2">
                  <h3 className="font-medium truncate" title={asset.name}>
                    {asset.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {(asset.size / 1024 / 1024).toFixed(2)} MB • {new Date(asset.lastModified).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex justify-between">
                  <a
                    href={asset.url}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset.id);
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center p-6 border-t">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        )}

        {!isLoading && filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <Image size={48} className="mb-4" />
            <p className="text-lg mb-2">No assets found</p>
            <p className="text-sm">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : `Upload some ${folder.type === 'images' ? 'images' : 'templates'} to get started`}
            </p>
          </div>
        )}
      </div>

      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
          acceptedTypes={folder.type === 'images' ? 'image/*' : '.html,.htm'}
          multiple
        />
      )}
    </>
  );
}

export default MediaFolderAssets;