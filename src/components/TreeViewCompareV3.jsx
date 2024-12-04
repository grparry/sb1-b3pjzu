import React, { useState, useCallback } from 'react';
import { ChevronRight, Copy, Save } from 'lucide-react';
import TreeViewV3 from './TreeViewV3';
import * as Dialog from '@radix-ui/react-dialog';
import * as Form from '@radix-ui/react-form';
import { recordExists } from '../services/storage';

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
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-xl w-[400px] animate-slide-up">
          <Dialog.Title className="text-lg font-medium mb-4">Clone Record</Dialog.Title>
          <Form.Root onSubmit={handleSubmit}>
            <Form.Field name="newId">
              <Form.Label className="block text-sm font-medium text-gray-700">
                New Record ID
              </Form.Label>
              <Form.Control asChild>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                />
              </Form.Control>
              {error && (
                <Form.Message className="mt-1 text-sm text-red-600">
                  {error}
                </Form.Message>
              )}
            </Form.Field>
            <div className="flex justify-end gap-3 mt-6">
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
                className="px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </Form.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TreeViewCompareV3({
  databaseRecord,
  mockResponse,
  onApproveNew,
  onCreateNew,
  onUpdateExisting,
  onDatabaseRecordChange,
  storeName
}) {
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);

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
      console.log('Transferring value:', { path, value }); // Debug log
      onUpdateExisting(path, value);
    }
  }, [onUpdateExisting]);

  const handleClone = (newId) => {
    onCreateNew(newId);
    setShowCloneDialog(false);
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
          <TreeViewV3
            data={databaseRecord}
            compareData={mockResponse}
            isExpanded={true}
            onToggle={handleToggle}
            expandedPaths={expandedPaths}
            onEdit={(path, value) => {
              onUpdateExisting(path, value);
            }}
            onDelete={(path) => {
              onUpdateExisting(path, undefined);
            }}
            onAdd={(path) => {
              onUpdateExisting(path, {});
            }}
            onValueTransfer={handleValueTransfer}
            storeName="databaseRecord"
            readOnly={false}
          />
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Mock Response</h2>
          <TreeViewV3
            data={mockResponse}
            isExpanded={true}
            onToggle={handleToggle}
            expandedPaths={expandedPaths}
            onValueTransfer={handleValueTransfer}
            storeName="mockResponse"
            readOnly={true}
          />
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

export default TreeViewCompareV3;
