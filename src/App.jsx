import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import ApiTesting from './pages/ApiTesting';
import TokenTest from './pages/TokenTest';
import useAuth from './hooks/useAuth';
import { useToast } from './components/Toast';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return <Outlet />;
}

function App() {
  const [toast, showToast] = useToast();

  useEffect(() => {
    const handleToast = (event) => {
      showToast(event.detail.message, event.detail.duration);
    };

    window.addEventListener('showToast', handleToast);
    return () => window.removeEventListener('showToast', handleToast);
  }, [showToast]);

  return (
    <>
      <Routes>
        <Route path="signin" element={<SignIn />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/campaigns" replace />} />
            <Route path="campaigns">
              <Route index element={<Campaigns />} />
              <Route path="new" element={<CampaignForm />} />
              <Route path="edit/:id" element={<CampaignForm />} />
            </Route>
            <Route path="cards">
              <Route index element={<Cards />} />
              <Route path="new" element={<CardForm />} />
              <Route path="edit/:id" element={<CardForm />} />
            </Route>
            <Route path="nudges">
              <Route index element={<Nudges />} />
              <Route path="new" element={<NudgeForm />} />
              <Route path="edit/:id" element={<NudgeForm />} />
            </Route>
            <Route path="analytics" element={<Analytics />} />
            <Route path="media">
              <Route index element={<Media />} />
              <Route path="new" element={<MediaPageForm />} />
              <Route path="edit/:id" element={<MediaPageForm />} />
            </Route>
            <Route path="media-folders">
              <Route index element={<MediaFolders />} />
              <Route path=":id" element={<MediaFolderAssets />} />
            </Route>
            <Route path="users">
              <Route index element={<Users />} />
              <Route path="new" element={<UserForm />} />
              <Route path="edit/:id" element={<UserForm />} />
            </Route>
            <Route path="debugging" element={<Debugging />} />
            <Route path="api-testing" element={<ApiTesting />} />
            <Route path="token-test" element={<TokenTest />} />
          </Route>
        </Route>
      </Routes>
      {toast}
    </>
  );
}

export default App;