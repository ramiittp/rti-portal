import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, PlusCircle, User, FileText, Home } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-logo">RTI</span>
          <span className="brand-text">
            <strong>RTI Portal</strong>
            <small>Quality-driven citizen interface</small>
          </span>
        </Link>
        <nav className="app-nav">
          <NavLink to="/dashboard">
            <Home size={16} /> Dashboard
          </NavLink>
          <NavLink to="/new-rti">
            <PlusCircle size={16} /> New RTI
          </NavLink>
          <NavLink to="/applications">
            <FileText size={16} /> My Applications
          </NavLink>
        </nav>
        <div className="app-user">
          {user && (
            <>
              <NavLink to="/profile" className="profile-link">
                <User size={16} /> {user.full_name || user.email}
              </NavLink>
              <button className="icon-button" onClick={logout}>
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}