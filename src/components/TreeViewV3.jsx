import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronDown, Edit2, Save, X, Plus, Trash2, Copy, Check, ArrowLeftRight } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Form from '@radix-ui/react-form';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
      if (isRootLevel) {
        const validationError = await validateId(key);
        if (validationError) {
          setError(validationError);
          return;
        }
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
          finalValue = {};
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
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-xl w-[400px] animate-slide-up">
          <Dialog.Title className="text-lg font-medium mb-4">
            {isCloning ? 'Clone Record' : isRootLevel ? 'Add Record' : 'Add Property'}
          </Dialog.Title>
          <Form.Root onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Form.Field name="key">
                <Form.Label className="block text-sm font-medium text-gray-700">
                  {isCloning ? 'New Record ID' : isRootLevel ? 'Record ID' : 'Property Name'}
                </Form.Label>
                <Form.Control asChild>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                    placeholder={!isCloning ? 'Enter name' : undefined}
                  />
                </Form.Control>
              </Form.Field>

              {!isCloning && !isRootLevel && (
                <>
                  <Form.Field name="type">
                    <Form.Label className="block text-sm font-medium text-gray-700">
                      Type
                    </Form.Label>
                    <div className="mt-1">
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="object">Object</option>
                      </select>
                    </div>
                  </Form.Field>

                  {type !== 'object' && (
                    <Form.Field name="value">
                      <Form.Label className="block text-sm font-medium text-gray-700">
                        Value
                      </Form.Label>
                      <Form.Control asChild>
                        {type === 'boolean' ? (
                          <select
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                          >
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : (
                          <input
                            type={type === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                            placeholder={type === 'object' ? 'Enter valid JSON' : 'Enter value'}
                          />
                        )}
                      </Form.Control>
                    </Form.Field>
                  )}
                </>
              )}

              {error && (
                <Form.Message className="mt-1 text-sm text-red-600">
                  {error}
                </Form.Message>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {isValidating ? 'Validating...' : isCloning ? 'Clone' : 'Add'}
                </button>
              </div>
            </div>
          </Form.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TreeViewV3({
  data,
  compareData,
  isExpanded,
  onToggle,
  expandedPaths = new Set(),
  onValueTransfer,
  onEdit,
  onDelete,
  onAdd,
  storeName,
  readOnly = false
}) {
  const [editingPath, setEditingPath] = useState(null);
  const [localData, setLocalData] = useState(data);
  const [showRootAddDialog, setShowRootAddDialog] = useState(false);
  const [localExpandedPaths, setLocalExpandedPaths] = useState(new Set(expandedPaths));

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  useEffect(() => {
    setLocalExpandedPaths(new Set(expandedPaths));
  }, [expandedPaths]);

  const handleLocalToggle = useCallback((path) => {
    if (onToggle) {
      onToggle(path);
    }
  }, [onToggle]);

  const handleRootAdd = useCallback((key, value) => {
    if (onAdd) {
      onAdd([], key, value);
    }
    setShowRootAddDialog(false);
  }, [onAdd]);

  const handleDelete = useCallback((path) => {
    console.log('Deleting path:', path);
    if (onDelete) {
      onDelete(path);
    }
  }, [onDelete]);

  const renderTree = useCallback((obj, path = []) => {
    if (!obj) return null;

    // If it's an array of records, first render a root node
    if (Array.isArray(obj)) {
      return (
        <div>
          <div className="flex items-center group py-1">
            <span className="font-medium">{storeName}</span>
            {!readOnly && (
              <div className="flex items-center space-x-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => setShowRootAddDialog(true)}
                  className="p-1 hover:bg-green-100 rounded"
                  title="Add New Record"
                >
                  <Plus className="w-4 h-4 text-green-600" />
                </button>
              </div>
            )}
          </div>
          {obj.map((record) => (
            <TreeNodeV3
              key={record.id}
              label={record.id}
              value={record}
              isExpanded={localExpandedPaths?.has?.(`${storeName}.${record.id}`) || false}
              depth={1}
              onToggle={handleLocalToggle}
              compareValue={
                compareData && Array.isArray(compareData)
                  ? compareData.find(r => r.id === record.id)
                  : undefined
              }
              path={[storeName, record.id]}
              onEdit={!readOnly ? onEdit : undefined}
              onDelete={!readOnly ? handleDelete : undefined}
              onAdd={!readOnly ? onAdd : undefined}
              onValueTransfer={onValueTransfer}
              storeName={storeName}
              editingPath={editingPath}
              setEditingPath={setEditingPath}
              readOnly={readOnly}
              expandedPaths={localExpandedPaths || new Set()}
            />
          ))}
        </div>
      );
    }

    // For regular objects (including nested objects within records)
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).map(([key, value]) => {
        const isRootRecord = path.length === 0;
        const recordId = isRootRecord ? key : path[0];
        const currentPath = isRootRecord ? [key] : [...path, key];
        const pathString = currentPath.join('.');
        const isExpanded = localExpandedPaths?.has?.(pathString) || false;

        return (
          <TreeNodeV3
            key={key}
            label={key}
            value={value}
            isExpanded={isExpanded}
            depth={path.length}
            onToggle={handleLocalToggle}
            compareValue={
              compareData && typeof compareData === 'object'
                ? compareData[key]
                : undefined
            }
            path={currentPath}
            onEdit={onEdit}
            onDelete={onDelete}
            onAdd={onAdd}
            onValueTransfer={onValueTransfer}
            storeName={storeName}
            editingPath={editingPath}
            setEditingPath={setEditingPath}
            readOnly={readOnly}
            expandedPaths={localExpandedPaths || new Set()}
          />
        );
      });
    }

    return null;
  }, [compareData, localExpandedPaths, handleLocalToggle, onEdit, onDelete, onAdd, onValueTransfer, storeName, editingPath, readOnly]);

  return (
    <div className="text-sm">
      {renderTree(localData)}
      <AddNodeDialog
        isOpen={showRootAddDialog}
        onClose={() => setShowRootAddDialog(false)}
        onAdd={handleRootAdd}
        path={[]}
        storeName={storeName}
      />
    </div>
  );
}

function TreeNodeV3({
  label,
  value,
  isExpanded,
  depth,
  onToggle,
  compareValue,
  path,
  onEdit,
  onDelete,
  onAdd,
  onValueTransfer,
  storeName,
  editingPath,
  setEditingPath,
  readOnly,
  expandedPaths
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [cloneValue, setCloneValue] = useState(null);
  const [editValue, setEditValue] = useState(value);
  const pathString = path.join('.');
  const isEditing = pathString === editingPath;

  const isObject = value && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isRootLevel = depth === 0;
  const hasChildren = isObject || isArray;

  const handleToggleClick = (e) => {
    e.stopPropagation();
    if (hasChildren && onToggle) {
      onToggle(pathString);
    }
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
    setShowAddDialog(false);
  };

  const handleEdit = () => {
    if (editingPath && editingPath !== pathString) {
      // Another row is being edited, don't allow editing this one
      return;
    }
    setEditValue(typeof value === 'object' ? JSON.stringify(value) : String(value));
    setEditingPath(pathString);
  };

  const handleSave = () => {
    try {
      if (editValue === undefined || editValue === null) {
        console.error('Edit value is undefined or null');
        return;
      }

      let parsedValue = editValue;
      const strValue = String(editValue).trim();

      // Try to parse as JSON if it looks like an object or array
      if (strValue.startsWith('{') || strValue.startsWith('[')) {
        try {
          parsedValue = JSON.parse(strValue);
        } catch (jsonError) {
          console.error('Invalid JSON:', jsonError);
          return;
        }
      } else if (!isNaN(strValue) && strValue !== '') {
        // Convert to number if it's numeric
        parsedValue = Number(strValue);
      } else if (strValue.toLowerCase() === 'true' || strValue.toLowerCase() === 'false') {
        // Convert to boolean if it's a boolean string
        parsedValue = strValue.toLowerCase() === 'true';
      }
      onEdit(path, parsedValue);
      setEditingPath(null);
    } catch (error) {
      console.error('Error saving value:', error);
      // Keep editing state if there's an error
    }
  };

  const handleCancel = () => {
    setEditingPath(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDoubleClick = (e) => {
    if (!readOnly && !isObject) {
      e.preventDefault(); // Prevent text selection
      handleEdit();
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const canTransfer = compareValue !== undefined && !readOnly;
  const showTransferButton = canTransfer && (!isObject || !isExpanded);
  const indentStyle = { paddingLeft: `${depth * 20}px` };

  const isExpandedNode = expandedPaths.has(pathString);

  const renderValue = () => {
    if (isObject) {
      if (!isExpandedNode) {
        return '{...}';
      }
      return null;
    }
    if (isArray) {
      if (!isExpandedNode) {
        return '[...]';
      }
      return null;
    }
    return String(value);
  };

  const renderChildren = () => {
    if (!isExpandedNode || !hasChildren) return null;

    const entries = isArray ? value.map((v, i) => [String(i), v]) : Object.entries(value);

    return entries.map(([key, val], index) => (
      <TreeNodeV3
        key={`${pathString}.${key}`}
        label={key}
        value={val}
        depth={depth + 1}
        onToggle={onToggle}
        path={[...path, key]}
        onEdit={onEdit}
        onDelete={onDelete}
        onAdd={onAdd}
        onValueTransfer={onValueTransfer}
        compareValue={compareValue?.[key]}
        storeName={storeName}
        editingPath={editingPath}
        setEditingPath={setEditingPath}
        readOnly={readOnly}
        expandedPaths={expandedPaths}
      />
    ));
  };

  const handleTransfer = () => {
    onValueTransfer(path, compareValue);
  };

  const renderEditControls = () => {
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2 ml-2">
          <button
            onClick={handleSave}
            className="p-1 hover:bg-green-100 rounded"
            title="Save (Enter)"
          >
            <Save className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-red-100 rounded"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-2 ml-2 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
        {!isObject && !isArray && !readOnly && (
          <button
            onClick={handleEdit}
            className="p-1 hover:bg-blue-100 rounded"
            title="Edit (Double-click)"
          >
            <Edit2 className="w-4 h-4 text-blue-600" />
          </button>
        )}
        {!readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(path);
            }}
            className="p-1 hover:bg-red-100 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        )}
        {(isObject || isArray) && !readOnly && (
          <>
            <button
              onClick={() => onAdd(path)}
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
        {compareValue && (
          <button
            onClick={handleTransfer}
            className="p-1 hover:bg-yellow-100 rounded"
            title="Transfer Value"
          >
            <ArrowLeftRight className="w-4 h-4 text-yellow-600" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Root level add dialog */}
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
      <div>
        <div
          className={`flex items-center py-1 hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}
          style={indentStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
        >
          <div className="flex-1 flex items-center min-w-0">
            {hasChildren && (
              <button
                onClick={handleToggleClick}
                className="p-1 hover:bg-gray-200 rounded mr-1"
              >
                {isExpandedNode ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            <div className="flex-1 flex items-center min-w-0 mr-2">
              <span className="font-medium text-gray-700 mr-2">{label}:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-w-0 px-2 py-1 border rounded"
                  autoFocus
                />
              ) : (
                <span className="text-gray-900 flex-1 min-w-0 truncate">
                  {renderValue()}
                </span>
              )}
            </div>
            {renderEditControls()}
          </div>
        </div>
        {renderChildren()}
      </div>
    </div>
  );
}

export default TreeViewV3;
