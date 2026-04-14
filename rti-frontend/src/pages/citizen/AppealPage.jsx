import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Scale } from 'lucide-react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';
import './Citizen.css';

export default function AppealPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { type: 'first_appeal' } });

  const onSubmit = async (data) => {
    try {
      await api.post('/appeals', { ...data, request_id: id });
      toast.success('Appeal filed successfully!');
      navigate('/applications');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to file appeal.');
    }
  };

  return (
    <Layout>
      <div className="hero-card">
        <div>
          <h1 className="hero-card__title">File an Appeal</h1>
          <p className="hero-card__text">Under Section 19 of the RTI Act, 2005</p>
        </div>
        <div className="hero-card__meta">
          <span className="meta-chip">Application ID: {id}</span>
          <span className="meta-chip">Use only when response is delayed or unsatisfactory</span>
        </div>
      </div>
      <div className="detail-grid">
        <div className="card">
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              padding: '20px',
            }}
          >
            <div className="form-group">
              <label>Appeal Type *</label>
              <select {...register('type', { required: true })}>
                <option value="first_appeal">
                  First Appeal - To First Appellate Authority (FAA)
                </option>
                <option value="second_appeal">
                  Second Appeal - To Central Information Commission (CIC)
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Grounds for Appeal *</label>
              <textarea
                rows={6}
                placeholder="State clearly why you are dissatisfied with the CPIO response or with not receiving one."
                {...register('grounds', {
                  required: 'Grounds are required',
                  minLength: {
                    value: 50,
                    message: 'Please provide at least 50 characters',
                  },
                })}
                style={{ resize: 'vertical' }}
              />
              {errors.grounds && <span className="form-error">{errors.grounds.message}</span>}
            </div>
            <div className="form-group">
              <label>Relief Sought *</label>
              <textarea
                rows={3}
                placeholder="Describe what you want the appellate authority to direct or provide."
                {...register('relief_sought', {
                  required: 'Relief sought is required',
                })}
                style={{ resize: 'vertical' }}
              />
              {errors.relief_sought && (
                <span className="form-error">{errors.relief_sought.message}</span>
              )}
            </div>
            <div className="stack-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Filing...' : 'File Appeal'}
              </button>
            </div>
          </form>
        </div>

        <div className="card-stack">
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Before You Submit</h2>
            </div>
            <div className="card__body">
              <div className="helper-list" style={{ marginTop: 0 }}>
                <div className="helper-item">
                  <strong><Scale size={16} /> Explain the delay or problem</strong>
                  <span>
                    Mention missing documents, incomplete information, or why the reply
                    does not answer your request.
                  </span>
                </div>
                <div className="helper-item">
                  <strong>Ask for specific relief</strong>
                  <span>
                    Request disclosure, reconsideration, or another clear remedy instead of
                    broad complaints only.
                  </span>
                </div>
                <div className="helper-item">
                  <strong>Keep it factual</strong>
                  <span>
                    Short, specific facts usually help more than long emotional statements.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
