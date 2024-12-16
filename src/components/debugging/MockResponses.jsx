import React, { useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';
import { updateByPath, getAllFromStore, addRecord, clearStore } from '../../services/storage';
import RecordComparisonView from '../RecordComparisonView';
import TreeViewCompareModal from '../TreeViewCompareModal';
import { STORES } from '../../services/storage/core';

function Mocks({ mockResponses, onRefresh }) {
  const [selectedMock, setSelectedMock] = useState(null);
  const [selectedMockId, setSelectedMockId] = useState(null);
  const [selectedMockRecords, setSelectedMockRecords] = useState([]);
  const [databaseRecords, setDatabaseRecords] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState(null);

  console.log('mockResponses:', mockResponses);

  const getStoreNameForRecord = (record) => {
    // Check if it's a notification or reminder (they go in nudges)
    if (record.type === 'NOTIFICATION' || record.type === 'reminder' || record.type === 'educational') {
      return 'nudges';
    }
    
    // Check for content template or channel (also nudges)
    if (record.contentTemplate || record.channel) {
      return 'nudges';
    }
    
    // Check for other specific types
    if (record.type === 'collection') {
      return 'collections';
    }
    if (record.type === 'media') {
      return 'media';
    }
    // Check for media folders - look for name and created/modified timestamps
    if (record.name && record.created && record.modified) {
      return 'mediaFolders';
    }
    if (record.type === 'user') {
      return 'users';
    }
    if (record.type === 'error') {
      return 'errors';
    }
    if (record.type === 'network') {
      return 'network';
    }
    
    // Default to mockResponses if we can't determine the type
    return 'mockResponses';
  };

  const extractRecordsFromMock = (mock) => {
    if (!mock) return [];
    
    const records = [];
    
    // Extract the response data, handling both string and object responses
    let responseData = mock.response;
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (e) {
        console.warn('Failed to parse response data:', e);
        return records;
      }
    }

    // Handle array responses
    if (Array.isArray(responseData)) {
      records.push(...responseData);
    }
    // Handle object responses
    else if (responseData && typeof responseData === 'object') {
      // Check if it's a paginated response with data field
      if (responseData.data && Array.isArray(responseData.data)) {
        records.push(...responseData.data);
      }
      // Check if it's a single record response with data field
      else if (responseData.data && typeof responseData.data === 'object') {
        records.push(responseData.data);
      }
      // Check if it's a single record without data field
      else if (!responseData._mockMetadata) {
        records.push(responseData);
      }
    }

    return records;
  };

  const handleSelectMock = async (mock) => {
    try {
      const records = extractRecordsFromMock(mock);
      setSelectedMockRecords(records);
      setSelectedMock(mock);

      // Get database records for comparison
      if (records.length > 0) {
        const storeName = getStoreNameForRecord(records[0]);
        const dbRecords = await getAllFromStore(storeName);
        setDatabaseRecords(dbRecords || []);
      }
    } catch (err) {
      console.error('Error preparing records:', err);
      setDatabaseRecords([]);
    }
  };

  const handleCreateNew = async (newId) => {
    const mockRecord = selectedMockRecords[0];
    if (mockRecord) {
      try {
        const storeName = getStoreNameForRecord(mockRecord);
        const newRecord = { ...mockRecord, id: newId };
        await addRecord(storeName, newRecord);
        // Refresh database records
        const records = await getAllFromStore(storeName);
        setDatabaseRecords(records || []);
        setCompareModalOpen(false);
      } catch (err) {
        console.error('Error creating new record:', err);
        setDatabaseRecords([]); // Set empty array on error
      }
    }
  };

  const handleUpdateExisting = async (records, storeName) => {
    try {
      for (const record of records) {
        // For folder records, ensure they have an id property
        if (storeName === 'mediaFolders' && typeof record === 'string') {
          await addRecord(storeName, { id: record, type: 'folder' });
        } else {
          await addRecord(storeName, record);
        }
      }
      onRefresh();
    } catch (error) {
      console.error('Failed to update records:', error);
    }
  };

  const handleCompare = async (input) => {
    let mockRecord = null;
    let mock = null;
    let database = null;

    console.log('Compare input:', input);
    
    // Handle both direct records and comparison data structure
    if (input.mock && input.database) {
      // Input is already in comparison format
      mock = input.mock;
      database = input.database;
    } else {
      // Input is a direct record
      mock = input;
    }

    // Extract the mock record
    if (mock.data) {
      // For GET requests, the data property contains the full response
      if (Array.isArray(mock.data.data)) {
        mockRecord = mock.data.data[0]; // Take the first record for comparison
      } else if (mock.data.data) {
        mockRecord = mock.data.data;
      } else {
        mockRecord = mock.data;
      }
    } else if (mock.response) {
      try {
        let responseData = mock.response;
        console.log('Response data before parse:', responseData);
        if (typeof responseData === 'string') {
          responseData = JSON.parse(responseData);
        }
        console.log('Response data after parse:', responseData);
        if (responseData.data) {
          mockRecord = responseData.data;
        } else {
          mockRecord = responseData;
        }
      } catch (err) {
        console.error('Error extracting mock record:', err);
      }
    } else {
      // The mock might be the record itself
      mockRecord = mock;
    }

    if (!mockRecord) {
      console.error('No mock record found to compare:', mock);
      return;
    }

    console.log('Extracted mock record:', mockRecord);

    // If we already have the database record from the comparison data, use it
    if (database) {
      console.log('Using provided database record:', database);
    } else {
      // Otherwise, fetch it from the store
      const storeName = getStoreNameForRecord(mockRecord);
      console.log('Looking for record in store:', storeName);
      const dbRecords = await getAllFromStore(storeName);
      console.log('Found database records:', dbRecords);
      database = dbRecords?.find(r => r.id === mockRecord.id);
      console.log('Matched database record:', database);
    }
    
    const compareData = { 
      mock: mockRecord, 
      database: database || null 
    };
    console.log('Final compare data:', compareData);
    setSelectedForCompare(compareData);
    setCompareModalOpen(true);
  };

  const renderMockCard = (mock) => {
    if (!mock) return null;
    
    const records = extractRecordsFromMock(mock);
    const recordCount = records.length;
    const recordType = records[0]?.type || 'unknown';
    const storeName = records[0] ? getStoreNameForRecord(records[0]) : 'mockResponses';

    return (
      <div
        key={mock.id}
        className="p-4 bg-white rounded-lg shadow space-y-2 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleSelectMock(mock)}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium">{mock.url || 'Unknown URL'}</div>
            <div className="text-sm text-gray-500">
              {recordCount} record{recordCount !== 1 ? 's' : ''} ({recordType})
            </div>
            <div className="text-sm text-gray-500">Store: {storeName}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Mock Responses</h2>
        <button
          onClick={async () => {
            try {
              await clearStore('mockResponses');
              // Reset component state
              setSelectedMock(null);
              setSelectedMockId(null);
              setSelectedMockRecords([]);
              setDatabaseRecords([]);
              // Refresh data
              if (onRefresh) onRefresh();
            } catch (error) {
              console.error('Failed to clear mocks:', error);
            }
          }}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 flex items-center gap-1 rounded border border-red-200 hover:border-red-300"
        >
          <AlertTriangle size={14} />
          Clear All Mocks
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Mock Response Cards - Left Column */}
        <div className="col-span-4 space-y-4">
          {mockResponses?.length > 0 ? (
            mockResponses.map(renderMockCard)
          ) : (
            <div className="text-center text-gray-500 py-8">
              No mock responses available
            </div>
          )}
        </div>

        {/* Record Comparison View - Right Two Columns */}
        <div className="col-span-8">
          {selectedMock ? (
            <RecordComparisonView
              mockResponse={selectedMockRecords}
              databaseRecords={databaseRecords}
              onCompare={handleCompare}
              onAddRecord={handleCreateNew}
              storeName={selectedMockRecords[0] ? getStoreNameForRecord(selectedMockRecords[0]) : ''}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a mock response to view records
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      {compareModalOpen && selectedForCompare && (
        <TreeViewCompareModal
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          mockId={selectedForCompare.mock.id}
          storeKey={getStoreNameForRecord(selectedForCompare.mock)}
          mockResponses={[selectedForCompare.mock]}
          databaseRecords={selectedForCompare.database ? [selectedForCompare.database] : []}
          onApproveNew={() => handleUpdateExisting([selectedForCompare.mock], getStoreNameForRecord(selectedForCompare.mock))}
          onCreateNew={handleCreateNew}
          onUpdateExisting={handleUpdateExisting}
        />
      )}
    </div>
  );
}

export default Mocks;