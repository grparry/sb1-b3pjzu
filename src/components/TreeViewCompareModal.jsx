import React from 'react';
import { X } from 'lucide-react';
import TreeViewCompareV4 from './TreeViewCompareV4';

export default function TreeViewCompareModal({ 
  isOpen, 
  onClose, 
  mockId, 
  storeKey,
  mockResponses,
  databaseRecords,
  onApproveNew,
  onCreateNew,
  onUpdateExisting
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[90vw] h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Compare Records</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <TreeViewCompareV4
            databaseRecord={databaseRecords}
            mockResponse={mockResponses}
            onApproveNew={onApproveNew}
            onCreateNew={onCreateNew}
            onUpdateExisting={onUpdateExisting}
            onDatabaseRecordChange={() => {}}
            storeName={storeKey}
          />
        </div>
      </div>
    </div>
  );
}
