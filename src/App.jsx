import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import Campaigns from './pages/Campaigns';
import CampaignForm from './pages/CampaignForm';
import Cards from './pages/Cards';
import CardForm from './pages/CardForm';
import Nudges from './pages/Nudges';
import NudgeForm from './pages/NudgeForm';
import Analytics from './pages/Analytics';
import Media from './pages/Media';
import MediaPageForm from './pages/MediaPageForm';
import MediaFolders from './pages/MediaFolders';
import MediaFolderAssets from './pages/MediaFolderAssets';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import Debugging from './pages/Debugging';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/campaigns" replace />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaigns/new" element={<CampaignForm />} />
          <Route path="campaigns/edit/:id" element={<CampaignForm />} />
          <Route path="cards" element={<Cards />} />
          <Route path="cards/new" element={<CardForm />} />
          <Route path="cards/edit/:id" element={<CardForm />} />
          <Route path="nudges" element={<Nudges />} />
          <Route path="nudges/new" element={<NudgeForm />} />
          <Route path="nudges/edit/:id" element={<NudgeForm />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="media" element={<Media />} />
          <Route path="media/new" element={<MediaPageForm />} />
          <Route path="media/edit/:id" element={<MediaPageForm />} />
          <Route path="media-folders" element={<MediaFolders />} />
          <Route path="media-folders/:id" element={<MediaFolderAssets />} />
          <Route path="users" element={<Users />} />
          <Route path="users/new" element={<UserForm />} />
          <Route path="users/edit/:id" element={<UserForm />} />
          <Route path="debugging" element={<Debugging />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;