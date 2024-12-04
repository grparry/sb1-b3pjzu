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
        paths.add(path);
        Object.keys(current).forEach(key => {
          traverse(current[key], path ? `${path}.${key}` : key);
        });
      }
    };
    
    traverse(obj, parentPath);
    return paths;
  };

  // Initialize expandedPaths with all possible paths
  const [expandedPaths, setExpandedPaths] = useState(() => {
    const allPaths = new Set();
    
    // Add the root store path
    allPaths.add(storeName);
    
    // Add paths from database record
    if (databaseRecord && databaseRecord.length > 0) {
      databaseRecord.forEach(record => {
        // Add the record ID level path
        allPaths.add(`${storeName}.${record.id}`);
        getAllPaths(record).forEach(path => allPaths.add(`${storeName}.${record.id}.${path}`));
      });
    }
    
    // Add paths from mock response
    if (mockResponse && mockResponse.length > 0) {
      mockResponse.forEach(record => {
        // Add the record ID level path
        allPaths.add(`${storeName}.${record.id}`);
        getAllPaths(record).forEach(path => allPaths.add(`${storeName}.${record.id}.${path}`));
      });
    }
    
    return allPaths;
  });

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
    if (value !== undefined && onUpdateExisting) {
      onUpdateExisting(path, value);
    }
  }, [onUpdateExisting]);

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
          isExpanded={expandedPaths.has(`${storeName}.${record.id}`)}
          depth={0}
          onToggle={handleToggle}
          compareValue={
            compareData && Array.isArray(compareData)
              ? compareData.find(r => r.id === record.id)
              : undefined
          }
          path={[storeName, record.id]}
          onValueTransfer={handleValueTransfer}
          storeName={storeName}
          readOnly={readOnly}
          expandedPaths={expandedPaths}
        />
      ));
    }

    return Object.entries(data).map(([key, value]) => (
      <TreeViewCompareNode
        key={key}
        label={key}
        value={value}
        isExpanded={expandedPaths.has(`${storeName}.${key}`)}
        depth={0}
        onToggle={handleToggle}
        compareValue={compareData?.[key]}
        path={[storeName, key]}
        onValueTransfer={handleValueTransfer}
        storeName={storeName}
        readOnly={readOnly}
        expandedPaths={expandedPaths}
      />
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Compare View</h2>
        <div className="space-x-2">
          {!databaseRecord && (
            <button
              onClick={() => setShowCloneDialog(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              <Copy className="w-4 h-4 mr-2" />
              Clone
            </button>
          )}
          {databaseRecord && (
            <button
              onClick={() => onApproveNew()}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Database Record</h2>
          <div className="min-h-[200px] overflow-auto relative">
            {databaseRecord ? (
              renderTree(databaseRecord, mockResponse, false)
            ) : (
              <div className="text-gray-500 text-center py-4">No database record available</div>
            )}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Mock Response</h2>
          <div className="min-h-[200px] overflow-auto relative">
            {mockResponse ? (
              renderTree(mockResponse, null, true)
            ) : (
              <div className="text-gray-500 text-center py-4">No mock response available</div>
            )}
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
    </div>
  );
}

export default TreeViewCompareV4;
