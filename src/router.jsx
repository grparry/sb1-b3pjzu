import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, Outlet } from 'react-router-dom';
import App from './App';
import InitializationWrapper from './components/InitializationWrapper';

// Configure router with all v7 future flags
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<InitializationWrapper><Outlet /></InitializationWrapper>}>
      <Route path="/*" element={<App />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true
    }
  }
);
