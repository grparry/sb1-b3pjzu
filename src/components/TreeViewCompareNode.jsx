import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, ArrowLeft, Copy, Save, Circle } from 'lucide-react';

function TreeViewCompareNode({
  label,
  value,
  isExpanded,
  depth,
  onToggle,
  compareValue,
  path,
  onValueTransfer,
  storeName,
  readOnly = false,
  expandedPaths
}) {
  const pathString = path.join('.');
  const isObject = value !== null && typeof value === 'object';
  const hasChildren = isObject && Object.keys(value).length > 0;
  const canTransfer = compareValue !== undefined && !readOnly;
  const showTransferButton = canTransfer && (!isObject || !isExpanded);
  const indentStyle = { paddingLeft: `${depth * 20}px` };

  const renderValue = () => {
    if (isObject) {
      if (!isExpanded) {
        return '{...}';
      }
      return null;
    }
    return String(value);
  };

  const handleTransfer = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    console.log('Transferring value:', { path, compareValue });
    onValueTransfer(path, compareValue);
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
        />
      );
    });
  };

  return (
    <div className="tree-node-compare">
      <div
        className={`flex items-center py-1 hover:bg-gray-100 ${
          showTransferButton ? 'bg-blue-50' : ''
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
        <span className="flex-1">{renderValue()}</span>

        {showTransferButton && (
          <button
            onClick={handleTransfer}
            className="ml-1 p-1 hover:bg-blue-100 rounded"
            title="Transfer value from mock response"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
          </button>
        )}
      </div>

      {renderChildren()}
    </div>
  );
}

export default TreeViewCompareNode;
