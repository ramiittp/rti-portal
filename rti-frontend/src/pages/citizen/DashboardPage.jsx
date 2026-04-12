import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview of your RTI applications and appeals
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--info">
          <CalendarDays size={24} />
          <div>
            <span className="stat-card__value">
              {summary?.total_requests ?? '–'}
            </span>
            <span className="stat-card__label">Total Applications</span>
          </div>
        </div>
        <div className="stat-card stat-card--success">
          <CheckCircle2 size={24} />
          <div>
            <span className="stat-card__value">
              {summary?.answered ?? '–'}
            </span>
            <span className="stat-card__label">Answered</span>
          </div>
        </div>
        <div className="stat-card stat-card--warning">
          <Clock3 size={24} />
          <div>
            <span className="stat-card__value">
              {summary?.pending ?? '–'}
            </span>
            <span className="stat-card__label">Pending</span>
          </div>
        </div>
        <div className="stat-card stat-card--error">
          <AlertTriangle size={24} />
          <div>
            <span className="stat-card__value">
              {summary?.appeals ?? '–'}
            </span>
            <span className="stat-card__label">Appeals Filed</span>
          </div>
        </div>
      </div>

      {/* Recent applications */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Recent Applications</h2>
        </div>
        <div style={{ paddingBottom: 8 }}>
          {!recent?.length && (
            <p
              style={{
                padding: '12px 16px',
                fontSize: 13,
                color: 'var(--color-text-muted)',
              }}
            >
              You have not filed any RTI applications yet.
            </p>
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
                        : '—'}
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