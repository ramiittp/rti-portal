import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';
import { ChevronRight, Search } from 'lucide-react';
import './Citizen.css';

const STEPS = ['Choose Authority', 'Draft Application', 'Review & Submit'];

export default function NewRTIPage() {
  const [step, setStep] = useState(0);
  const [selectedAuthority, setSelectedAuthority] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [draftId, setDraftId] = useState(null);
  const [authSearch, setAuthSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();

  const { data: authorities } = useQuery({
    queryKey: ['authorities', authSearch],
    queryFn: () =>
      api.get(`/master/authorities?q=${authSearch}`).then((r) => r.data.data),
    enabled: authSearch.length >= 2,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('/master/templates').then((r) => r.data.data),
  });

  const applyTemplate = async (tpl) => {
    setSelectedTemplate(tpl);
    setValue('subject', tpl.subject || '');
    setValue('information_sought', tpl.information_sought || '');
    setValue('description', tpl.description || '');
    await api.post(`/master/templates/${tpl.id}/use`);
  };

  const onSaveDraft = async (formData) => {
    try {
      if (!selectedAuthority) {
        toast.error('Please select a public authority.');
        return;
      }
      const payload = {
        ...formData,
        authority_id: selectedAuthority.id,
        is_bpl: formData.is_bpl === 'true',
      };
      if (draftId) {
        await api.put(`/requests/${draftId}`, payload);
      } else {
        const { data } = await api.post('/requests', payload);
        setDraftId(data.data.id);
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save draft.');
    }
  };

  const onSubmit = async () => {
    if (!draftId) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/requests/${draftId}/submit`);
      if (data.data.status === 'payment_pending') {
        toast.success('Draft saved! Proceeding to payment.');
        navigate(`/applications/${draftId}`);
      } else {
        toast.success('Application submitted successfully! (BPL — no fee required)');
        navigate('/applications');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">File New RTI Application</h1>
          <p className="page-subtitle">Under Right to Information Act, 2005</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`stepper__step ${
                i === step ? 'stepper__step--active' : ''
              } ${i < step ? 'stepper__step--done' : ''}`}
            >
              <div className="stepper__circle">
                {i < step ? '✓' : i + 1}
              </div>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="stepper__line" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Authority */}
      {step === 0 && (
        <div className="card fade-in">
          <div className="card__header">
            <h2 className="card__title">Select Public Authority</h2>
          </div>
          <div style={{ padding: '0 0 20px' }}>
            <div className="form-group">
              <label>Search Authority by name, city or state</label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: 11,
                    color: 'var(--color-text-faint)',
                  }}
                />
                <input
                  type="text"
                  placeholder="e.g. IIT, AIIMS, RBI, UGC…"
                  style={{ paddingLeft: 34 }}
                  value={authSearch}
                  onChange={(e) => setAuthSearch(e.target.value)}
                />
              </div>
            </div>
            {authorities?.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {authorities.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedAuthority(a);
                    }}
                    className={`authority-card ${
                      selectedAuthority?.id === a.id
                        ? 'authority-card--selected'
                        : ''
                    }`}
                  >
                    <div>
                      <strong>{a.name}</strong>
                      <p>
                        {a.department_name} · {a.ministry_name}
                      </p>
                      <span>
                        {a.city}, {a.state}
                      </span>
                    </div>
                    {selectedAuthority?.id === a.id && (
                      <span
                        style={{
                          color: 'var(--color-primary)',
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {authSearch.length >= 2 && !authorities?.length && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-muted)',
                  marginTop: 8,
                }}
              >
                No authorities found. Try a different search.
              </p>
            )}
            {selectedAuthority && (
              <div className="selected-authority-banner">
                <strong>Selected:</strong> {selectedAuthority.name} —{' '}
                {selectedAuthority.city}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              disabled={!selectedAuthority}
              onClick={() => setStep(1)}
            >
              Continue to Draft <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Draft */}
      {step === 1 && (
        <div
          className="fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <form className="card" onSubmit={handleSubmit(onSaveDraft)}>
            <div className="card__header">
              <h2 className="card__title">Draft Your Application</h2>
            </div>
            <div
              style={{
                padding: '0 0 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  placeholder="Brief subject of your information request"
                  {...register('subject', {
                    required: 'Subject is required',
                    maxLength: { value: 500, message: 'Max 500 chars' },
                  })}
                />
                {errors.subject && (
                  <span className="form-error">
                    {errors.subject.message}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>
                  Information Sought *{' '}
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    (be specific and precise)
                  </span>
                </label>
                <textarea
                  rows={6}
                  placeholder={
                    '1. List the specific information you seek\n2. Mention dates, document names, amounts etc.'
                  }
                  {...register('information_sought', {
                    required: 'Please describe the information sought',
                  })}
                  style={{ resize: 'vertical' }}
                />
                {errors.information_sought && (
                  <span className="form-error">
                    {errors.information_sought.message}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>
                  Description{' '}
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    (optional background)
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Any context or background that helps the CPIO understand your request"
                  {...register('description')}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                }}
              >
                <div className="form-group">
                  <label>Period From</label>
                  <input type="date" {...register('period_from')} />
                </div>
                <div className="form-group">
                  <label>Period To</label>
                  <input type="date" {...register('period_to')} />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                }}
              >
                <div className="form-group">
                  <label>Preferred Response Mode</label>
                  <select {...register('preferred_response_mode')}>
                    <option value="email">Email</option>
                    <option value="post">Post</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>BPL Card Holder?</label>
                  <select {...register('is_bpl')}>
                    <option value="false">No — Pay ₹10 fee</option>
                    <option value="true">Yes — Fee waived</option>
                  </select>
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(0)}
              >
                ← Back
              </button>
              <button type="submit" className="btn btn-primary">
                Preview & Submit →
              </button>
            </div>
          </form>

          {/* Templates sidebar */}
          <div className="card">
            <div className="card__header">
              <h2 className="card__title" style={{ fontSize: 13 }}>
                Use a Template
              </h2>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingBottom: 16,
              }}
            >
              {templates?.map((t) => (
                <div
                  key={t.id}
                  className={`template-card ${
                    selectedTemplate?.id === t.id
                      ? 'template-card--selected'
                      : ''
                  }`}
                  onClick={() => applyTemplate(t)}
                >
                  <strong>{t.title}</strong>
                  <span>{t.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="card fade-in">
          <div className="card__header">
            <h2 className="card__title">Review Your Application</h2>
          </div>
          <div className="detail-list" style={{ marginBottom: 20 }}>
            <div className="detail-row">
              <span>Authority</span>
              <strong>{selectedAuthority?.name}</strong>
            </div>
            <div className="detail-row">
              <span>Subject</span>
              <strong>{watch('subject')}</strong>
            </div>
            <div className="detail-row">
              <span>Fee</span>
              <strong>
                {watch('is_bpl') === 'true'
                  ? 'Waived (BPL)'
                  : '₹10 (Online)'}
              </strong>
            </div>
          </div>
          <div
            style={{
              background: 'var(--color-bg)',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Information Sought:
            </p>
            <pre
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                color: 'var(--color-text)',
              }}
            >
              {watch('information_sought')}
            </pre>
          </div>
          <div
            className="info-box info-box--warning"
            style={{ marginBottom: 20 }}
          >
            <strong>Important:</strong> Once submitted, the CPIO has{' '}
            <strong>30 days</strong> to respond. You will receive a
            confirmation email with your registration number.
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'space-between',
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() => setStep(1)}
            >
              ← Edit Application
            </button>
            <button
              className="btn btn-primary"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : '✓ Submit Application'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}