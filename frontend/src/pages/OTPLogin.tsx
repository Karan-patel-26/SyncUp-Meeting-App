import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Key, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import api from '../api/axios';

const OTPLogin = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      setStep(2);
      if (location.state.message) {
        setSuccess(location.state.message);
      }
    }
  }, [location.state]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/request-otp', { email });
      setStep(2);
      setSuccess('OTP sent to your email!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login-otp', { email, otp });
      login(res.data.accessToken, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex-center">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="logo-icon">
            <Key size={32} color="white" />
          </div>
          <h1>OTP Login</h1>
          <p>Secure access via your email</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: '#10b981', marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
          <CheckCircle2 size={18} /> {success}
        </div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="auth-form">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={<Mail size={20} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
              {!loading && <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              We've sent a 6-digit code to <strong>${email}</strong>
            </p>
            <Input
              label="One-Time Password"
              type="text"
              placeholder="Enter 6-digit OTP"
              icon={<Key size={20} />}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setStep(1)} 
              style={{ marginTop: '0.5rem', background: 'transparent' }}
            >
              Change Email
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Want to use password? <Link to="/login">Login here</Link></p>
          <p>New to SyncUp? <Link to="/register">Create account</Link></p>
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;
