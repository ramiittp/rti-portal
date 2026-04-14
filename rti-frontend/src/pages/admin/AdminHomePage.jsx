import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminHomePage() {
  return (
    <AdminLayout>
      <h1 className="page-title">Admin Inbox</h1>
      <p className="page-subtitle">
        Welcome to the RTI officer dashboard. Use the sidebar to manage requests
        and appeals.
      </p>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card__header">
          <h2 className="card__title">Getting started</h2>
        </div>
        <div style={{ padding: '14px 18px', fontSize: 13 }}>
          <ul>
            <li>Go to “Requests” to see RTI applications assigned to you.</li>
            <li>Use “Appeals” to view and act on RTI appeals.</li>
            <li>“Analytics” will later show response performance and trends.</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}