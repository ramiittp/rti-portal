import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Wallet } from 'lucide-react';
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
        <div className="hero-card">
          <div>
            <h1 className="hero-card__title">Application Details</h1>
            <p className="hero-card__text">
              Loading your RTI record, status, and next steps.
            </p>
          </div>
        </div>
        <div className="state-panel">
          <div className="state-panel__title">Fetching application details</div>
          <p className="state-panel__text">This usually takes only a moment.</p>
        </div>
      </Layout>
    );
  }

  if (isError || !data) {
    return (
      <Layout>
        <div className="hero-card">
          <div>
            <h1 className="hero-card__title">Application Details</h1>
            <p className="hero-card__text">
              We could not load this RTI application right now.
            </p>
          </div>
        </div>
        <div className="state-panel state-panel--error">
          <div className="state-panel__title">Application unavailable</div>
          <p className="state-panel__text">
            Please return to your applications list and try opening it again.
          </p>
        </div>
      </Layout>
    );
  }

  const req = data;
  const timeline = req.timeline || [];
  const canAppeal = req.can_appeal;
  const canPay = req.status === 'payment_pending';

  return (
    <Layout>
      <div className="hero-card">
        <div>
          <h1 className="hero-card__title">Application Details</h1>
          <p className="hero-card__text">
            Review the current status, response timeline, and next available
            action for this RTI application.
          </p>
        </div>
        <div className="hero-card__meta">
          <span className="meta-chip">Reference: {req.registration_number || 'Draft'}</span>
          <span className="meta-chip">Status: {req.status}</span>
        </div>
      </div>

      <div className="page-header">
        <div />
        <div className="stack-actions">
          {canAppeal && (
            <Link to={`/applications/${req.id}/appeal`} className="btn btn-primary">
              File Appeal
            </Link>
          )}
          <Link to="/applications" className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to list
          </Link>
        </div>
      </div>

      <div className="detail-grid">
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
                  : '-'}
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
                  : '-'}
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

        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Actions</h2>
          </div>
          <div className="card__body">
            {canPay && (
              <button
                className="btn btn-primary btn-full"
                onClick={() => {
                  alert('Payment flow to be integrated with backend.');
                }}
              >
                <Wallet size={16} />
                Pay Fee Online
              </button>
            )}
            {!canPay && <p className="section-note">No pending fee payment for this application.</p>}

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

            <div className="helper-list">
              <div className="helper-item">
                <strong>What to keep handy</strong>
                <span>
                  Save your registration number and check the timeline regularly for
                  updates, fees, or response notes.
                </span>
              </div>
              <Link to="/track" className="action-link">
                <div>
                  <strong>Track by reference</strong>
                  <span>Open the public status tracker for quick sharing or checks.</span>
                </div>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Information Sought & Response</h2>
        </div>
        <div className="detail-highlight">
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Information Sought</p>
          <pre>{req.information_sought}</pre>

          {req.cpio_response && (
            <>
              <div style={{ height: 1, background: 'var(--color-divider)', margin: '16px 0' }} />
              <p style={{ fontWeight: 700, marginBottom: 6 }}>CPIO Response</p>
              <pre>{req.cpio_response}</pre>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Timeline</h2>
        </div>
        <div className="timeline">
          {!timeline.length && (
            <p className="section-note" style={{ padding: '6px 0 10px' }}>
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
