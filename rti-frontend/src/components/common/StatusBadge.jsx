import React from 'react';

const COLORS = {
  draft: 'badge--muted',
  submitted: 'badge--info',
  payment_pending: 'badge--warning',
  under_process: 'badge--info',
  answered: 'badge--success',
  closed: 'badge--muted',
  rejected: 'badge--error',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const cls = COLORS[key] || 'badge--muted';
  const label = key.replace(/_/g, ' ') || 'unknown';

  return <span className={`status-badge ${cls}`}>{label}</span>;
}