import React, { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { Database, Network, AlertTriangle, Webhook } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import NetworkLogs from '../components/debugging/NetworkLogs';
import ErrorLogs from '../components/debugging/ErrorLogs';
import MockResponses from '../components/debugging/MockResponses';
import DatabaseControls from '../components/debugging/DatabaseControls';
import TreeViewV3 from '../components/TreeViewV3';
import { getAllFromStore, clearStore, updateByPath, addRecord, deleteRecord } from '../services/storage';
import { STORES } from '../services/storage/core';
import useAppStore from '../stores/appStore';
import useConfigStore from '../services/config';
import { logger } from '../services/utils/logging'; // Assuming logger is imported from '../logger'

function Debugging() {
  const { isInitialized, storeData, loadStoreData, updateSingleStore } = useAppStore();
  const { useMockData } = useConfigStore();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mockResponses, setMockResponses] = useState([]);
  const [networkLogs, setNetworkLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  const loadData = useCallback(async () => {
    if (!isInitialized) {
      logger.info('Not initialized yet, waiting');
      return;
    }
    
    setLoading(true);
    try {
      logger.info('Loading debugging data');
      const responses = await getAllFromStore('mockResponses');
      setMockResponses(responses || []);
      await loadStoreData(true);
      logger.info('Data loaded successfully');
    } catch (err) {
      logger.error('Error loading data', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, loadStoreData]);

  useEffect(() => {
    logger.info('Initialization state changed', { isInitialized });
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  // Auto-refresh network logs
  useEffect(() => {
    if (!isInitialized || currentTab !== 1) return;
    
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [isInitialized, currentTab, loadData]);

  // Update network and error logs when storeData changes
  useEffect(() => {
    if (storeData?.network) {
      setNetworkLogs(storeData.network);
    }
    if (storeData?.errors) {
      setErrorLogs(storeData.errors);
    }
  }, [storeData]);

  const handleClearStore = async (storeName) => {
    try {
      await clearStore(storeName);
      await loadStoreData();
    } catch (err) {
      logger.error('Failed to clear store', { storeName, error: err });
      setError(err.message);
    }
  };

  const handleUpdateData = async (storeName, path, value) => {
    try {
      await updateByPath(storeName, path, value);
      // Only reload the specific store that changed
      await updateSingleStore(storeName);
    } catch (err) {
      logger.error('Failed to update store', { storeName, error: err });
      setError(err.message);
    }
  };

  const handleDeleteData = async (storeName, path) => {
    try {
      // Extract the ID from the path array
      const id = Array.isArray(path) ? path[1] : path;
      await deleteRecord(storeName, id);
      await loadStoreData();
    } catch (err) {
      logger.error('Failed to delete from store', { storeName, error: err });
      setError(err.message);
    }
  };

  const handleAddData = async (storeName, path, key, value) => {
    try {
      await addRecord(storeName, { ...value, id: key });
      await loadStoreData();
    } catch (err) {
      logger.error('Failed to add to store', { storeName, error: err });
      setError(err.message);
    }
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

  const renderStoreData = (storeName) => {
    // Skip stores that have dedicated tabs
    if (['errors', 'network', 'mockResponses'].includes(storeName)) {
      return null;
    }

    const data = Array.isArray(storeData[storeName]) ? storeData[storeName] : Object.values(storeData[storeName] || {});
    
    return (
      <div key={storeName}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 capitalize">{storeName}</h3>
          <button
            onClick={() => handleClearStore(storeName)}
            className="px-2 py-1 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <AlertTriangle size={14} />
            Clear
          </button>
        </div>
        <div className="flex-1 overflow-auto mb-8">
          <TreeViewV3 
            data={data}
            onEdit={(path, value) => handleUpdateData(storeName, path, value)}
            onDelete={(path) => handleDeleteData(storeName, path)}
            onAdd={(path, key, value) => handleAddData(storeName, path, key, value)}
            storeName={storeName}
            onToggle={handleToggle}
            expandedPaths={expandedPaths}
            disabled={loading}
            className="p-4"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <Breadcrumb items={[{ label: 'Debugging' }]} />
      
      <Tab.Group selectedIndex={currentTab} onChange={setCurrentTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2 ${
              selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`
          }>
            <Database className="w-4 h-4" />
            Database
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2 ${
              selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`
          }>
            <Network className="w-4 h-4" />
            Network
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2 ${
              selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`
          }>
            <AlertTriangle className="w-4 h-4" />
            Errors
          </Tab>
          <Tab className={({ selected }) =>
            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2 ${
              selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`
          }>
            <Webhook className="w-4 h-4" />
            Mocks
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-2">
          <Tab.Panel>
            <div className="space-y-8">
              <DatabaseControls onRefresh={loadData} />
              {STORES.map(storeName => renderStoreData(storeName))}
            </div>
          </Tab.Panel>
          
          <Tab.Panel>
            <NetworkLogs 
              networkLogs={networkLogs}
              onRefresh={loadData}
            />
          </Tab.Panel>
          
          <Tab.Panel>
            <ErrorLogs 
              errorLogs={errorLogs}
              onRefresh={loadData}
            />
          </Tab.Panel>

          <Tab.Panel>
            <MockResponses 
              mockResponses={mockResponses}
              onRefresh={loadData}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {loading && <div className="text-center">Loading...</div>}
      {error && (
        <div className="text-red-600">
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default Debugging;