import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import InitializationWrapper from './components/InitializationWrapper';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

const reactRoot = createRoot(root);

reactRoot.render(
  <React.StrictMode>
    <InitializationWrapper>
      <App />
    </InitializationWrapper>
  </React.StrictMode>
);