import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import useAppStore from '../stores/appStore';
import { InitializationManager } from '../utils/initialization/InitializationManager';
import { Logger } from '../utils/logging/Logger';

function InitializationWrapper({ children }) {
  const { isInitialized, isInitializing, error } = useAppStore();

  useEffect(() => {
    const initManager = InitializationManager.getInstance();
    
    // Only initialize if not already initialized or initializing
    if (!isInitialized && !isInitializing && !initManager.isInitialized()) {
      InitializationManager.getInstance()
        .initialize()
        .catch(error => {
          Logger.error('InitWrapper', 'Failed to initialize application', error);
        });
    }
  }, [isInitialized, isInitializing]);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">Initialization Error</h1>
          <p className="text-gray-600 mb-4">
            The application failed to initialize properly. Please try refreshing the page.
          </p>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
            {error.message || String(error)}
          </pre>
        </div>
      </div>
    );
  }

  if (!isInitialized || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return children;
}

InitializationWrapper.propTypes = {
  children: PropTypes.node.isRequired
};

export default InitializationWrapper;