import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import '../citizen/Citizen.css';

export default function CitizenLoginPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [fallbackOtp, setFallbackOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { register, handleSubmit } = useForm();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const onSendOtp = async (data) => {
    try {
      setSending(true);
      setEmail(data.email);
      const { data: res } = await api.post('/auth/send-otp', { email: data.email });
      setFallbackOtp(res.otp || '');

      if (res.fallback === 'local_alert' && res.otp) {
        window.alert(`Email service is down.\n\nUse this OTP to continue login: ${res.otp}`);
        toast('Email is unavailable, so the OTP was shown locally.');
      } else {
        toast.success('OTP sent to your email.');
      }

      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setSending(false);
    }
  };

  const onVerifyOtp = async (data) => {
    try {
      setVerifying(true);
      const { data: res } = await api.post('/auth/verify-otp', { email, otp: data.otp });
      const token = res.token;

      if (!token) {
        toast.error('No token received from server.');
        return;
      }

      loginWithToken(token);
      toast.success('Logged in successfully.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="public-shell">
      <div className="public-card">
        <section className="public-card__hero">
          <div>
            <span className="eyebrow">Secure Sign In</span>
            <h1>Return to your RTI dashboard in seconds.</h1>
            <p>
              Access application drafts, track deadlines, and review replies
              through a simple OTP-based login designed for citizens.
            </p>
          </div>
          <div className="public-card__hero-list">
            <div className="public-card__hero-item">
              <strong>01</strong>
              <span>Login without passwords using a one-time code.</span>
            </div>
            <div className="public-card__hero-item">
              <strong>02</strong>
              <span>Review all requests, payments, and appeal actions in one place.</span>
            </div>
            <div className="public-card__hero-item">
              <strong>03</strong>
              <span>Local OTP fallback keeps testing moving when email is unavailable.</span>
            </div>
          </div>
        </section>

        <section className="public-card__content">
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, marginBottom: 8 }}>
              Login to RTI Portal
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
              Sign in with your email and one-time password.
            </p>
            <div className="public-actions">
              <Link to="/track" className="btn btn-secondary">
                <Search size={16} /> Track without login
              </Link>
            </div>
          </div>

          {step === 0 && (
            <form onSubmit={handleSubmit(onSendOtp)}>
              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  {...register('email')}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={sending}>
                {sending ? 'Sending OTP...' : 'Send OTP'}
              </button>
              <p className="section-note" style={{ marginTop: 12 }}>
                A 6-digit OTP will be sent to your email. Enter it on the next
                screen to continue.
              </p>
            </form>
          )}

          {step === 1 && (
            <form onSubmit={handleSubmit(onVerifyOtp)}>
              <div className="form-group">
                <label>OTP sent to</label>
                <input value={email} disabled />
              </div>
              {fallbackOtp && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 14,
                    border: '1px solid #f0c36d',
                    background: '#fff8e6',
                    color: '#7a4b00',
                    fontSize: 13,
                  }}
                >
                  Email delivery fallback is active for this request. OTP: <strong>{fallbackOtp}</strong>
                </div>
              )}
              <div className="form-group">
                <label>Enter OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="6-digit code"
                  autoComplete="one-time-code"
                  required
                  {...register('otp')}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={verifying}>
                {verifying ? 'Verifying...' : 'Verify and Login'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setStep(0);
                  setFallbackOtp('');
                }}
              >
                Change email
              </button>
              <div className="public-note">
                After login you can manage applications, submit RTIs, pay fees, and file
                appeals from one dashboard.
              </div>
            </form>
          )}
          <div className="public-actions">
            <Link to="/track" className="btn btn-secondary">
              Check application status <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
