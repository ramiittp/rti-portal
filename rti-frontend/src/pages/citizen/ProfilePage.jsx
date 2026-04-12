import React from 'react';
import { useForm } from 'react-hook-form';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/auth/profile').then((r) => r.data.user),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ values: data || {} });

  const mutation = useMutation({
    mutationFn: (d) => api.put('/auth/profile', d),
    onSuccess: () => {
      toast.success('Profile updated!');
      refreshProfile();
      qc.invalidateQueries(['profile']);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || 'Update failed.'),
  });

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>
      <div className="card" style={{ maxWidth: 580 }}>
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            padding: '0 0 20px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div className="form-group">
              <label>Full Name *</label>
              <input
                {...register('full_name', { required: 'Required' })}
              />
              {errors.full_name && (
                <span className="form-error">
                  {errors.full_name.message}
                </span>
              )}
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                {...register('phone')}
              />
            </div>
          </div>
          <div className="form-group">
            <label>
              Email{' '}
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
              >
                (cannot be changed)
              </span>
            </label>
            <input
              value={user?.email || ''}
              disabled
              style={{
                background: 'var(--color-bg)',
                color: 'var(--color-text-muted)',
              }}
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              rows={2}
              {...register('address')}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
            }}
          >
            <div className="form-group">
              <label>City</label>
              <input {...register('city')} />
            </div>
            <div className="form-group">
              <label>State</label>
              <input {...register('state')} />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input maxLength={6} {...register('pincode')} />
            </div>
          </div>
          <div className="form-group">
            <label>Preferred Language</label>
            <select {...register('preferred_language')}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
              <option value="ta">Tamil</option>
              <option value="mr">Marathi</option>
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>
    </Layout>
  );
}