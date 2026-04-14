import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import '../citizen/Citizen.css';

export default function AdminRequestDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Local state for forms
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [responseText, setResponseText] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const { data: req, isLoading, isError } = useQuery({
    queryKey: ['admin-request-detail', id],
    queryFn: () => api.get(`/admin/requests/${id}`).then((r) => r.data.data),
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (data) => api.put(`/admin/requests/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-request-detail', id] });
      alert('Status updated successfully!');
    },
  });

  const replyMutation = useMutation({
    mutationFn: (data) => api.put(`/admin/requests/${id}/reply`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-request-detail', id] });
      alert('Response drafted and sent!');
      setResponseText('');
    },
  });

  const noteMutation = useMutation({
    mutationFn: (data) => api.post(`/admin/requests/${id}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-request-detail', id] });
      alert('Internal note added!');
      setInternalNote('');
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <h1 className="page-title">Request Details</h1>
        <p className="page-subtitle">Loading…</p>
      </AdminLayout>
    );
  }

  if (isError || !req) {
    return (
      <AdminLayout>
        <h1 className="page-title">Request Details</h1>
        <p className="page-subtitle" style={{ color: 'var(--color-error)' }}>
          Could not load this RTI request.
        </p>
      </AdminLayout>
    );
  }

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

        {/* Action Panel */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Officer Actions</h2>
          </div>
          <div style={{ padding: '14px 18px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. Status Update */}
            <div style={{ border: '1px solid var(--color-border)', padding: '12px', borderRadius: '6px' }}>
              <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Update Status</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select 
                  className="input" 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Select Status...</option>
                  <option value="under_process">Under Process</option>
                  <option value="rejected">Rejected</option>
                  <option value="transferred">Transferred</option>
                </select>
                <button 
                  className="btn btn-primary"
                  onClick={() => statusMutation.mutate({ status: newStatus, rejection_reason: rejectionReason })}
                  disabled={!newStatus || statusMutation.isPending}
                >
                  Update
                </button>
              </div>
              {newStatus === 'rejected' && (
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Reason for rejection..." 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ width: '100%' }}
                />
              )}
            </div>

            {/* 2. Formal Response */}
            <div style={{ border: '1px solid var(--color-border)', padding: '12px', borderRadius: '6px' }}>
              <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Draft Formal Response</h3>
              <textarea 
                className="input" 
                placeholder="Enter response to be sent to the citizen..."
                style={{ width: '100%', minHeight: '80px', marginBottom: '8px', resize: 'vertical' }}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
              <button 
                className="btn btn-primary"
                onClick={() => replyMutation.mutate({ response_text: responseText })}
                disabled={!responseText || replyMutation.isPending}
              >
                Send Reply
              </button>
            </div>

            {/* 3. Internal Notes */}
            <div style={{ border: '1px solid var(--color-border)', padding: '12px', borderRadius: '6px' }}>
              <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Add Internal Note</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Private note..." 
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  className="btn btn-secondary"
                  onClick={() => noteMutation.mutate({ note_text: internalNote })}
                  disabled={!internalNote || noteMutation.isPending}
                >
                  Save Note
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Request content */}
      <div className="card" style={{ marginTop: '24px' }}>
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
        {req.response_text && (
          <div style={{ padding: '14px 18px', fontSize: 13, borderTop: '1px solid var(--color-border)', backgroundColor: '#f9fafb' }}>
            <h3 style={{ marginBottom: '8px' }}>Sent Response</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7, color: 'var(--color-text)' }}>
              {req.response_text}
            </pre>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card__header">
          <h2 className="card__title">Timeline / Audit Log</h2>
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
            <div className="timeline-item" key={ev.id || idx}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <strong>{ev.action || ev.type}</strong>
                <span>
                  {ev.created_at || ev.at
                    ? new Date(ev.created_at || ev.at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
                {ev.action === 'INTERNAL_NOTE' && ev.new_value?.note && (
                  <span style={{ display: 'block', marginTop: '4px', fontStyle: 'italic', color: '#666' }}>
                    "{(typeof ev.new_value === 'string' ? JSON.parse(ev.new_value) : ev.new_value).note}"
                  </span>
                )}
                {ev.note && <span>{ev.note}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}