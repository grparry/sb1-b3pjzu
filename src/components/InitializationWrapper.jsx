import React from 'react';
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { InitializationManager } from '../utils/initialization/InitializationManager';
import { logger } from '../services/utils/logging';
import useAppStore from '../stores/appStore';

const InitializationWrapper = ({ children }) => {
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const { isInitialized, error } = useAppStore();

  useEffect(() => {
    const initManager = InitializationManager.getInstance();

    const initialize = async () => {
      // Prevent multiple initialization attempts
      if (isInitialized || initializingRef.current) {
        return;
      }

      initializingRef.current = true;
      logger.info('Starting initialization');
      
      try {
        await initManager.initialize();
        logger.info('Initialization complete');
      } catch (error) {
        logger.error('Failed to initialize application', error);
      } finally {
        initializingRef.current = false;
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
    };
  }, [isInitialized]);

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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return children;
};

InitializationWrapper.propTypes = {
  children: PropTypes.node.isRequired
};

export default InitializationWrapper;