
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFakeLogin = () => {
    // In the real app, we'd make a POST to /api/auth/login
    // This is just a placeholder to test the context
    login('fake-jwt-token', { _id: '1', username: 'TestUser', email: 'test@example.com' });
    navigate('/');
  };

  return (
    <div className="page-container flex-center">
      <div className="glass-card auth-card">
        <h1>Welcome Back</h1>
        <p>Log in to access your meetings</p>
        <button className="btn-primary" onClick={handleFakeLogin}>
          Simulate Login
        </button>
      </div>
    </div>
  );
};

export default Login;
