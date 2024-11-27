import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { Database, AlertTriangle, Network, Trash2, RefreshCw } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { getAllFromStore, clearErrors, clearNetwork } from '../services/storage';

function Debugging() {
  const [stores, setStores] = useState({
    nudges: [],
    collections: [],
    media: [],
    errors: [],
    network: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function loadStores() {
    setLoading(true);
    setError(null);
    try {
      const storePromises = ['nudges', 'collections', 'media', 'errors', 'network'].map(store => 
        getAllFromStore(store).catch(err => {
          console.error(`Error loading ${store}:`, err);
          return [];
        })
      );

      const [nudges, collections, media, errors, network] = await Promise.all(storePromises);

      setStores({
        nudges,
        collections,
        media,
        errors,
        network: network.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      });
    } catch (err) {
      console.error('Error loading stores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStores();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClearErrors = async () => {
    try {
      await clearErrors();
      handleRefresh();
    } catch (err) {
      console.error('Failed to clear errors:', err);
      setError(err.message);
    }
  };

  const handleClearNetwork = async () => {
    try {
      await clearNetwork();
      handleRefresh();
    } catch (err) {
      console.error('Failed to clear network logs:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const renderNetworkEntry = (entry) => {
    if (!entry || !entry.operation) return null;

    const { operation, timestamp, type } = entry;

    return (
      <div key={entry.id} className="bg-white rounded-lg shadow overflow-hidden">
        <div className={`p-4 border-b ${
          type === 'error' ? 'bg-red-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-medium ${
                type === 'error' ? 'text-red-600' : 'text-gray-900'
              }`}>
                {operation.type} - {operation.method} {operation.path || operation.url}
              </h3>
              <div className="text-sm text-gray-500">
                {new Date(timestamp).toLocaleString()}
              </div>
            </div>
            {operation.status && (
              <div className={`text-sm font-medium ${
                type === 'error' ? 'text-red-600' : 'text-green-600'
              }`}>
                {operation.status} {operation.statusText}
              </div>
            )}
          </div>
        </div>
        <div className="divide-y">
          {operation.headers && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Headers</h4>
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(operation.headers, null, 2)}
              </pre>
            </div>
          )}
          {operation.body && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Body</h4>
              <pre className="text-sm overflow-x-auto">
                {typeof operation.body === 'string' 
                  ? operation.body 
                  : JSON.stringify(operation.body, null, 2)}
              </pre>
            </div>
          )}
          {entry.error && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-red-500 mb-2">Error</h4>
              <pre className="text-sm overflow-x-auto text-red-600">
                {JSON.stringify(entry.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Debugging' }
          ]}
        />
      </div>

      <Tab.Group>
        <Tab.List className="flex border-b mb-6">
          <Tab
            className={({ selected }) =>
              `px-6 py-3 text-sm font-medium outline-none flex items-center gap-2 ${
                selected
                  ? 'text-sky-500 border-b-2 border-sky-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Database size={16} />
            DATABASE
          </Tab>
          <Tab
            className={({ selected }) =>
              `px-6 py-3 text-sm font-medium outline-none flex items-center gap-2 ${
                selected
                  ? 'text-sky-500 border-b-2 border-sky-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Network size={16} />
            NETWORK
          </Tab>
          <Tab
            className={({ selected }) =>
              `px-6 py-3 text-sm font-medium outline-none flex items-center gap-2 ${
                selected
                  ? 'text-sky-500 border-b-2 border-sky-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <AlertTriangle size={16} />
            ERRORS
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-500 border border-sky-500 rounded-md hover:bg-sky-50"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                  {error}
                </div>
              ) : (
                Object.entries(stores)
                  .filter(([name]) => !['errors', 'network'].includes(name))
                  .map(([storeName, items]) => (
                    <div key={storeName} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b">
                        <h2 className="text-lg font-medium capitalize">{storeName} Store</h2>
                        <div className="text-sm text-gray-500">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="text-sm">
                          {JSON.stringify(items, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-500 border border-sky-500 rounded-md hover:bg-sky-50"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                <button
                  onClick={handleClearNetwork}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 border border-red-500 rounded-md hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Clear Network Logs
                </button>
              </div>

              {stores.network.length === 0 ? (
                <div className="bg-gray-50 border rounded-lg p-8 text-center text-gray-500">
                  No network activity logged
                </div>
              ) : (
                <div className="space-y-4">
                  {stores.network.map(renderNetworkEntry)}
                </div>
              )}
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-500 border border-sky-500 rounded-md hover:bg-sky-50"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                <button
                  onClick={handleClearErrors}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 border border-red-500 rounded-md hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Clear Errors
                </button>
              </div>

              {stores.errors.length === 0 ? (
                <div className="bg-gray-50 border rounded-lg p-8 text-center text-gray-500">
                  No errors logged
                </div>
              ) : (
                stores.errors.map((error) => (
                  <div key={error.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 bg-red-50 border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-red-600">{error.type}</h3>
                          <div className="text-sm text-gray-500">
                            {new Date(error.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {error.url}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Message</div>
                        <div className="mt-1">{error.message}</div>
                      </div>
                      {error.status && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Status</div>
                          <div className="mt-1">{error.status}</div>
                        </div>
                      )}
                      {error.stack && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Stack Trace</div>
                          <pre className="mt-1 text-sm overflow-x-auto">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      {error.data && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Additional Data</div>
                          <pre className="mt-1 text-sm overflow-x-auto">
                            {JSON.stringify(error.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
}

export default Debugging;