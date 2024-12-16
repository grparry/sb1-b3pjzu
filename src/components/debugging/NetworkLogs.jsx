import React, { useState, useEffect } from 'react';
import { Network, Trash2 } from 'lucide-react';
import { clearStore } from '../../services/storage';
import TreeViewV3 from '../TreeViewV3';

function NetworkLogs({ networkLogs, onRefresh }) {
  const [sortedLogs, setSortedLogs] = useState([]);
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  useEffect(() => {
    setSortedLogs([...(networkLogs || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }, [networkLogs]);

  const handleClearLogs = async () => {
    await clearStore('network');
    onRefresh();
  };

  const handleToggle = (path) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Network className="w-5 h-5" />
          Network Traffic
        </h2>
        <button
          onClick={handleClearLogs}
          className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Clear Logs
        </button>
      </div>
      <TreeViewV3 
        data={sortedLogs} 
        onToggle={handleToggle}
        expandedPaths={expandedPaths}
        readOnly={true}
      />
    </div>
  );
}

export default NetworkLogs;
