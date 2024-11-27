import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Circle, Eye, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import useCollectionStore from '../stores/collectionStore';
import useNudgeStore from '../stores/nudgeStore';

function CollectionTreeView() {
  const [expandedItems, setExpandedItems] = React.useState(['car-purchase-loan']);
  const { collections, isLoading: collectionsLoading, error: collectionsError, fetchCollections } = useCollectionStore();
  const { nudges, isLoading: nudgesLoading, error: nudgesError, fetchNudges } = useNudgeStore();

  useEffect(() => {
    fetchCollections();
    fetchNudges();
  }, [fetchCollections, fetchNudges]);

  const isLoading = collectionsLoading || nudgesLoading;
  const error = collectionsError || nudgesError;

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

  const collectionsWithNudges = collections.map(collection => ({
    ...collection,
    items: collection.items
      .map(nudgeId => nudges.find(n => n.id === nudgeId))
      .filter(Boolean)
  }));

  if (!collectionsWithNudges.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <p>No collections found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
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
                      {collection.items.length > 0 ? (
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
                  <Eye size={18} className="text-gray-400" />
                </td>
              </tr>
              {expandedItems.includes(collection.id) && collection.items.map((item) => (
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
                    <Eye size={18} className="text-gray-400" />
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