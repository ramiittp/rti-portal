import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, FileText, BarChart3, Inbox } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: '#111827',
          color: '#e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 12px',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              A
            </span>
            RTI Admin
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            {user?.role?.toUpperCase() || 'ADMIN'}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <NavLink
            to="/admin"
            end
            style={({ isActive }) => ({
              padding: '8px 10px',
              borderRadius: 999,
              fontSize: 13,
              textDecoration: 'none',
              color: isActive ? '#111827' : '#e5e7eb',
              background: isActive ? '#10b981' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            })}
          >
            <Inbox size={16} /> Inbox
          </NavLink>
          <NavLink
            to="/admin/requests"
            style={({ isActive }) => ({
              padding: '8px 10px',
              borderRadius: 999,
              fontSize: 13,
              textDecoration: 'none',
              color: isActive ? '#111827' : '#e5e7eb',
              background: isActive ? '#10b981' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            })}
          >
            <FileText size={16} /> Requests
          </NavLink>
          <NavLink
            to="/admin/appeals"
            style={({ isActive }) => ({
              padding: '8px 10px',
              borderRadius: 999,
              fontSize: 13,
              textDecoration: 'none',
              color: isActive ? '#111827' : '#e5e7eb',
              background: isActive ? '#10b981' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            })}
          >
            <FileText size={16} /> Appeals
          </NavLink>
          <NavLink
            to="/admin/analytics"
            style={({ isActive }) => ({
              padding: '8px 10px',
              borderRadius: 999,
              fontSize: 13,
              textDecoration: 'none',
              color: isActive ? '#111827' : '#e5e7eb',
              background: isActive ? '#10b981' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            })}
          >
            <BarChart3 size={16} /> Analytics
          </NavLink>
        </nav>

        <div style={{ flex: 1 }} />

        <button
          onClick={logout}
          style={{
            marginTop: 12,
            padding: '6px 10px',
            borderRadius: 999,
            border: 'none',
            background: '#1f2937',
            color: '#e5e7eb',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main area */}
      <main
        style={{
          flex: 1,
          background: 'var(--color-bg)',
          padding: '20px 24px',
        }}
      >
        {children}
      </main>
    </div>
  );
}