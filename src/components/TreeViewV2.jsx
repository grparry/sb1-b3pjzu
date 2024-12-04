import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronDown, Edit2, Save, X, Plus, Trash2, Copy } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { recordExists } from '../services/storage';

function AddNodeDialog({ isOpen, onClose, onAdd, path, storeName, initialValue = null }) {
  const [key, setKey] = useState(initialValue?.id || '');
  const [value, setValue] = useState(initialValue ? { ...initialValue } : '');
  const [type, setType] = useState(initialValue ? 'object' : 'string');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const isRootLevel = !path || path.length === 0;
  const isCloning = initialValue !== null;

  useEffect(() => {
    if (initialValue) {
      setKey(initialValue.id || '');
      setValue({ ...initialValue });
      setType('object');
    }
  }, [initialValue]);

  const validateId = async (id) => {
    if (!id) return 'ID is required';
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return 'ID can only contain letters, numbers, underscores, and hyphens';
    }
    try {
      const exists = await recordExists(storeName, id);
      if (exists) {
        return `ID '${id}' already exists in ${storeName}`;
      }
    } catch (err) {
      return `Error checking ID: ${err.message}`;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      const validationError = await validateId(key);
      if (validationError) {
        setError(validationError);
        return;
      }

      if (isCloning) {
        // For cloning, we keep all values but update the ID
        const clonedValue = { ...value, id: key };
        onAdd(key, clonedValue);
      } else {
        // Normal add operation
        let finalValue = value;
        if (type === 'number') {
          finalValue = Number(value);
        } else if (type === 'boolean') {
          finalValue = value === 'true';
        } else if (type === 'object') {
          try {
            finalValue = value === '' ? {} : JSON.parse(value);
          } catch (err) {
            setError('Invalid JSON object');
            return;
          }
        }
        onAdd(key, finalValue);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="relative bg-white rounded-lg p-6 w-96">
          <Dialog.Title className="text-lg font-medium mb-4">
            {isCloning ? 'Clone Record' : isRootLevel ? 'Add Record' : 'Add Property'}
          </Dialog.Title>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {isCloning ? 'New Record ID' : isRootLevel ? 'Record ID' : 'Property Name'}
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={!isCloning ? 'Enter name' : undefined}
                />
              </div>
              {!isCloning && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="object">Object</option>
                    </select>
                  </div>
                  {!isRootLevel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Value</label>
                      {type === 'boolean' ? (
                        <select
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      ) : (
                        <input
                          type={type === 'number' ? 'number' : 'text'}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder={type === 'object' ? 'Enter valid JSON' : 'Enter value'}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isValidating ? 'Validating...' : isCloning ? 'Clone' : 'Add'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}

function TreeNodeV2({ 
  label, 
  value, 
  isExpanded = false, 
  depth = 0, 
  onToggle, 
  compareValue, 
  path = [],
  onEdit,
  onDelete,
  onAdd,
  storeName
}) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cloneValue, setCloneValue] = useState(null);
  
  const isObject = value && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isRootLevel = depth === 0;

  const handleToggle = (e) => {
    // Don't toggle expansion when clicking on a simple value
    if (!isObject && !isArray) {
      return;
    }
    if (onToggle) {
      onToggle();
    }
    setExpanded(!expanded);
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    setShowAddDialog(true);
  };

  const handleClone = (e) => {
    e.stopPropagation();
    setCloneValue(value);
    setShowAddDialog(true);
  };

  const handleAddDialogClose = () => {
    setShowAddDialog(false);
    setCloneValue(null);
  };

  const handleAddSubmit = (key, value) => {
    if (onAdd) {
      // Always add to root level when cloning
      onAdd([], key, value);
    }
    setCloneValue(null);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    if (onEdit) {
      onEdit(path, editValue);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditValue(value);
  };

  const handleDelete = async (e) => {
    console.log('[TreeViewV2] handleDelete called with path:', path);
    try {
      if (!path || path.length === 0) {
        console.warn('[TreeViewV2] Attempted to delete with empty path');
        return;
      }

      if (onDelete) {
        console.log('[TreeViewV2] Calling onDelete handler with path:', path);
        await onDelete(path);
        console.log('[TreeViewV2] onDelete handler completed');
      } else {
        console.warn('[TreeViewV2] No onDelete handler provided');
      }
    } catch (error) {
      console.error('[TreeViewV2] Error in handleDelete:', error);
      throw error;
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    // Only trigger edit for simple values (non-objects, non-arrays)
    if (!isObject && !isArray) {
      e.preventDefault(); // Prevent text selection
      setIsEditing(true);
      setEditValue(value); // Ensure we have the current value
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isDifferent = useCallback(() => {
    if (!compareValue) return false;
    
    if (!isObject && !isArray) {
      return JSON.stringify(value) !== JSON.stringify(compareValue);
    }
    
    if (!value || !compareValue) {
      return value !== compareValue;
    }
    
    if (isObject || isArray) {
      const keys1 = Object.keys(value);
      const keys2 = Object.keys(compareValue);
      if (keys1.length !== keys2.length) return true;
      return keys1.some(key => {
        if (!(key in compareValue)) return true;
        if (typeof value[key] !== typeof compareValue[key]) return true;
        if (typeof value[key] !== 'object') {
          return JSON.stringify(value[key]) !== JSON.stringify(compareValue[key]);
        }
        return false;
      });
    }
    
    return false;
  }, [value, compareValue, isObject, isArray]);

  const getNodeStyle = () => {
    if (!compareValue) return '';
    const different = isDifferent();
    if (different) {
      if (!value && compareValue) return 'bg-red-100';
      if (value && !compareValue) return 'bg-green-100';
      return 'bg-yellow-100';
    }
    return '';
  };

  const renderEditControls = () => {
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2 ml-2">
          <button
            onClick={handleSave}
            className="p-1 hover:bg-green-100 rounded"
            title="Save"
          >
            <Save className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-red-100 rounded"
            title="Cancel"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      );
    }

    if (!isRootLevel) {
      return (
        <div className={`flex items-center space-x-2 ml-2 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
          {!isObject && !isArray && (
            <button
              onClick={handleEdit}
              className="p-1 hover:bg-blue-100 rounded"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-100 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
          {(isObject || isArray) && (
            <>
              <button
                onClick={handleAdd}
                className="p-1 hover:bg-green-100 rounded"
                title="Add"
              >
                <Plus className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={handleClone}
                className="p-1 hover:bg-purple-100 rounded"
                title="Clone"
              >
                <Copy className="w-4 h-4 text-purple-600" />
              </button>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  const renderValue = () => {
    if (isObject || isArray) {
      return null;
    }

    if (isEditing) {
      return (
        <input
          type={typeof value === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="px-1 py-0.5 border rounded"
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    if (value === undefined) {
      return <span className="text-gray-400">undefined</span>;
    }
    if (value === null) {
      return <span className="text-gray-400">null</span>;
    }
    if (typeof value === 'string') {
      return <span className="text-green-600">"{value}"</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-blue-600">{value}</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="text-purple-600">{value.toString()}</span>;
    }
    return value.toString();
  };

  const renderChildren = () => {
    if (!isObject && !isArray) return null;
    if (!expanded) return null;

    return (
      <div className="ml-4">
        {Object.entries(value).map(([key, val]) => {
          const newPath = [...path, key];
          const compareVal = compareValue && compareValue[key];
          return (
            <TreeNodeV2
              key={key}
              label={isArray ? `[${key}]` : key}
              value={val}
              depth={depth + 1}
              compareValue={compareVal}
              path={newPath}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
              storeName={storeName}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={getNodeStyle()}>
      {showAddDialog && (
        <AddNodeDialog
          isOpen={showAddDialog}
          onClose={handleAddDialogClose}
          onAdd={handleAddSubmit}
          path={path}
          storeName={storeName}
          initialValue={cloneValue}
        />
      )}
      <div 
        className={`flex items-center group cursor-pointer select-none ${
          isHovered ? 'bg-gray-100' : ''
        }`}
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        style={{ paddingLeft: `${depth * 20}px` }}
      >
        {(isObject || isArray) && (
          <span className="mr-1">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        <span 
          className={`font-mono text-sm flex-grow ${!isObject && !isArray ? 'cursor-text' : ''}`}
        >
          {label}
          {(isObject || isArray) && (
            <span className="text-gray-500">
              {isArray ? ` [${Object.keys(value).length}]` : ' {…}'}
            </span>
          )}
          {!isObject && !isArray && ': '}
          {renderValue()}
        </span>
        <span className="opacity-0 group-hover:opacity-100">
          {renderEditControls()}
        </span>
      </div>
      {renderChildren()}
    </div>
  );
}

export default function TreeViewV2({ 
  data, 
  compareData,
  onEdit,
  onDelete,
  onAdd,
  storeName
}) {
  return (
    <div className="font-mono text-sm">
      <TreeNodeV2 
        label="root" 
        value={data} 
        isExpanded={true} 
        compareValue={compareData}
        onEdit={onEdit}
        onDelete={onDelete}
        onAdd={onAdd}
        storeName={storeName}
      />
    </div>
  );
}
