import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import CollectionTreeView from '../components/CollectionTreeView';
import useNudgeStore from '../stores/nudgeStore';
import useAppStore from '../stores/appStore';

function Nudges() {
  const { isInitialized } = useAppStore();
  const { fetchNudges, isLoading, error } = useNudgeStore();

  useEffect(() => {
    if (isInitialized) {
      fetchNudges();
    }
  }, [isInitialized, fetchNudges]);

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading nudges: {error}
      </div>
    );
  }

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
          <button className="flex items-center gap-2 px-6 py-2 rounded-full border border-sky-500 text-sky-500 hover:bg-sky-50">
            <Plus size={20} />
            NEW COLLECTION
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <CollectionTreeView isLoading={isLoading} />
      </div>
    </>
  );
}

export default Nudges;