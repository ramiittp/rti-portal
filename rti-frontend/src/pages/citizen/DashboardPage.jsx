import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import './Citizen.css';

export default function DashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ['requests-summary'],
    queryFn: () => api.get('/requests/summary').then((r) => r.data.data),
  });

  const { data: recent } = useQuery({
    queryKey: ['requests-recent'],
    queryFn: () => api.get('/requests?limit=5').then((r) => r.data.data),
  });

  return (
    <Layout>
      <div className="hero-card">
        <div>
          <h1 className="hero-card__title">Dashboard</h1>
          <p className="hero-card__text">
            Review your filing activity, monitor pending deadlines, and jump
            back into active requests from one place.
          </p>
        </div>
        <div className="hero-card__meta">
          <span className="meta-chip">Need action: {summary?.pending ?? 0} pending</span>
          <span className="meta-chip">Answered: {summary?.answered ?? 0}</span>
          <span className="meta-chip">Appeals filed: {summary?.appeals ?? 0}</span>
          <div className="hero-card__actions">
            <Link to="/new-rti" className="btn btn-primary">
              File New RTI <ArrowRight size={16} />
            </Link>
            <Link to="/applications" className="btn btn-secondary">
              View all applications
            </Link>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card--info">
          <CalendarDays size={24} />
          <div>
            <span className="stat-card__value">{summary?.total_requests ?? '-'}</span>
            <span className="stat-card__label">Total Applications</span>
          </div>
        </div>
        <div className="stat-card stat-card--success">
          <CheckCircle2 size={24} />
          <div>
            <span className="stat-card__value">{summary?.answered ?? '-'}</span>
            <span className="stat-card__label">Answered</span>
          </div>
        </div>
        <div className="stat-card stat-card--warning">
          <Clock3 size={24} />
          <div>
            <span className="stat-card__value">{summary?.pending ?? '-'}</span>
            <span className="stat-card__label">Pending</span>
          </div>
        </div>
        <div className="stat-card stat-card--error">
          <AlertTriangle size={24} />
          <div>
            <span className="stat-card__value">{summary?.appeals ?? '-'}</span>
            <span className="stat-card__label">Appeals Filed</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Recent Applications</h2>
          <Link to="/applications" className="btn btn-secondary">
            Open history
          </Link>
        </div>
        <div className="card__body" style={{ paddingTop: 0 }}>
          {!recent?.length && (
            <p className="empty-state">You have not filed any RTI applications yet.</p>
          )}
          {recent?.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reg. No.</th>
                  <th>Subject</th>
                  <th>Authority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code className="reg-no">{r.registration_number}</code>
                    </td>
                    <td className="subject-cell">{r.subject}</td>
                    <td className="muted-cell">{r.authority_name}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="muted-cell">
                      {r.submitted_at
                        ? new Date(r.submitted_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
