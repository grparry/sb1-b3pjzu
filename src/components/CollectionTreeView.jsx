import React, { useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Circle, Pencil, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import useCollectionStore from '../stores/collectionStore';
import useNudgeStore from '../stores/nudgeStore';
import useAppStore from '../stores/appStore';
import CollectionModal from './modals/CollectionModal';

function CollectionTreeView() {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = React.useState([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCollection, setEditingCollection] = React.useState(null);
  const { 
    collections, 
    isLoading: collectionsLoading, 
    error: collectionsError, 
    fetchCollections, 
    createCollection,
    updateCollection 
  } = useCollectionStore();
  const { nudges, isLoading: nudgesLoading, error: nudgesError, fetchNudges } = useNudgeStore();
  const { isInitialized } = useAppStore();

  // Initialize expanded items when collections load
  useEffect(() => {
    if (collections.length > 0) {
      setExpandedItems(collections.map(c => c.id));
    }
  }, [collections]);

  const fetchData = useCallback(() => {
    if (!isInitialized) return;
    console.log('Fetching data, isInitialized:', isInitialized);
    fetchCollections();
    fetchNudges();
  }, [isInitialized, fetchCollections, fetchNudges]); // Added missing dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log('Collections and Nudges updated');
  }, [collections, nudges]);

  const getCollectionNudges = useCallback((collection) => {
    return collection.items
      ? nudges.filter(nudge => 
          collection.items.includes(nudge.id) || 
          nudge.collection === collection.id
        )
      : nudges.filter(nudge => nudge.collection === collection.id);
  }, [nudges]);

  const isLoading = collectionsLoading || nudgesLoading;
  const error = collectionsError || nudgesError;

  const handleCreateCollection = async (formData) => {
    try {
      const newCollection = await createCollection({
        name: formData.name,
        description: formData.description,
        category: formData.category
      });
      // Add the new collection to expanded items
      setExpandedItems(prev => [...prev, newCollection.id]);
      setIsModalOpen(false);
      await fetchData(); // Refresh both collections and nudges
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection. Please try again.');
    }
  };

  const handleEditCollection = async (formData) => {
    try {
      await updateCollection({
        ...editingCollection,
        ...formData
      });
      setIsModalOpen(false);
      setEditingCollection(null);
    } catch (error) {
      console.error('Failed to update collection:', error);
      alert('Failed to update collection. Please try again.');
    }
  };

  const openEditModal = (collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCollection(null);
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'text-green-500',
      'Disabled': 'text-red-500',
      'Validated': 'text-blue-500',
      'Under Review': 'text-yellow-500',
      'Draft': 'text-gray-500'
    };
    return colors[status] || 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-500">
        <AlertTriangle size={24} className="mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  const collectionsWithNudges = collections.map(collection => {
    const collectionNudges = getCollectionNudges(collection)
      .map(nudge => ({
        id: nudge.id,
        title: nudge.title || 'Untitled Nudge',
        status: nudge.status || 'DRAFT',
        version: nudge.version || '1 - Draft'
      }));

    return {
      ...collection,
      displayItems: collectionNudges
    };
  });

  if (!collectionsWithNudges.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <p>No collections found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Collections</h2>
      </div>
      
      <CollectionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingCollection ? handleEditCollection : handleCreateCollection}
        initialData={editingCollection}
      />

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-4 font-medium">Collections</th>
            <th className="text-left py-4 font-medium">States</th>
            <th className="text-left py-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {collectionsWithNudges.map((collection) => (
            <React.Fragment key={collection.id}>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(collection.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {(collection.items.length > 0 || collection.displayItems.length > 0) ? (
                        expandedItems.includes(collection.id) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )
                      ) : (
                        <Circle size={16} className="text-gray-400" />
                      )}
                    </button>
                    <span>{collection.name}</span>
                  </div>
                </td>
                <td></td>
                <td>
                  <button
                    onClick={() => openEditModal(collection)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                  >
                    <Pencil size={18} />
                  </button>
                </td>
              </tr>
              {expandedItems.includes(collection.id) && collection.displayItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-4">
                    <div className="flex items-center gap-2 pl-8">
                      <Circle size={16} className="text-gray-400" />
                      <Link
                        to={`/nudges/edit/${item.id}`}
                        className="hover:text-sky-500"
                      >
                        {item.title}
                      </Link>
                    </div>
                  </td>
                  <td>
                    <span className={getStatusColor(item.status)}>
                      {item.version?.includes('Draft') ? 'Draft' : 
                       item.version?.includes('Review') ? 'Under Review' : 
                       item.version?.includes('Disabled') ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => navigate(`/nudges/edit/${item.id}`)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                    >
                      <Pencil size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

CollectionTreeView.propTypes = {
  isLoading: PropTypes.bool
};

export default CollectionTreeView;