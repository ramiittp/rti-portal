import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Files, Search } from 'lucide-react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import './Citizen.css';

export default function ApplicationsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['requests-all'],
    queryFn: () => api.get('/requests').then((r) => r.data.data),
  });

  const applications = data || [];
  const pendingCount = applications.filter((item) =>
    ['submitted', 'under_review', 'payment_pending'].includes(item.status)
  ).length;
  const appealCount = applications.filter((item) => item.can_appeal).length;

  return (
    <Layout>
      <div className="hero-card">
        <div>
          <h1 className="hero-card__title">My Applications</h1>
          <p className="hero-card__text">
            View every RTI request you have filed, open a case quickly, and
            continue the next required action without hunting through tables.
          </p>
        </div>
        <div className="hero-card__meta">
          <span className="meta-chip">Total filed: {applications.length}</span>
          <span className="meta-chip">Need follow-up: {pendingCount}</span>
          <span className="meta-chip">Appeal eligible: {appealCount}</span>
          <Link to="/new-rti" className="btn btn-primary">
            File New RTI <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {!isLoading && !isError && applications.length > 0 && (
        <div className="summary-strip">
          <div className="summary-pill">
            <strong>{applications.length}</strong>
            <span>Total requests in your account</span>
          </div>
          <div className="summary-pill">
            <strong>{pendingCount}</strong>
            <span>Applications that still need monitoring</span>
          </div>
          <div className="summary-pill">
            <strong>{appealCount}</strong>
            <span>Cases currently open for appeal action</span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Applications</h2>
          <Link to="/track" className="btn btn-secondary">
            <Search size={16} /> Track by reference
          </Link>
        </div>
        <div className="card__body" style={{ paddingTop: 0 }}>
          {isLoading && (
            <div className="state-panel">
              <div className="state-panel__title">Loading your applications</div>
              <p className="state-panel__text">
                We are bringing in your latest filings, statuses, and next actions.
              </p>
            </div>
          )}

          {isError && (
            <div className="state-panel state-panel--error">
              <div className="state-panel__title">Could not load applications</div>
              <p className="state-panel__text">
                Please refresh the page or try again in a moment.
              </p>
            </div>
          )}

          {!isLoading && !isError && applications.length === 0 && (
            <div className="state-panel">
              <div className="state-panel__title">No applications yet</div>
              <p className="state-panel__text">
                Start your first RTI request and it will appear here with tracking,
                deadlines, and follow-up actions.
              </p>
              <div className="public-actions">
                <Link to="/new-rti" className="btn btn-primary">
                  <Files size={16} /> Start first RTI
                </Link>
              </div>
            </div>
          )}

          {!isLoading && !isError && applications.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reg. No.</th>
                  <th>Subject</th>
                  <th>Authority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code className="reg-no">{r.registration_number}</code>
                    </td>
                    <td className="subject-cell">
                      <Link to={`/applications/${r.id}`}>{r.subject}</Link>
                    </td>
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
                    <td>
                      <div className="stack-actions">
                        <Link
                          to={`/applications/${r.id}`}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          View
                        </Link>
                        {r.can_appeal && (
                          <Link
                            to={`/applications/${r.id}/appeal`}
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                          >
                            Appeal
                          </Link>
                        )}
                      </div>
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
