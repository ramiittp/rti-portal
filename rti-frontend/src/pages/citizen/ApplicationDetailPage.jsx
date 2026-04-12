import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import './Citizen.css';

export default function ApplicationDetailPage() {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['request-detail', id],
    queryFn: () => api.get(`/requests/${id}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="page-header">
          <h1 className="page-title">Application Details</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      </Layout>
    );
  }

  if (isError || !data) {
    return (
      <Layout>
        <div className="page-header">
          <h1 className="page-title">Application Details</h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-error)' }}>
          Could not load this application.
        </p>
      </Layout>
    );
  }

  const req = data;
  const timeline = req.timeline || []; // backend can provide an array of events
  const canAppeal = req.can_appeal;
  const canPay = req.status === 'payment_pending';

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Application Details</h1>
          <p className="page-subtitle">
            Registration No: {req.registration_number}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canAppeal && (
            <Link to={`/applications/${req.id}/appeal`} className="btn btn-primary">
              File Appeal
            </Link>
          )}
          <Link to="/applications" className="btn btn-secondary">
            ← Back to list
          </Link>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left: details */}
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
              <span>Authority</span>
              <strong>{req.authority_name}</strong>
            </div>
            <div className="detail-row">
              <span>Subject</span>
              <strong>{req.subject}</strong>
            </div>
            <div className="detail-row">
              <span>Submitted</span>
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
              <span>Deadline</span>
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
            <div className="detail-row">
              <span>Fee</span>
              <strong>
                {req.is_bpl
                  ? 'Waived (BPL)'
                  : req.fee_status === 'paid'
                  ? 'Paid'
                  : 'Not paid'}
              </strong>
            </div>
          </div>
        </div>

        {/* Right: actions / info */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Actions</h2>
          </div>
          <div style={{ padding: '12px 16px 16px' }}>
            {canPay && (
              <button
                className="btn btn-primary btn-full"
                onClick={() => {
                  // later: integrate payment flow
                  alert('Payment flow to be integrated with backend.');
                }}
              >
                Pay Fee Online
              </button>
            )}
            {!canPay && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-muted)',
                  marginBottom: 8,
                }}
              >
                No pending fee payment for this application.
              </p>
            )}
            {canAppeal && (
              <div className="info-box info-box--warning" style={{ marginTop: 10 }}>
                You can file an appeal if the response is delayed or unsatisfactory.
              </div>
            )}
            {!canAppeal && (
              <div className="info-box info-box--info" style={{ marginTop: 10 }}>
                Appeal is not currently available for this application.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Information sought and responses */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Information Sought & Response</h2>
        </div>
        <div style={{ padding: '14px 18px 18px', fontSize: 13 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Information Sought</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              lineHeight: 1.7,
            }}
          >
            {req.information_sought}
          </pre>

          {req.cpio_response && (
            <>
              <hr
                style={{
                  border: 'none',
                  borderTop: '1px solid var(--color-divider)',
                  margin: '14px 0',
                }}
              />
              <p style={{ fontWeight: 600, marginBottom: 6 }}>CPIO Response</p>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  lineHeight: 1.7,
                }}
              >
                {req.cpio_response}
              </pre>
            </>
          )}
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
    </Layout>
  );
}