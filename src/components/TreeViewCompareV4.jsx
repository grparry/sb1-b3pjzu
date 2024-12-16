import React, { useState, useCallback } from 'react';
import { Copy, Save } from 'lucide-react';
import TreeViewCompareNode from './TreeViewCompareNode';
import CloneDialog from './CloneDialog';

function TreeViewCompareV4({
  databaseRecord,
  mockResponse,
  onApproveNew,
  onCreateNew,
  onUpdateExisting,
  onDatabaseRecordChange,
  storeName
}) {
  // Get all possible paths from both database and mock records
  const getAllPaths = (obj, parentPath = '') => {
    const paths = new Set();
    
    const traverse = (current, path) => {
      if (current && typeof current === 'object') {
        if (path) paths.add(path);
        Object.keys(current).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          traverse(current[key], newPath);
        });
      }
    };
    
    traverse(obj, parentPath);
    return paths;
  };

  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [pendingUpdates, setPendingUpdates] = useState(new Map());
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  const handleToggle = useCallback((path) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleValueTransfer = useCallback((path, value) => {
    if (value !== undefined) {
      console.log('Transfer path:', path);
      // Store the path as is, since it's already in the correct format
      setPendingUpdates(prev => {
        const next = new Map(prev);
        const pathString = path.join('.');
        console.log('Storing update:', pathString, value);
        next.set(pathString, value);
        return next;
      });
    }
  }, []);

  const handleSave = useCallback(() => {
    if (pendingUpdates.size > 0 && onUpdateExisting) {
      console.log('Pending updates:', Array.from(pendingUpdates.entries()));
      // Convert Map entries to arrays of paths and values
      const updates = Array.from(pendingUpdates.entries()).reduce((acc, [pathString, value]) => {
        // Path string is already in the correct format (e.g. "high-users-repairs.contentTemplate.title")
        const pathParts = pathString.split('.');
        console.log('Path parts:', pathParts);
        
        // Add to accumulator (ensure we have at least a record ID)
        if (pathParts.length > 0) {
          acc.paths.push(pathParts);
          acc.values.push(value);
        }
        return acc;
      }, { paths: [], values: [] });

      console.log('Updates to apply:', updates);
      // Call onUpdateExisting with arrays of paths and values
      if (updates.paths.length > 0) {
        onUpdateExisting(updates.paths, updates.values);
      }
      
      // Clear pending updates
      setPendingUpdates(new Map());
    }
  }, [pendingUpdates, onUpdateExisting]);

  const handleClone = (newId) => {
    onCreateNew(newId);
    setShowCloneDialog(false);
  };

  const renderTree = (data, compareData, readOnly = false) => {
    if (!data) return null;

    if (Array.isArray(data)) {
      return data.map((record) => (
        <TreeViewCompareNode
          key={record.id}
          label={record.id}
          value={record}
          isExpanded={expandedPaths.has(record.id)}
          depth={0}
          onToggle={handleToggle}
          compareValue={
            compareData && Array.isArray(compareData)
              ? compareData.find(r => r.id === record.id)
              : undefined
          }
          path={[record.id]}
          onValueTransfer={handleValueTransfer}
          storeName={storeName}
          readOnly={readOnly}
          expandedPaths={expandedPaths}
          pendingUpdates={pendingUpdates}
        />
      ));
    }

    return Object.entries(data).map(([key, value]) => (
      <TreeViewCompareNode
        key={key}
        label={key}
        value={value}
        isExpanded={expandedPaths.has(key)}
        depth={0}
        onToggle={handleToggle}
        compareValue={compareData ? compareData[key] : undefined}
        path={[key]}
        onValueTransfer={handleValueTransfer}
        storeName={storeName}
        readOnly={readOnly}
        expandedPaths={expandedPaths}
        pendingUpdates={pendingUpdates}
      />
    ));
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Database Record</h3>
            {renderTree(databaseRecord, mockResponse, false)}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Mock Response</h3>
            {renderTree(mockResponse, databaseRecord, true)}
          </div>
        </div>
      </div>

      {showCloneDialog && (
        <CloneDialog
          onClose={() => setShowCloneDialog(false)}
          onClone={handleClone}
          storeName={storeName}
        />
      )}

      {/* Save/Cancel buttons */}
      <div className="sticky bottom-0 right-0 flex justify-end gap-2 p-4 bg-white border-t">
        {pendingUpdates.size > 0 && (
          <button
            onClick={() => setPendingUpdates(new Map())}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel Changes
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={pendingUpdates.size === 0}
          className={`px-4 py-2 rounded ${
            pendingUpdates.size > 0
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {pendingUpdates.size > 0 ? `Save ${pendingUpdates.size} Changes` : 'No Changes'}
        </button>
      </div>
    </div>
  );
}

export default TreeViewCompareV4;
