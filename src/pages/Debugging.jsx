import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { Database, AlertTriangle, Network, Trash2, RefreshCw, Download, Upload, AlertOctagon } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import TreeViewV3 from '../components/TreeViewV3';
import RecordComparisonView from '../components/RecordComparisonView';
import TreeViewCompareModal from '../components/TreeViewCompareModal';
import { getAllFromStore, clearErrors, clearNetwork, updateMockResponseStatus, exportDatabaseToJSON, importDatabaseFromJSON, clearStore, updateByPath, addRecord, deleteRecord } from '../services/storage';
import { initializeStores } from '../mocks/initializeStores';
import useAppStore from '../stores/appStore';
import useConfigStore from '../services/config';

function Debugging() {
  const { isInitialized, storeData, loadStoreData } = useAppStore();
  const { useMockData, setUseMockData } = useConfigStore();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mockResponses, setMockResponses] = useState([]);
  const [selectedMockId, setSelectedMockId] = useState(null);
  const [selectedStoreKey, setSelectedStoreKey] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  const getStoreNameFromKey = (key) => {
    const keyParts = key.split(':');
    if (keyParts.length < 3) {
      console.warn('Mock response key has invalid format:', key);
      return null;
    }
    // Map singular store names to plural
    const storeNameMappings = {
      'nudge': 'nudges',
      'collection': 'collections',
      'media': 'media',  // already plural/same
      'user': 'users'  // added 'user' to 'users'
    };
    const storeName = keyParts[2];
    return storeNameMappings[storeName] || storeName;
  };

  // Split mock responses into reviewed and unreviewed
  const groupedMocks = useMemo(() => {
    console.log('Mock responses:', mockResponses);
    const grouped = {};
    mockResponses.forEach(mock => {
      if (!mock.metadata?.reviewed) {
        const storeName = getStoreNameFromKey(mock.key);
        if (!storeName) return;
        
        if (!grouped[storeName]) {
          grouped[storeName] = [];
        }
        grouped[storeName].push(mock);
      }
    });
    console.log('Grouped mocks:', grouped);
    return grouped;
  }, [mockResponses]);

  // Sort network and error logs by timestamp
  const networkLogs = useMemo(() => 
    [...(storeData.network || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [storeData.network]
  );

  const errorLogs = useMemo(() => 
    [...(storeData.errors || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [storeData.errors]
  );

  // Load mock responses
  const loadMockResponses = useCallback(async () => {
    try {
      const responses = await getAllFromStore('mockResponses');
      console.log('Loaded mock responses:', responses);
      if (responses) {
        setMockResponses(responses);
      }
    } catch (error) {
      console.error('Error loading mock responses:', error);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setLoading(true);
      loadMockResponses()
        .catch(err => {
          console.error('Error loading data:', err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [refreshKey, isInitialized]);

  const handleApproveResponse = async (key, approved) => {
    try {
      await updateMockResponseStatus(key, approved);
      loadStoreData();
    } catch (err) {
      console.error('Failed to approve response:', err);
      setError(err.message);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClearErrors = async () => {
    try {
      await clearErrors();
      loadStoreData();
    } catch (err) {
      console.error('Failed to clear errors:', err);
      setError(err.message);
    }
  };

  const handleClearNetwork = async () => {
    try {
      await clearNetwork();
      loadStoreData();
    } catch (err) {
      console.error('Failed to clear network logs:', err);
      setError(err.message);
    }
  };

  const handleClearStore = async (storeName) => {
    try {
      await clearStore(storeName);
      loadStoreData();
    } catch (err) {
      console.error(`Failed to clear ${storeName}:`, err);
      setError(err.message);
    }
  };

  const handleExportDatabase = async () => {
    try {
      const data = await exportDatabaseToJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'database-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export database:', err);
      setError(err.message);
    }
  };

  const handleImportDatabase = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          console.log('Starting database import with data:', jsonData);
          await importDatabaseFromJSON(jsonData);
          console.log('Database import completed');
          
          // Force reload the stores
          await loadStoreData(true);
          console.log('Stores reloaded after import');
        } catch (error) {
          console.error('Failed during import process:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Failed to read import file:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleUpdateData = async (storeName, path, value) => {
    try {
      setLoading(true); // Set loading state before update
      console.log('Updating data:', { storeName, path, value });

      // If path is empty or only has one element (store name), we're updating the root
      if (!path || path.length <= 1) {
        console.log('Updating root value:', value);
        if (value && value.id) {
          await updateByPath(storeName, [value.id], value);
        }
        return;
      }

      // Get all records from the store
      const records = await getAllFromStore(storeName);
      if (!records) {
        throw new Error('Failed to get records from store');
      }

      // Find the record by its ID (which should be the first part of the path after the root object name)
      const recordId = path[1]; // path[0] is the root object name (e.g., 'nudge')
      const record = Array.isArray(records) 
        ? records.find(r => r.id === recordId)
        : records[recordId];
      
      if (!record) {
        throw new Error(`No record found with ID ${recordId}`);
      }

      // Remove the root object name and record ID from the path
      const actualPath = path.slice(1); // Keep the record ID in the path
      console.log('Using path for update:', actualPath);

      // Perform the update
      await updateByPath(storeName, actualPath, value);
      
      // Force an immediate reload of the data and wait for it to complete
      console.log('Update completed, reloading data...');
      await loadStoreData(true);
      
      console.log('Update completed and data reloaded');
    } catch (err) {
      console.error(`Failed to update ${storeName}:`, err);
      setError(err.message);
    } finally {
      setLoading(false); // Always clear loading state
    }
  };

  const handleDeleteData = async (storeName, path) => {
    console.log('Debugging: handleDeleteData called with:', { storeName, path });
    try {
      if (!path || path.length === 0) {
        throw new Error('Cannot delete root node');
      }

      // Get all records from the store
      const records = await getAllFromStore(storeName);
      if (!records) {
        throw new Error('Failed to get records from store');
      }

      // The first element after the root object name is the record ID
      const recordId = path[1]; // path[0] is the root object name (e.g., 'nudge')
      const record = Array.isArray(records)
        ? records.find(r => r.id === recordId)
        : records[recordId];
      
      if (!record) {
        throw new Error(`No record found with ID ${recordId}`);
      }

      console.log('Debugging: Attempting to delete record:', { recordId, path });

      if (path.length === 2) {
        // Deleting a top-level record (path is ['nudge', 'recordId'])
        console.log('Debugging: Deleting top-level record:', recordId);
        await deleteRecord(storeName, recordId);
      } else {
        // Deleting a nested property
        // Remove the root object name but keep the record ID
        const actualPath = path.slice(1);
        console.log('Debugging: Deleting nested property:', actualPath);
        await updateByPath(storeName, actualPath, undefined);
      }

      // Force reload the data immediately after changes
      await loadStoreData(true);
      console.log('Debugging: Delete operation completed, data reloaded');
    } catch (err) {
      console.error(`Failed to delete from ${storeName}:`, err);
      setError(err.message);
    }
  };

  const handleAddData = async (storeName, path, key, value) => {
    try {
      console.log('Adding data:', { storeName, path, key, value });
      
      if (!path || path.length === 0) {
        // Root level addition - add new record
        if (typeof value === 'object' && value.id) {
          // Handle cloned records - ensure we have a valid ID
          const clonedRecord = { ...value };
          // If the key is not a string or number, generate a timestamp-based ID
          clonedRecord.id = (typeof key === 'string' || typeof key === 'number') ? key : Date.now().toString();
          console.log('Debugging: Adding cloned record:', clonedRecord);
          await addRecord(storeName, clonedRecord);
        } else {
          // Handle new records
          const newRecord = { 
            id: (typeof key === 'string' || typeof key === 'number') ? key : Date.now().toString()
          };
          if (typeof value === 'object') {
            Object.assign(newRecord, value);
          } else {
            newRecord.value = value;
          }
          console.log('Debugging: Adding new record:', newRecord);
          await addRecord(storeName, newRecord);
        }
      } else {
        // Normal property addition
        await updateByPath(storeName, [...path, key], value);
      }

      // Force reload the data immediately after changes
      await loadStoreData(true);
    } catch (err) {
      console.error(`Failed to add to ${storeName}:`, err);
      setError(err.message);
    }
  };

  const handleMockSelection = (mockId) => {
    const storeName = getStoreNameFromKey(mockId);
    if (!storeName) return;
    
    setSelectedMockId(mockId);
    setSelectedStoreKey(storeName);
    setSelectedRecord(null);
    setIsCompareModalOpen(false);
  };

  const handleToggle = (path) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
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

  function DiffView({ title, existing, captured }) {
    if (!existing || !captured) return null;
    
    return (
      <div className="mt-2">
        <h4 className="font-semibold text-sm text-gray-700">{title}</h4>
        <div className="grid grid-cols-2 gap-4 mt-1">
          <div>
            <div className="text-xs text-red-600 mb-1">Existing Version</div>
            <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(existing, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-xs text-green-600 mb-1">New Version</div>
            <pre className="bg-green-50 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(captured, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <div className="mb-4">
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
            <Tab
              className={({ selected }) =>
                `px-6 py-3 text-sm font-medium outline-none flex items-center gap-2 ${
                  selected
                    ? 'text-sky-500 border-b-2 border-sky-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <RefreshCw size={16} />
              MOCKS
            </Tab>
          </Tab.List>

          <Tab.Panels>
            <Tab.Panel>
              <div className="mb-4 flex gap-4">
                <button
                  onClick={handleExportDatabase}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                >
                  <Download size={16} />
                  Export Database
                </button>
                <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer flex items-center gap-2">
                  <Upload size={16} />
                  Import Database
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDatabase}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={async () => {
                    try {
                      await initializeStores(true);
                      loadStoreData();
                    } catch (err) {
                      console.error('Failed to initialize stores:', err);
                      setError(err.message);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
                >
                  <AlertOctagon size={16} />
                  Force Initialize with Mock Data
                </button>
              </div>
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Nudges</h3>
                    <button
                      onClick={() => handleClearStore('nudges')}
                      className="px-2 py-1 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Clear
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {error && (
                      <div className="text-red-500 p-4">
                        Error: {error}
                      </div>
                    )}
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <TreeViewV3 
                        data={Array.isArray(storeData.nudges) ? storeData.nudges : Object.values(storeData.nudges)} 
                        onEdit={(path, value) => handleUpdateData('nudges', path, value)}
                        onDelete={(path) => handleDeleteData('nudges', path)}
                        onAdd={(path, key, value) => handleAddData('nudges', path, key, value)}
                        storeName="nudges"
                        onToggle={handleToggle}
                        expandedPaths={expandedPaths}
                        disabled={loading}
                        className="p-4"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Collections</h3>
                    <button
                      onClick={() => handleClearStore('collections')}
                      className="px-2 py-1 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Clear
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {error && (
                      <div className="text-red-500 p-4">
                        Error: {error}
                      </div>
                    )}
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <TreeViewV3 
                        data={Array.isArray(storeData.collections) ? storeData.collections : Object.values(storeData.collections)} 
                        onEdit={(path, value) => handleUpdateData('collections', path, value)}
                        onDelete={(path) => handleDeleteData('collections', path)}
                        onAdd={(path, key, value) => handleAddData('collections', path, key, value)}
                        storeName="collections"
                        onToggle={handleToggle}
                        expandedPaths={expandedPaths}
                        disabled={loading}
                        className="p-4"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Media</h3>
                    <button
                      onClick={() => handleClearStore('media')}
                      className="px-2 py-1 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Clear
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {error && (
                      <div className="text-red-500 p-4">
                        Error: {error}
                      </div>
                    )}
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <TreeViewV3 
                        data={Array.isArray(storeData.media) ? storeData.media : Object.values(storeData.media)} 
                        onEdit={(path, value) => handleUpdateData('media', path, value)}
                        onDelete={(path) => handleDeleteData('media', path)}
                        onAdd={(path, key, value) => handleAddData('media', path, key, value)}
                        storeName="media"
                        onToggle={handleToggle}
                        expandedPaths={expandedPaths}
                        disabled={loading}
                        className="p-4"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Users</h3>
                    <button
                      onClick={() => handleClearStore('users')}
                      className="px-2 py-1 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Clear
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {error && (
                      <div className="text-red-500 p-4">
                        Error: {error}
                      </div>
                    )}
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <TreeViewV3 
                        data={storeData.users ? (Array.isArray(storeData.users) ? storeData.users : Object.values(storeData.users)) : []} 
                        onEdit={(path, value) => handleUpdateData('users', path, value)}
                        onDelete={(path) => handleDeleteData('users', path)}
                        onAdd={(path, key, value) => handleAddData('users', path, key, value)}
                        storeName="users"
                        onToggle={handleToggle}
                        expandedPaths={expandedPaths}
                        disabled={loading}
                        className="p-4"
                      />
                    )}
                  </div>
                </div>
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

                {networkLogs.length === 0 ? (
                  <div className="bg-gray-50 border rounded-lg p-8 text-center text-gray-500">
                    No network activity logged
                  </div>
                ) : (
                  <div className="space-y-4">
                    {networkLogs.map(renderNetworkEntry)}
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

                {errorLogs.length === 0 ? (
                  <div className="bg-gray-50 border rounded-lg p-8 text-center text-gray-500">
                    No errors logged
                  </div>
                ) : (
                  <div className="space-y-4">
                    {errorLogs.map((error) => (
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
                    ))}
                  </div>
                )}
              </div>
            </Tab.Panel>

            <Tab.Panel>
              <div className="flex h-full">
                {/* Mock Responses List */}
                <div className="w-1/3 border-r pr-4 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Unreviewed Responses</h3>
                    <button
                      onClick={handleRefresh}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-sky-500 border border-sky-500 rounded-md hover:bg-sky-50"
                    >
                      <RefreshCw size={14} />
                      Refresh
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.keys(groupedMocks).map(storeName => (
                      <div key={storeName}>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">{storeName}</h4>
                        {groupedMocks[storeName].map(mock => (
                          <div
                            key={mock.key}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedMockId === mock.key
                                ? 'border-sky-500 bg-sky-50'
                                : 'border-gray-200 hover:border-sky-300'
                            }`}
                            onClick={() => handleMockSelection(mock.key)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {storeName}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {mock.request.method} {mock.request.url}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {(() => {
                                    const mockData = mock.response?.body?.data;
                                    if (!mockData) return '0 records';
                                    
                                    // Check if the API endpoint can return multiple records
                                    const isMultipleRecords = mock.request.url.endsWith('/nudge');
                                    
                                    if (isMultipleRecords) {
                                      const recordCount = Array.isArray(mockData) ? mockData.length : 1;
                                      return `${recordCount} record${recordCount !== 1 ? 's' : ''}`;
                                    } else {
                                      return '1 record';
                                    }
                                  })()}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(mock.metadata.captured || new Date().toISOString()).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    {Object.keys(groupedMocks).length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No unreviewed mock responses available
                      </div>
                    )}
                  </div>
                </div>

                {/* Comparison View */}
                <div className="flex-1 pl-4">
                  {selectedMockId && !isCompareModalOpen ? (
                    <div>
                      {(() => {
                        const selectedMock = mockResponses.find(m => m.key === selectedMockId);
                        if (!selectedMock) return null;

                        const mockData = selectedMock.response.body.data;
                        if (!mockData) {
                          console.warn('No valid mock data found:', mockData);
                          return null;
                        }

                        // Ensure mockData is an array
                        const mockRecords = Array.isArray(mockData) ? mockData : [mockData];

                        return (
                          <RecordComparisonView
                            mockResponse={mockRecords}
                            databaseRecords={storeData.nudges}
                            onCompare={({ mock, database }) => {
                              // Create a mock response object that matches the expected format
                              const mockResponseObj = {
                                key: selectedMockId,
                                response: {
                                  body: {
                                    data: [mock]
                                  }
                                },
                                metadata: {
                                  storeName: selectedStoreKey
                                }
                              };

                              setSelectedRecord({
                                mockRecord: mock,
                                databaseRecord: database
                              });
                              setIsCompareModalOpen(true);
                            }}
                            onAddRecord={async (mockRecord) => {
                              try {
                                // Create a deep copy of the mock record
                                const newRecord = JSON.parse(JSON.stringify(mockRecord));
                                
                                // Map the store name to its plural form
                                const storeName = getStoreNameFromKey(selectedMockId);
                                if (!storeName) {
                                  throw new Error(`Invalid store name from mock key: ${selectedMockId}`);
                                }
                                
                                // Add the record to the database
                                await addRecord(storeName, newRecord);
                                
                                // Refresh the database records
                                await loadStoreData();
                                
                                // Mark the mock response as reviewed if this was the only record
                                const selectedMock = mockResponses.find(m => m.key === selectedMockId);
                                if (selectedMock && (!Array.isArray(selectedMock.response.body.data) || 
                                    selectedMock.response.body.data.length === 1)) {
                                  await updateMockResponseStatus(selectedMockId, true);
                                  await loadMockResponses(); // Refresh mock responses
                                }

                                // Show success message or handle UI updates
                                console.log('Successfully added record:', newRecord);
                              } catch (error) {
                                console.error('Error adding record:', error);
                                // Handle error (you might want to show an error message to the user)
                              }
                            }}
                            storeName={selectedStoreKey}
                          />
                        );
                      })()}
                    </div>
                  ) : !selectedMockId ? (
                    <div className="text-center text-gray-500 py-8">
                      Select a mock response to compare
                    </div>
                  ) : null}
                </div>

                {isCompareModalOpen && (
                  <TreeViewCompareModal
                    isOpen={isCompareModalOpen}
                    onClose={() => {
                      setIsCompareModalOpen(false);
                      setSelectedRecord(null);
                    }}
                    mockId={selectedMockId}
                    storeKey={selectedStoreKey}
                    mockResponses={selectedRecord ? [selectedRecord.mockRecord] : []}
                    databaseRecords={selectedRecord ? [selectedRecord.databaseRecord] : []}
                    onApproveNew={(mockId) => handleApproveResponse(mockId, true)}
                    onCreateNew={(newId) => handleApproveResponse(newId, true)}
                    onUpdateExisting={(path, value) => {
                      console.log('Updating existing record:', { path, value });
                      
                      // Find the database record to update
                      const recordId = path[1]; // path is [storeName, recordId, ...rest]
                      
                      let updatedRecord;
                      
                      if (Array.isArray(storeData.nudges)) {
                        updatedRecord = storeData.nudges.find(r => r.id === recordId);
                      } else if (storeData.nudges && typeof storeData.nudges === 'object') {
                        updatedRecord = storeData.nudges[recordId];
                      }

                      if (!updatedRecord) {
                        console.warn('No database record found to update:', recordId);
                        return;
                      }

                      // Create a deep copy of the record
                      updatedRecord = JSON.parse(JSON.stringify(updatedRecord));

                      // Update the nested value
                      let current = updatedRecord;
                      const pathParts = path.slice(2); // Remove storeName and recordId
                    
                      for (let i = 0; i <pathParts.length - 1; i++) {
                        if (!(pathParts[i] in current)) {
                          if (value === undefined) return; // Don't create path for deletion
                          current[pathParts[i]] = {};
                        }
                        current = current[pathParts[i]];
                      }

                      const lastPart = pathParts[pathParts.length - 1];
                      if (value === undefined) {
                        delete current[lastPart];
                      } else {
                        current[lastPart] = value;
                      }

                      // Update the store
                      if (Array.isArray(storeData.nudges)) {
                        const index = storeData.nudges.findIndex(r => r.id === recordId);
                        if (index !== -1) {
                          const newRecords = [...storeData.nudges];
                          newRecords[index] = updatedRecord;
                          // setDatabaseRecords(newRecords);
                        }
                      } else {
                        // setDatabaseRecords(prev => ({
                        //   ...prev,
                        //   [recordId]: updatedRecord
                        // }));
                      }
                    }}
                  />
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </>
  );
}

export default Debugging;