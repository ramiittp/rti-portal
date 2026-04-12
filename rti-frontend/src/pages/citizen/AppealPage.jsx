import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
// import api from '../../utils/api';
import api from '../../utils/api';

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
      <div className="page-header">
        <div>
          <h1 className="page-title">File an Appeal</h1>
          <p className="page-subtitle">
            Under Section 19 of the RTI Act, 2005
          </p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 680 }}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            padding: '0 0 20px',
          }}
        >
          <div className="form-group">
            <label>Appeal Type *</label>
            <select {...register('type', { required: true })}>
              <option value="first_appeal">
                First Appeal — To First Appellate Authority (FAA)
              </option>
              <option value="second_appeal">
                Second Appeal — To Central Information Commission (CIC)
              </option>
            </select>
          </div>
          <div className="form-group">
            <label>Grounds for Appeal *</label>
            <textarea
              rows={6}
              placeholder="State clearly why you are dissatisfied with the CPIO's response or non-response…"
              {...register('grounds', {
                required: 'Grounds are required',
                minLength: {
                  value: 50,
                  message: 'Please provide at least 50 characters',
                },
              })}
              style={{ resize: 'vertical' }}
            />
            {errors.grounds && (
              <span className="form-error">{errors.grounds.message}</span>
            )}
          </div>
          <div className="form-group">
            <label>Relief Sought *</label>
            <textarea
              rows={3}
              placeholder="What specific relief or action do you seek from the appellate authority?"
              {...register('relief_sought', {
                required: 'Relief sought is required',
              })}
              style={{ resize: 'vertical' }}
            />
            {errors.relief_sought && (
              <span className="form-error">
                {errors.relief_sought.message}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              ← Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Filing…' : 'File Appeal'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}