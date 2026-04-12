import React, { useState } from 'react';
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
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 32 32"
            fill="none"
            style={{ margin: '0 auto 12px' }}
          >
            <rect
              width="32"
              height="32"
              rx="8"
              fill="var(--color-primary)"
            />
            <path
              d="M8 8h10a6 6 0 010 12H8V8z"
              fill="white"
              opacity="0.9"
            />
            <rect
              x="8"
              y="14"
              width="16"
              height="2.5"
              rx="1.25"
              fill="white"
            />
          </svg>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 26,
              marginBottom: 6,
            }}
          >
            RTI Portal
          </h1>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 14,
            }}
          >
            Track your application status
          </p>
        </div>
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 32,
            boxShadow: 'var(--shadow-md)',
          }}
        >
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