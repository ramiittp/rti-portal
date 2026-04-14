import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import '../citizen/Citizen.css';

export default function AdminRequestDetailPage() {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-request-detail', id],
    queryFn: () => api.get(`/admin/requests/${id}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <h1 className="page-title">Request Details</h1>
        <p className="page-subtitle">Loading…</p>
      </AdminLayout>
    );
  }

  if (isError || !data) {
    return (
      <AdminLayout>
        <h1 className="page-title">Request Details</h1>
        <p className="page-subtitle" style={{ color: 'var(--color-error)' }}>
          Could not load this RTI request.
        </p>
      </AdminLayout>
    );
  }

  const req = data;
  const timeline = req.timeline || [];

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Request Details</h1>
          <p className="page-subtitle">
            Reg. No: {req.registration_number} · {req.authority_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/admin/requests" className="btn btn-secondary">
            ← Back to list
          </Link>
        </div>
      </div>

      <div className="detail-grid">
        {/* Summary */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Summary</h2>
          </div>
          <div className="detail-list">
            <div className="detail-row">
              <span>Status</span>
              <StatusBadge status={req.status} />
            </div>
            <div className="detail-row">
              <span>Citizen</span>
              <strong>
                {req.citizen_name || '—'} ({req.citizen_email})
              </strong>
            </div>
            <div className="detail-row">
              <span>Subject</span>
              <strong>{req.subject}</strong>
            </div>
            <div className="detail-row">
              <span>Received</span>
              <strong>
                {req.submitted_at
                  ? new Date(req.submitted_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </strong>
            </div>
            <div className="detail-row">
              <span>Due By</span>
              <strong>
                {req.deadline_date
                  ? new Date(req.deadline_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* Placeholder actions (response form later) */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Officer Actions</h2>
          </div>
          <div style={{ padding: '14px 18px', fontSize: 13 }}>
            <p style={{ marginBottom: 8 }}>
              Here you will later add:
            </p>
            <ul>
              <li>Change status (under process, answered, rejected).</li>
              <li>Record CPIO response text and attach documents.</li>
              <li>Transfer request to another authority / CPIO.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Request content */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Information Sought</h2>
        </div>
        <div style={{ padding: '14px 18px', fontSize: 13 }}>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              lineHeight: 1.7,
            }}
          >
            {req.information_sought}
          </pre>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Timeline</h2>
        </div>
        <div className="timeline">
          {!timeline.length && (
            <p
              style={{
                padding: '6px 0 10px',
                fontSize: 13,
                color: 'var(--color-text-muted)',
              }}
            >
              No timeline events recorded yet.
            </p>
          )}
          {timeline.map((ev, idx) => (
            <div className="timeline-item" key={idx}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <strong>{ev.type}</strong>
                <span>
                  {ev.at
                    ? new Date(ev.at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
                {ev.note && <span>{ev.note}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}