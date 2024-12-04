import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './index.css';
import { InitializationManager } from './utils/initialization/InitializationManager';
import { Logger } from './utils/logging/Logger';

// Initialize the app using the initialization manager
InitializationManager.getInstance()
  .initialize()
  .catch(error => {
    Logger.error('Main', 'Failed to initialize application', error);
  });

const container = document.getElementById('root');
const root = createRoot(container);

// Render with RouterProvider
root.render(
  <React.StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </React.StrictMode>
);