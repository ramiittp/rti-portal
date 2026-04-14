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
import AdminHomePage from './pages/admin/AdminHomePage.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx'; // only if you want nested routing later
import AdminRequestsPage from './pages/admin/AdminRequestsPage.jsx';
import AdminRequestDetailPage from './pages/admin/AdminRequestDetailPage.jsx';

// function AdminRoute({ children }) {
//   const { user, initializing } = useAuth();
//   if (initializing) return <div>Loading…</div>;
//   if (!user) return <Navigate to="/login" replace />;
//   if (!user.role || !['admin', 'cpio', 'nodal_officer', 'faa'].includes(user.role)) {
//     return <Navigate to="/dashboard" replace />;
//   }
//   return children;
// }

function AdminRoute({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return <div>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  // TEMP: allow any logged-in user to access admin UI for testing
  return children;
}

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
        <Routes>

          {/* admin routes ... */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminHomePage />
              </AdminRoute>
            }
          />

          {/* later we’ll add /admin/requests etc. */}
          <Route
            path="/admin/requests"
            element={
              <AdminRoute>
                <AdminRequestsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/requests/:id"
            element={
              <AdminRoute>
                <AdminRequestDetailPage />
              </AdminRoute>
            }
          />
        </Routes>
      
      <Toaster position="top-right" />
    </>
  );
}
