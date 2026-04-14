import React from 'react';
import { useForm } from 'react-hook-form';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowRight, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Citizen.css';

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
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed.'),
  });

  return (
    <Layout>
      <div className="hero-card">
        <div>
          <h1 className="hero-card__title">My Profile</h1>
          <p className="hero-card__text">
            Keep your contact details current so replies, alerts, and request
            history stay accurate across the portal.
          </p>
        </div>
        <div className="hero-card__meta">
          <span className="meta-chip">Email verified citizen access</span>
          <div className="hero-card__actions">
            <Link to="/applications" className="btn btn-secondary">
              View applications
            </Link>
            <Link to="/new-rti" className="btn btn-primary">
              Start request <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
      <div className="detail-grid">
        <div className="card">
          <form
            onSubmit={handleSubmit((d) => mutation.mutate(d))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              padding: '20px',
            }}
          >
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input {...register('full_name', { required: 'Required' })} />
                {errors.full_name && <span className="form-error">{errors.full_name.message}</span>}
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
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
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
              <textarea rows={2} {...register('address')} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-grid form-grid--triple">
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
              {mutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        <div className="card-stack">
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Profile Guidance</h2>
            </div>
            <div className="card__body">
              <div className="helper-list" style={{ marginTop: 0 }}>
                <div className="helper-item">
                  <strong><Mail size={16} /> Email stays fixed</strong>
                  <span>
                    Your login email is used to identify your citizen account and cannot
                    be changed here.
                  </span>
                </div>
                <div className="helper-item">
                  <strong><Phone size={16} /> Keep contact details current</strong>
                  <span>
                    Accurate phone and address details help with notices and offline
                    follow-up when needed.
                  </span>
                </div>
                <div className="helper-item">
                  <strong><MapPin size={16} /> Language and address matter</strong>
                  <span>
                    This helps you file requests more comfortably and keep records complete.
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
