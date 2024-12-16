import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, ArrowLeft, Copy, Save, Circle } from 'lucide-react';
import isEqual from 'lodash/isEqual';

function TreeViewCompareNode({
  label,
  value,
  isExpanded,
  depth = 0,
  onToggle,
  compareValue,
  path,
  onValueTransfer,
  storeName,
  readOnly = false,
  expandedPaths,
  pendingUpdates = new Map()
}) {
  const isObject = value && typeof value === 'object' && !Array.isArray(value);
  const hasChildren = isObject && Object.keys(value).length > 0;
  const pathString = path.join('.');
  const indentStyle = { paddingLeft: `${depth * 20}px` };

  const handleTransfer = useCallback((e) => {
    e.stopPropagation();
    if (onValueTransfer) {
      onValueTransfer(path, compareValue);
    }
  }, [onValueTransfer, path, compareValue]);

  const isValueDifferent = compareValue !== undefined && !isEqual(value, compareValue);
  const hasPendingUpdate = pendingUpdates.has(pathString);

  const renderValue = () => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return '{...}';
    return String(value);
  };

  const renderChildren = () => {
    if (!isObject || !isExpanded) return null;

    return Object.entries(value).map(([key, childValue]) => {
      const childPath = [...path, key];
      const childCompareValue = compareValue && typeof compareValue === 'object' ? compareValue[key] : undefined;

      return (
        <TreeViewCompareNode
          key={key}
          label={key}
          value={childValue}
          isExpanded={expandedPaths.has(childPath.join('.'))}
          depth={depth + 1}
          onToggle={onToggle}
          compareValue={childCompareValue}
          path={childPath}
          onValueTransfer={onValueTransfer}
          storeName={storeName}
          readOnly={readOnly}
          expandedPaths={expandedPaths}
          pendingUpdates={pendingUpdates}
        />
      );
    });
  };

  return (
    <div className="tree-node-compare">
      <div
        className={`flex items-center py-1 hover:bg-gray-100 ${
          hasPendingUpdate ? 'bg-yellow-50' : isValueDifferent ? 'bg-blue-50' : ''
        }`}
        style={indentStyle}
      >
        {hasChildren && (
          <button
            onClick={() => onToggle(pathString)}
            className="mr-1 p-1 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-6" />}
        
        <span className="font-medium mr-2">{label}:</span>
        <span className={`flex-1 ${isValueDifferent && !hasPendingUpdate ? 'text-blue-600' : ''}`}>
          {hasPendingUpdate ? pendingUpdates.get(pathString) : renderValue()}
        </span>

        {isValueDifferent && !readOnly && !hasPendingUpdate && (
          <button
            onClick={handleTransfer}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="Transfer value from right to left"
          >
            <ArrowLeft className="w-4 h-4 text-blue-500" />
          </button>
        )}
      </div>

      {renderChildren()}
    </div>
  );
}

export default TreeViewCompareNode;
