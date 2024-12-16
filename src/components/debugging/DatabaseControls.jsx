import React from 'react';
import { Download, Upload, RefreshCw } from 'lucide-react';
import { exportDatabaseToJSON, importDatabaseFromJSON } from '../../services/storage/backup';
import { resetDatabase } from '../../services/storage';
import { initializeStores } from '../../mocks/initializeStores';
import { InitializationManager } from '../../utils/initialization/InitializationManager';

function DatabaseControls({ onRefresh }) {
  const handleExport = async () => {
    const data = await exportDatabaseToJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-data-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await importDatabaseFromJSON(data);
          onRefresh();
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleForceInitialize = async () => {
    await resetDatabase();
    await initializeStores(true);  // Force initialize with mock data
    await InitializationManager.getInstance().initialize(true); // Force re-initialization
    onRefresh();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        <Download className="w-4 h-4" />
        Export Database
      </button>
      <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded hover:bg-green-600 cursor-pointer">
        <Upload className="w-4 h-4" />
        Import Database
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
      <button
        onClick={handleForceInitialize}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600"
      >
        <RefreshCw className="w-4 h-4" />
        Force Initialize with Mock Data
      </button>
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded hover:bg-gray-600"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>
    </div>
  );
}

export default DatabaseControls;
