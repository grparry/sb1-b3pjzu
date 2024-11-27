import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import useAppStore from '../stores/appStore';
import { initializeApp } from '../utils/initialization';

function InitializationWrapper({ children }) {
  const { isInitialized, isInitializing, error } = useAppStore();

  useEffect(() => {
    if (!isInitialized && isInitializing) {
      initializeApp();
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
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (isInitializing) {
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