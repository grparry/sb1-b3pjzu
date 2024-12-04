import React, { useState } from 'react';
import { ChevronRight, Copy, Save } from 'lucide-react';
import TreeViewV2 from './TreeViewV2';
import { Dialog } from '@headlessui/react';
import { recordExists } from '../services/storage';

function TreeViewCompare({
  databaseRecord,
  mockResponse,
  onApproveNew,
  onCreateNew,
  onUpdateExisting,
  storeName
}) {
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  
  const handleToggle = (path) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleValueTransfer = (sourcePath) => {
    if (!sourcePath || !databaseRecord) return;
    
    // Get value from captured data at sourcePath
    const getValue = (obj, path) => {
      return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    };
    
    const value = getValue(mockResponse, sourcePath);
    if (value !== undefined) {
      onUpdateExisting(sourcePath, value);
    }
  };

  // Log the actual data being received
  console.log('TreeViewCompare props:', {
    databaseRecord: databaseRecord ? JSON.stringify(databaseRecord, null, 2) : 'null',
    mockResponse: mockResponse ? JSON.stringify(mockResponse, null, 2) : 'null'
  });

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Left side - Database Record */}
        <div className="border rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">Database Record</h3>
          </div>
          {databaseRecord ? (
            <TreeViewV2
              data={databaseRecord}
              isExpanded={expandedPaths}
              onToggle={handleToggle}
              onEdit={(path, value) => {
                console.log('TreeViewCompare: Edit in database record', { path, value });
                onUpdateExisting(path, value);
              }}
              onValueTransfer={handleValueTransfer}
              compareValue={mockResponse}
              path={[]}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
              <div className="text-lg font-medium mb-2">No Matching Record Found</div>
              <p className="text-sm">
                This appears to be a new record that doesn't exist in the database yet.
              </p>
            </div>
          )}
        </div>

        {/* Right side - Mock Response */}
        <div className="border rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">Mock Response</h3>
          </div>
          {mockResponse ? (
            <TreeViewV2
              data={mockResponse}
              isExpanded={expandedPaths}
              onToggle={handleToggle}
              path={[]}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No mock response data available
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        {!databaseRecord && mockResponse && (
          <button
            onClick={() => onCreateNew(mockResponse)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
          >
            <Save size={16} />
            Create New Record
          </button>
        )}
        {databaseRecord && mockResponse && (
          <button
            onClick={() => onApproveNew(mockResponse)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Save size={16} />
            Update Existing Record
          </button>
        )}
      </div>

      {showCloneDialog && (
        <CloneDialog
          onClose={() => setShowCloneDialog(false)}
          onClone={async (key) => {
            try {
              await onCreateNew({ ...mockResponse, id: key });
              setShowCloneDialog(false);
            } catch (error) {
              console.error('Error cloning record:', error);
            }
          }}
          storeName={storeName}
        />
      )}
    </div>
  );
}

function CloneDialog({ onClose, onClone, storeName }) {
  const [newId, setNewId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newId) {
      setError('ID is required');
      return;
    }

    try {
      const exists = await recordExists(storeName, newId);
      if (exists) {
        setError(`ID '${newId}' already exists in ${storeName}`);
        return;
      }
      onClone(newId);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            New Record ID
          </label>
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Create
          </button>
        </div>
      </div>
    </form>
  );
}

export default TreeViewCompare;
