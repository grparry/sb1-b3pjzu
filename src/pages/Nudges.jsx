import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import CollectionTreeView from '../components/CollectionTreeView';
import CollectionModal from '../components/modals/CollectionModal';
import useCollectionStore from '../stores/collectionStore';

function Nudges() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createCollection } = useCollectionStore();

  const handleCreateCollection = async (collectionData) => {
    try {
      await createCollection({
        name: collectionData.name,
        description: collectionData.description,
        category: collectionData.category
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection. Please try again.');
    }
  };

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Nudges' }
          ]}
        />

        <div className="flex gap-4 mt-4">
          <Link
            to="/nudges/new"
            className="flex items-center gap-2 px-6 py-2 rounded-full border border-sky-500 text-sky-500 hover:bg-sky-50"
          >
            <Plus size={20} />
            NEW NUDGE
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 rounded-full border border-sky-500 text-sky-500 hover:bg-sky-50"
          >
            <Plus size={20} />
            NEW COLLECTION
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <CollectionTreeView />
      </div>

      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCollection}
        initialData={{}}
      />
    </>
  );
}

export default Nudges;