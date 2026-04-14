import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import NewRTIPage from './pages/citizen/NewRTI.jsx';
import AppealPage from './pages/citizen/AppealPage.jsx';
import PublicTrackPage from './pages/citizen/PublicTrackPage.jsx';
import ProfilePage from './pages/citizen/ProfilePage.jsx';
import CitizenLoginPage from './pages/auth/CitizenLoginPage.jsx';
import DashboardPage from './pages/citizen/DashboardPage.jsx';
import ApplicationsPage from './pages/citizen/ApplicationsPage.jsx';
import ApplicationDetailPage from './pages/citizen/ApplicationDetailPage.jsx';

function PrivateRoute({ children }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="public-shell">
        <div className="status-panel">
          <span className="eyebrow">Preparing Portal</span>
          <h1>Loading your citizen workspace</h1>
          <p>We are checking your session and getting your dashboard ready.</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<PublicTrackPage />} />
        <Route path="/track" element={<PublicTrackPage />} />
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
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<CitizenLoginPage />} />
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
