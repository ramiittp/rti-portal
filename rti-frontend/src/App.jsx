import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import NewRTIPage from './pages/citizen/NewRTI.jsx';
import AppealPage from './pages/citizen/AppealPage.jsx';
import TrackPage from './pages/citizen/TrackPage.jsx';
import ProfilePage from './pages/citizen/ProfilePage.jsx';
// TODO: add Dashboard, ApplicationsList, Login, etc.
import LoginPage from './pages/auth/LoginPage.jsx';
import DashboardPage from './pages/citizen/DashboardPage.jsx';
import ApplicationsPage from './pages/citizen/ApplicationsPage.jsx';
import ApplicationDetailPage from './pages/citizen/ApplicationDetailPage.jsx';

function PrivateRoute({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return <div>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<TrackPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route
          path="/new-rti"
          element={
            <PrivateRoute>
              <NewRTIPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/applications/:id/appeal"
          element={
            <PrivateRoute>
              <AppealPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        {/* placeholders until you add them */}
        {/* <Route path="/dashboard" element={<div>Dashboard TODO</div>} /> */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        {/* <Route path="/applications" element={<div>Applications TODO</div>} /> */}
        {/* <Route path="/login" element={<div>Login TODO (OTP)</div>} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/applications"
          element={
            <PrivateRoute>
              <ApplicationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <PrivateRoute>
              <ApplicationDetailPage />
            </PrivateRoute>
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}