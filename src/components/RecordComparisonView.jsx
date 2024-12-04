import React from 'react';
import { Plus, ArrowRight } from 'lucide-react';

const RecordCard = ({ record, type, onCompare, onAdd, storeName, mockRecord }) => {
  // Capitalize first letter of store name for display
  const displayType = storeName.charAt(0).toUpperCase() + storeName.slice(1);
  
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{displayType}</h3>
          <p className="text-sm text-gray-500">
            {record ? `ID: ${record.id}` : 'Record not found in database'}
          </p>
        </div>
        {record && type === 'mock' && onCompare && (
          <button
            onClick={() => onCompare({ mock: mockRecord, database: record })}
            className="px-3 py-1 text-sm bg-sky-50 text-sky-600 rounded-md hover:bg-sky-100"
          >
            Compare
          </button>
        )}
        {!record && type === 'database' && onAdd && (
          <button
            onClick={(event) => {
              // Show loading state
              const button = event.target;
              const originalText = button.innerText;
              button.disabled = true;
              button.innerText = 'Adding...';

              // Call onAdd and handle completion
              Promise.resolve(onAdd(mockRecord))
                .then(() => {
                  // Success state
                  button.innerText = 'Added!';
                  button.className = 'px-3 py-1 text-sm bg-green-50 text-green-600 rounded-md cursor-default';
                })
                .catch(() => {
                  // Error state
                  button.innerText = 'Failed';
                  button.className = 'px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md cursor-default';
                });
            }}
            className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>
    </div>
  );
};

export default function RecordComparisonView({ 
  mockResponse, 
  databaseRecords, 
  onCompare, 
  onAddRecord,
  storeName 
}) {
  // Match records based on ID
  const matchedRecords = mockResponse.map(mockRecord => {
    const matchingDbRecord = databaseRecords.find(dbRecord => dbRecord.id === mockRecord.id);
    return {
      mock: mockRecord,
      database: matchingDbRecord
    };
  });

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Database Records Column */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Database Record(s)</h2>
        <div className="space-y-4">
          {matchedRecords.map(({ mock, database }) => (
            <RecordCard
              key={mock.id}
              record={database}
              type="database"
              onAdd={() => onAddRecord(mock)}
              storeName={storeName}
              mockRecord={mock}
            />
          ))}
        </div>
      </div>

      {/* Mock Records Column */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Mock Records</h2>
        <div className="space-y-4">
          {matchedRecords.map(({ mock, database }) => (
            <RecordCard
              key={mock.id}
              record={mock}
              type="mock"
              onCompare={database ? onCompare : undefined}
              storeName={storeName}
              mockRecord={mock}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
