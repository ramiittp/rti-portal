import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../utils/api';
import { format } from 'date-fns';

export default function TrackPage() {
  const [regNo, setRegNo] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.get(
        `/requests/track/${regNo.trim()}`
      );
      setResult(data.data);
    } catch {
      setError(
        'Application not found. Please check the registration number.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-shell">
      <div className="public-card">
        <section className="public-card__hero">
          <div>
            <span className="eyebrow">Public Tracking</span>
            <h1>Check the status of any RTI application instantly.</h1>
            <p>
              Enter your registration number to view the latest status,
              authority, submission date, and response deadline without logging in.
            </p>
          </div>
          <div className="public-card__hero-list">
            <div className="public-card__hero-item">
              <strong>01</strong>
              <span>Track by registration number at any time.</span>
            </div>
            <div className="public-card__hero-item">
              <strong>02</strong>
              <span>See the current status and upcoming deadline clearly.</span>
            </div>
            <div className="public-card__hero-item">
              <strong>03</strong>
              <span>Login later to open full details, payments, and appeals.</span>
            </div>
          </div>
        </section>
        <section className="public-card__content">
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, marginBottom: 8 }}>
              Track Application Status
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              Use the reference number issued after submission.
            </p>
          </div>
          <form onSubmit={handleTrack}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Registration Number</label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. RTI/2026/000001"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              <Search size={15} />{' '}
              {loading ? 'Searching…' : 'Track Application'}
            </button>
          </form>
          {error && (
            <p
              style={{
                color: 'var(--color-error)',
                fontSize: 13,
                marginTop: 14,
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}
          {result && (
            <div
              style={{
                marginTop: 20,
                borderTop: '1px solid var(--color-border)',
                paddingTop: 20,
              }}
            >
              <div className="detail-list">
                <div className="detail-row">
                  <span>Reg. No.</span>
                  <code className="reg-no">
                    {result.registration_number}
                  </code>
                </div>
                <div className="detail-row">
                  <span>Subject</span>
                  <strong>{result.subject}</strong>
                </div>
                <div className="detail-row">
                  <span>Authority</span>
                  <strong>{result.authority_name}</strong>
                </div>
                <div className="detail-row">
                  <span>Status</span>
                  <StatusBadge status={result.status} />
                </div>
                <div className="detail-row">
                  <span>Submitted</span>
                  <strong>
                    {result.submitted_at
                      ? format(
                          new Date(result.submitted_at),
                          'dd MMM yyyy'
                        )
                      : '—'}
                  </strong>
                </div>
                <div className="detail-row">
                  <span>Deadline</span>
                  <strong>
                    {result.deadline_date
                      ? format(
                          new Date(result.deadline_date),
                          'dd MMM yyyy'
                        )
                      : '—'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
        <p
          style={{
            textAlign: 'center',
            marginTop: 16,
            fontSize: 13,
            color: 'var(--color-text-muted)',
          }}
        >
          <a href="/login">← Login to your account</a>
        </p>
      </div>
    </div>
  );
}
