import React from 'react';
import { Switch } from '@headlessui/react';
import useConfigStore from '../services/config';

function ApiModeToggle() {
  const { useMockData, setUseMockData, captureResponses, setCaptureResponses, logNetworkTraffic, setLogNetworkTraffic } = useConfigStore();

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

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={useMockData}
            onChange={handleMockToggle}
            className={`${
              useMockData ? 'bg-sky-500' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                useMockData ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
          <span className="text-sm font-medium text-gray-700">
            Use Mock Data
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={captureResponses}
            onChange={handleCaptureToggle}
            className={`${
              captureResponses ? 'bg-sky-500' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                captureResponses ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
          <span className="text-sm font-medium text-gray-700">
            Capture API Responses
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={logNetworkTraffic}
            onChange={handleNetworkLogToggle}
            className={`${
              logNetworkTraffic ? 'bg-sky-500' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                logNetworkTraffic ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
          <span className="text-sm font-medium text-gray-700">
            Log Network Traffic
          </span>
        </div>
      </div>
    </div>
  );
}

export default ApiModeToggle;
