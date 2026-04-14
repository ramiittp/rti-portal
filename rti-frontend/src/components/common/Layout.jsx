import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  PlusCircle,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const pageTitleByPath = {
    '/dashboard': 'Citizen Dashboard',
    '/new-rti': 'File a New RTI',
    '/applications': 'Your Applications',
    '/profile': 'Profile & Contact Details',
  };
  const activeTitle = pageTitleByPath[location.pathname] || 'RTI Portal';
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/new-rti', icon: PlusCircle, label: 'New RTI' },
    { to: '/applications', icon: ClipboardList, label: 'My Applications' },
    { to: '/track', icon: Search, label: 'Track Status' },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__topline">
            <Link to="/" className="brand">
              <span className="brand-logo">RTI</span>
              <span className="brand-text">
                <strong>RTI Portal</strong>
                <small>Citizen access to public information</small>
              </span>
            </Link>
            <div className="app-user">
              {user && (
                <>
                  <NavLink to="/profile" className="profile-link">
                    <User size={16} /> {user.name || user.full_name || user.email}
                  </NavLink>
                  <button className="icon-button" onClick={logout} aria-label="Log out">
                    <LogOut size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="app-banner">
            <div className="app-banner__copy">
              <span className="eyebrow">
                <ShieldCheck size={14} /> Citizen Services
              </span>
              <h1 className="app-banner__title">{activeTitle}</h1>
              <p className="app-banner__text">
                File requests, track progress, and keep every document in one place.
              </p>
            </div>
            <div className="app-banner__actions">
              <Link to="/new-rti" className="btn btn-primary">
                Start a Request <ArrowRight size={16} />
              </Link>
              <Link to="/track" className="btn btn-secondary">
                <FileText size={16} /> Track by Reference
              </Link>
            </div>
          </div>

          <nav className="app-nav" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to}>
                  <Icon size={16} /> {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="app-main">
        <div className="app-main__inner">{children}</div>
      </main>
    </div>
  );
}
