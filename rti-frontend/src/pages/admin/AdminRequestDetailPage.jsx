import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import '../citizen/Citizen.css';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

const ACTION_LABELS = {
  CREATE_DRAFT:           'Draft Created',
  SUBMIT:                 'Submitted',
  ASSIGN_CPIO:            'Assigned to CPIO',
  TRANSFER:               'Transferred',
  REPLY:                  'Response Sent',
  ADDITIONAL_FEE_RAISED:  'Additional Fee Raised',
  INTERNAL_NOTE:          'Internal Note',
  STATUS_CHANGE:          'Status Changed',
};

// ── small reusable panel ─────────────────────────────────────────────────────
function ActionPanel({ title, children }) {
  return (
    <div style={{
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        background: 'var(--color-bg-subtle, #f8fafc)',
        borderBottom: '1px solid var(--color-border)',
        fontWeight: 600,
        fontSize: 13,
      }}>
        {title}
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

// ── toast helper ─────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

// ── main component ────────────────────────────────────────────────────────────
export default function AdminRequestDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast, show } = useToast();

  // form state
  const [selectedCpio, setSelectedCpio]   = useState('');
  const [newStatus, setNewStatus]         = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [responseText, setResponseText]   = useState('');
  const [internalNote, setInternalNote]   = useState('');
  const [toAuthority, setToAuthority]     = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [feeAmount, setFeeAmount]         = useState('');
  const [feeReason, setFeeReason]         = useState('');
  const [feeDeadline, setFeeDeadline]     = useState('');
  const [extDeadline, setExtDeadline]     = useState('');
  const [extReason, setExtReason]         = useState('');

  // ── data queries ─────────────────────────────────────────────────────────
  const { data: req, isLoading, isError } = useQuery({
    queryKey: ['admin-request-detail', id],
    queryFn: () => api.get(`/admin/requests/${id}`).then((r) => r.data.data),
  });

  const { data: cpios = [] } = useQuery({
    queryKey: ['admin-cpios', req?.authority_id],
    queryFn: () =>
      api.get(`/admin/cpios${req?.authority_id ? `?authority_id=${req.authority_id}` : ''}`)
         .then((r) => r.data.data),
    enabled: !!req,
  });

  const { data: authorities = [] } = useQuery({
    queryKey: ['admin-authorities'],
    queryFn: () => api.get('/admin/authorities').then((r) => r.data.data),
    enabled: !!req,
  });

  // ── mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-request-detail', id] });

  const assignMutation = useMutation({
    mutationFn: (d) => api.put(`/admin/requests/${id}/assign`, d),
    onSuccess: () => { invalidate(); show('CPIO assigned successfully'); setSelectedCpio(''); },
    onError: (e) => show(e.response?.data?.message || 'Failed to assign CPIO', 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: (d) => api.put(`/admin/requests/${id}/status`, d),
    onSuccess: () => { invalidate(); show('Status updated'); setNewStatus(''); setRejectionReason(''); },
    onError: (e) => show(e.response?.data?.message || 'Failed to update status', 'error'),
  });

  const replyMutation = useMutation({
    mutationFn: (d) => api.put(`/admin/requests/${id}/reply`, d),
    onSuccess: () => { invalidate(); show('Response sent to citizen'); setResponseText(''); },
    onError: (e) => show(e.response?.data?.message || 'Failed to send response', 'error'),
  });

  const noteMutation = useMutation({
    mutationFn: (d) => api.post(`/admin/requests/${id}/notes`, d),
    onSuccess: () => { invalidate(); show('Internal note saved'); setInternalNote(''); },
    onError: (e) => show(e.response?.data?.message || 'Failed to save note', 'error'),
  });

  const transferMutation = useMutation({
    mutationFn: (d) => api.put(`/admin/requests/${id}/transfer`, d),
    onSuccess: () => { invalidate(); show('Request transferred'); setToAuthority(''); setTransferReason(''); },
    onError: (e) => show(e.response?.data?.message || 'Failed to transfer', 'error'),
  });

  const feeMutation = useMutation({
    mutationFn: (d) => api.post(`/admin/requests/${id}/additional-fee`, d),
    onSuccess: () => { invalidate(); show('Additional fee request raised'); setFeeAmount(''); setFeeReason(''); setFeeDeadline(''); },
    onError: (e) => show(e.response?.data?.message || 'Failed to raise fee', 'error'),
  });

  const deadlineMutation = useMutation({
    mutationFn: (d) => api.put(`/admin/requests/${id}/deadline`, d),
    onSuccess: () => { invalidate(); show('Deadline extended'); setExtDeadline(''); setExtReason(''); },
    onError: (e) => show(e.response?.data?.message || 'Failed to update deadline', 'error'),
  });

  // ── loading / error states ────────────────────────────────────────────────
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
  const attachments = req.attachments || [];
  const payments = req.payments || [];

  // deadline countdown
  const effectiveDeadline = req.extended_deadline || req.deadline_date;
  const daysLeft = effectiveDeadline
    ? Math.ceil((new Date(effectiveDeadline) - Date.now()) / 86400000)
    : null;

  return (
    <AdminLayout>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: toast.type === 'error' ? '#b91c1c' : '#166534',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">RTI Request</h1>
          <p className="page-subtitle">
            {req.registration_number || 'Draft'} · {req.authority_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge status={req.status} />
          <Link to="/admin/requests" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      {/* ── Top 3-column info grid ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Citizen info */}
        <div className="card">
          <div className="card__header"><h2 className="card__title">Citizen</h2></div>
          <div className="detail-list">
            <div className="detail-row"><span>Name</span><strong>{req.citizen_name || '—'}</strong></div>
            <div className="detail-row"><span>Email</span><strong style={{ wordBreak: 'break-all' }}>{req.citizen_email || '—'}</strong></div>
            <div className="detail-row"><span>BPL</span><strong>{req.is_bpl ? 'Yes (Waived)' : 'No'}</strong></div>
            <div className="detail-row"><span>Fee</span><strong>₹{req.fee_amount || '10'}</strong></div>
          </div>
        </div>

        {/* Request details */}
        <div className="card">
          <div className="card__header"><h2 className="card__title">Request Details</h2></div>
          <div className="detail-list">
            <div className="detail-row"><span>Submitted</span><strong>{fmtDate(req.submitted_at)}</strong></div>
            <div className="detail-row"><span>Deadline</span>
              <strong style={{ color: daysLeft !== null && daysLeft <= 5 ? 'var(--color-error)' : undefined }}>
                {fmtDate(effectiveDeadline)}
                {daysLeft !== null && (
                  <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400 }}>
                    ({daysLeft > 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d overdue`})
                  </span>
                )}
              </strong>
            </div>
            {req.extended_deadline && (
              <div className="detail-row"><span>Extended</span><strong>{fmtDate(req.extended_deadline)}</strong></div>
            )}
            <div className="detail-row"><span>Transfers</span><strong>{req.transfer_count ?? 0} / 1 allowed</strong></div>
            <div className="detail-row"><span>Language</span><strong>{req.language?.toUpperCase() || 'EN'}</strong></div>
          </div>
        </div>

        {/* Authority & CPIO */}
        <div className="card">
          <div className="card__header"><h2 className="card__title">Authority</h2></div>
          <div className="detail-list">
            <div className="detail-row"><span>Authority</span><strong>{req.authority_name}</strong></div>
            <div className="detail-row"><span>City</span><strong>{req.city || '—'}</strong></div>
            <div className="detail-row"><span>CPIO</span><strong>{req.cpio_name || '—'}</strong></div>
            <div className="detail-row"><span>CPIO Email</span><strong style={{ wordBreak: 'break-all' }}>{req.cpio_email || '—'}</strong></div>
            {req.assigned_cpio_id && (
              <div className="detail-row"><span>Assigned</span><strong style={{ color: 'var(--color-success)' }}>✓ Yes</strong></div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main two-column layout ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>

        {/* LEFT: Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Information Sought */}
          <div className="card">
            <div className="card__header"><h2 className="card__title">Information Sought</h2></div>
            <div style={{ padding: '14px 18px' }}>
              {req.description && (
                <>
                  <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Description</p>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7, fontSize: 13, marginBottom: 16 }}>
                    {req.description}
                  </pre>
                </>
              )}
              <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Information Sought</p>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7, fontSize: 13 }}>
                {req.information_sought}
              </pre>
              {req.period_from && (
                <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Period: {fmtDate(req.period_from)} – {fmtDate(req.period_to)}
                </p>
              )}
            </div>

            {/* Sent Response */}
            {req.response_text && (
              <div style={{
                padding: '14px 18px', fontSize: 13,
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg-subtle, #f0fdf4)',
              }}>
                <p style={{ fontWeight: 700, marginBottom: 6, color: '#166534' }}>
                  ✓ CPIO Response — {fmtDate(req.response_date)}
                </p>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7 }}>
                  {req.response_text}
                </pre>
              </div>
            )}

            {/* Rejection reason */}
            {req.rejection_reason && (
              <div style={{
                padding: '14px 18px', fontSize: 13,
                borderTop: '1px solid var(--color-border)',
                background: '#fef2f2',
              }}>
                <p style={{ fontWeight: 700, marginBottom: 4, color: '#b91c1c' }}>Rejection Reason</p>
                <p>{req.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="card">
              <div className="card__header"><h2 className="card__title">Attachments ({attachments.length})</h2></div>
              <div style={{ padding: '8px 0' }}>
                {attachments.map((a) => (
                  <div key={a.id} style={{
                    padding: '8px 18px', fontSize: 13,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    <div>
                      <strong>{a.file_name}</strong>
                      <span style={{ marginLeft: 8, color: 'var(--color-text-muted)', fontSize: 12 }}>
                        {(a.file_size / 1024).toFixed(1)} KB · {a.mime_type}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {a.is_response_doc ? '📤 Response doc' : '📎 Citizen upload'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <div className="card">
              <div className="card__header"><h2 className="card__title">Payments</h2></div>
              <div style={{ padding: '8px 0' }}>
                {payments.map((p) => (
                  <div key={p.id} style={{
                    padding: '8px 18px', fontSize: 13,
                    display: 'flex', justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    <span>₹{p.amount} via {p.mode || '—'}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11,
                      background: p.status === 'success' ? '#dcfce7' : '#fef9c3',
                      color: p.status === 'success' ? '#166534' : '#854d0e',
                    }}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <div className="card__header"><h2 className="card__title">Audit Timeline</h2></div>
            <div className="timeline" style={{ padding: '12px 18px' }}>
              {!timeline.length && (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '4px 0' }}>
                  No events recorded yet.
                </p>
              )}
              {timeline.map((ev, idx) => {
                const noteVal = ev.new_value
                  ? (typeof ev.new_value === 'string' ? JSON.parse(ev.new_value) : ev.new_value)
                  : null;
                return (
                  <div className="timeline-item" key={ev.id || idx}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <strong>{ACTION_LABELS[ev.action] || ev.action}</strong>
                      <span>{fmtDateTime(ev.created_at)}</span>
                      {ev.action === 'INTERNAL_NOTE' && noteVal?.note && (
                        <span style={{ display: 'block', fontStyle: 'italic', color: '#555', marginTop: 2 }}>
                          "{noteVal.note}"
                        </span>
                      )}
                      {ev.action === 'TRANSFER' && noteVal?.reason && (
                        <span style={{ display: 'block', fontSize: 12, color: '#555', marginTop: 2 }}>
                          Reason: {noteVal.reason}
                        </span>
                      )}
                      {ev.action === 'ADDITIONAL_FEE_RAISED' && noteVal && (
                        <span style={{ display: 'block', fontSize: 12, color: '#555', marginTop: 2 }}>
                          ₹{noteVal.amount} — {noteVal.reason}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Action Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 1. Assign CPIO (Nodal Officer) */}
          <ActionPanel title="🔹 Step 1 · Assign to CPIO">
            {req.assigned_cpio_id
              ? <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Already assigned. Re-assign if needed.
                </p>
              : null}
            <select
              className="input"
              value={selectedCpio}
              onChange={(e) => setSelectedCpio(e.target.value)}
              style={{ fontSize: 13 }}
            >
              <option value="">Select CPIO…</option>
              {cpios.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
              ))}
            </select>
            {cpios.length === 0 && (
              <p style={{ fontSize: 12, color: 'orange' }}>
                No CPIOs found for this authority.
              </p>
            )}
            <button
              className="btn btn-primary"
              disabled={!selectedCpio || assignMutation.isPending}
              onClick={() => assignMutation.mutate({ cpio_id: selectedCpio })}
              style={{ fontSize: 13 }}
            >
              {assignMutation.isPending ? 'Assigning…' : 'Assign CPIO'}
            </button>
          </ActionPanel>

          {/* 2. Update Status */}
          <ActionPanel title="🔹 Step 2 · Update Status">
            <select
              className="input"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{ fontSize: 13 }}
            >
              <option value="">Select Status…</option>
              <option value="under_process">Under Process</option>
              <option value="info_requested">Information Requested</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
            {newStatus === 'rejected' && (
              <textarea
                className="input"
                placeholder="Reason for rejection (mandatory)…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ fontSize: 13, resize: 'vertical', minHeight: 60 }}
              />
            )}
            <button
              className="btn btn-primary"
              disabled={!newStatus || (newStatus === 'rejected' && !rejectionReason) || statusMutation.isPending}
              onClick={() => statusMutation.mutate({ status: newStatus, rejection_reason: rejectionReason || undefined })}
              style={{ fontSize: 13 }}
            >
              {statusMutation.isPending ? 'Updating…' : 'Update Status'}
            </button>
          </ActionPanel>

          {/* 3. Send Formal Response */}
          <ActionPanel title="🔹 Step 3 · Send Formal Response">
            <textarea
              className="input"
              placeholder="Enter the formal CPIO response…"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              style={{ fontSize: 13, resize: 'vertical', minHeight: 90 }}
            />
            <button
              className="btn btn-primary"
              disabled={!responseText || replyMutation.isPending}
              onClick={() => replyMutation.mutate({ response_text: responseText })}
              style={{ fontSize: 13 }}
            >
              {replyMutation.isPending ? 'Sending…' : 'Send Reply'}
            </button>
          </ActionPanel>

          {/* 4. Transfer */}
          <ActionPanel title="↔ Transfer to Another Authority">
            {req.transfer_count >= 1 ? (
              <p style={{ fontSize: 12, color: 'var(--color-error)' }}>
                Already transferred once. RTI Act does not allow further transfers.
              </p>
            ) : (
              <>
                <select
                  className="input"
                  value={toAuthority}
                  onChange={(e) => setToAuthority(e.target.value)}
                  style={{ fontSize: 13 }}
                >
                  <option value="">Select Authority…</option>
                  {authorities.filter((a) => a.id !== req.authority_id).map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Reason for transfer…"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  style={{ fontSize: 13 }}
                />
                <button
                  className="btn btn-secondary"
                  disabled={!toAuthority || !transferReason || transferMutation.isPending}
                  onClick={() => transferMutation.mutate({ to_authority_id: toAuthority, reason: transferReason })}
                  style={{ fontSize: 13 }}
                >
                  {transferMutation.isPending ? 'Transferring…' : 'Transfer Request'}
                </button>
              </>
            )}
          </ActionPanel>

          {/* 5. Additional Fee */}
          <ActionPanel title="💰 Request Additional Fee">
            <input
              className="input"
              type="number"
              placeholder="Amount (₹)…"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              style={{ fontSize: 13 }}
            />
            <input
              className="input"
              placeholder="Reason for additional fee…"
              value={feeReason}
              onChange={(e) => setFeeReason(e.target.value)}
              style={{ fontSize: 13 }}
            />
            <input
              className="input"
              type="date"
              placeholder="Payment deadline…"
              value={feeDeadline}
              onChange={(e) => setFeeDeadline(e.target.value)}
              style={{ fontSize: 13 }}
            />
            <button
              className="btn btn-secondary"
              disabled={!feeAmount || !feeReason || !feeDeadline || feeMutation.isPending}
              onClick={() => feeMutation.mutate({ amount: feeAmount, reason: feeReason, deadline: feeDeadline })}
              style={{ fontSize: 13 }}
            >
              {feeMutation.isPending ? 'Raising…' : 'Raise Fee Request'}
            </button>
          </ActionPanel>

          {/* 6. Extend Deadline */}
          <ActionPanel title="📅 Extend Deadline">
            <input
              className="input"
              type="date"
              value={extDeadline}
              onChange={(e) => setExtDeadline(e.target.value)}
              style={{ fontSize: 13 }}
            />
            <input
              className="input"
              placeholder="Legal reason for extension…"
              value={extReason}
              onChange={(e) => setExtReason(e.target.value)}
              style={{ fontSize: 13 }}
            />
            <button
              className="btn btn-secondary"
              disabled={!extDeadline || !extReason || deadlineMutation.isPending}
              onClick={() => deadlineMutation.mutate({ extended_deadline: extDeadline, extension_reason: extReason })}
              style={{ fontSize: 13 }}
            >
              {deadlineMutation.isPending ? 'Saving…' : 'Save Extension'}
            </button>
          </ActionPanel>

          {/* 7. Internal Note */}
          <ActionPanel title="📝 Internal Note (not visible to citizen)">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Private note…"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                style={{ flex: 1, fontSize: 13 }}
              />
              <button
                className="btn btn-secondary"
                disabled={!internalNote || noteMutation.isPending}
                onClick={() => noteMutation.mutate({ note_text: internalNote })}
                style={{ fontSize: 13, whiteSpace: 'nowrap' }}
              >
                {noteMutation.isPending ? '…' : 'Save'}
              </button>
            </div>
          </ActionPanel>
        </div>
      </div>
    </AdminLayout>
  );
}