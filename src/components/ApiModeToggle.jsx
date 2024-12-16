import React from 'react';
import { Switch } from '@headlessui/react';
import { ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import useConfigStore from '../services/config';
import { clearAuthToken } from '../services/api';
import { logger } from '../services/utils/logging';

function ApiModeToggle() {
  const { 
    useMockData, 
    setUseMockData, 
    captureResponses, 
    setCaptureResponses, 
    logNetworkTraffic, 
    setLogNetworkTraffic,
    apiModePanelVisible,
    setApiModePanelVisible
  } = useConfigStore();

  const handleMockToggle = async () => {
    const newValue = !useMockData;
    setUseMockData(newValue);
  };

  const handleCaptureToggle = async () => {
    const newValue = !captureResponses;
    setCaptureResponses(newValue);
  };

  const handleNetworkLogToggle = async () => {
    const newValue = !logNetworkTraffic;
    setLogNetworkTraffic(newValue);
  };

  const handleVisibilityToggle = () => {
    setApiModePanelVisible(!apiModePanelVisible);
  };

  const handleClearToken = () => {
    clearAuthToken();
    logger.info('Auth token cleared');
  };

  if (!apiModePanelVisible) {
    return (
      <button
        onClick={handleVisibilityToggle}
        className="fixed bottom-4 right-0 bg-white p-2 rounded-l-lg shadow-lg border border-r-0 border-gray-200 z-50 hover:bg-gray-50"
        title="Show API Mode Panel"
      >
        <ChevronLeft size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-900">API Mode</h3>
          <button
            onClick={handleVisibilityToggle}
            className="text-gray-400 hover:text-gray-500"
            title="Hide API Mode Panel"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Use Mock Data</span>
            <Switch
              checked={useMockData}
              onChange={handleMockToggle}
              className={`${
                useMockData ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  useMockData ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Capture Responses</span>
            <Switch
              checked={captureResponses}
              onChange={handleCaptureToggle}
              className={`${
                captureResponses ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  captureResponses ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Log Network Traffic</span>
            <Switch
              checked={logNetworkTraffic}
              onChange={handleNetworkLogToggle}
              className={`${
                logNetworkTraffic ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  logNetworkTraffic ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <button
              onClick={handleClearToken}
              className="flex items-center px-3 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <RefreshCw size={14} className="mr-1" />
              Clear Auth Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiModeToggle;
