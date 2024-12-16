import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useCollectionStore from '../../stores/collectionStore';
import CollectionModal from '../modals/CollectionModal';

function TabOverview({ formData, setFormData }) {
  const { collections, createCollection, fetchCollections } = useCollectionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fetch collections when component mounts
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreateCollection = async (collectionData) => {
    try {
      // Create the collection with the modal data
      const newCollection = await createCollection({
        name: collectionData.name,
        description: collectionData.description,
        category: collectionData.category
      });
      
      // Refresh collections list first
      await fetchCollections();
      
      // Update the form with the new collection ID
      setFormData({ ...formData, collection: newCollection.id });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection. Please try again.');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Collection *
            </label>
            <div className="mt-1 flex gap-2 items-center">
              <select
                className="block w-[75%] rounded-md border border-gray-300 px-3 py-2"
                value={formData.collection || ''}
                onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                required
              >
                <option value="">Select a collection</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                + New Collection
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.title || ''}
              onChange={(e) => {
                const title = e.target.value;
                setFormData({
                  ...formData,
                  title,
                  contentTemplate: {
                    ...formData.contentTemplate,
                    title,
                    nudgeCardName: title
                  }
                });
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Business Value *
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.businessValue || ''}
              onChange={(e) => setFormData({ ...formData, businessValue: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.status || 'Draft'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Draft">Draft</option>
              <option value="Under Review">Under Review</option>
              <option value="Validated">Validated</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Render modal outside of the form */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCollection}
        initialData={{}}
      />
    </>
  );
}

TabOverview.propTypes = {
  formData: PropTypes.shape({
    title: PropTypes.string,
    collection: PropTypes.string,
    businessValue: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    contentTemplate: PropTypes.shape({
      title: PropTypes.string,
      nudgeCardName: PropTypes.string
    })
  }),
  setFormData: PropTypes.func.isRequired
};

export default TabOverview;