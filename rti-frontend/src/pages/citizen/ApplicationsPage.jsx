import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import './Citizen.css';

export default function ApplicationsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['requests-all'],
    queryFn: () => api.get('/requests').then((r) => r.data.data),
  });

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">
            All RTI requests you have filed through this portal
          </p>
        </div>
        <div>
          <Link to="/new-rti" className="btn btn-primary">
            + File New RTI
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Applications</h2>
        </div>
        <div style={{ paddingBottom: 8 }}>
          {isLoading && (
            <p
              style={{
                padding: '12px 16px',
                fontSize: 13,
                color: 'var(--color-text-muted)',
              }}
            >
              Loading your applications…
            </p>
          )}
          {isError && (
            <p
              style={{
                padding: '12px 16px',
                fontSize: 13,
                color: 'var(--color-error)',
              }}
            >
              Failed to load applications. Please try again later.
            </p>
          )}
          {!isLoading && !isError && (!data || data.length === 0) && (
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
          {!isLoading && !isError && data && data.length > 0 && (
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
                {data.map((r) => (
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
                        ? new Date(r.submitted_at).toLocaleDateString(
                            'en-IN',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
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