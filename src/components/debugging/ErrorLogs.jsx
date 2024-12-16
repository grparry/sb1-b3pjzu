import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { clearStore } from '../../services/storage';
import TreeViewV3 from '../TreeViewV3';

function ErrorLogs({ errorLogs, onRefresh }) {
  const [sortedLogs, setSortedLogs] = useState([]);

  useEffect(() => {
    setSortedLogs([...(errorLogs || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }, [errorLogs]);

  const handleClearLogs = async () => {
    await clearStore('errors');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Error Logs
        </h2>
        <button
          onClick={handleClearLogs}
          className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Clear Logs
        </button>
      </div>
      <TreeViewV3 data={sortedLogs} />
    </div>
  );
}

export default ErrorLogs;
