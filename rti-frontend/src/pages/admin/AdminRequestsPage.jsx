import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import '../citizen/Citizen.css';

export default function AdminRequestsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: () =>
      api.get('/admin/requests').then((r) => r.data.data),
  });

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Requests</h1>
          <p className="page-subtitle">
            RTI applications currently assigned to you as an officer
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Requests</h2>
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
              Loading assigned requests…
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
              Failed to load requests. Please try again later.
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
              You do not have any assigned RTI requests at the moment.
            </p>
          )}
          {!isLoading && !isError && data && data.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reg. No.</th>
                  <th>Subject</th>
                  <th>Citizen</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Due By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code className="reg-no">
                        {r.registration_number}
                      </code>
                    </td>
                    <td className="subject-cell">{r.subject}</td>
                    <td className="muted-cell">
                      {r.citizen_name || r.citizen_email}
                    </td>
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
                    <td className="muted-cell">
                      {r.deadline_date
                        ? new Date(r.deadline_date).toLocaleDateString(
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
                      <Link
                        to={`/admin/requests/${r.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}