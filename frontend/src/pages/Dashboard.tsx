
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <nav className="navbar">
        <h2>Antigravity Meetings</h2>
        <div className="user-controls">
          <span>Welcome, {user?.username}</span>
          <button className="btn-secondary" onClick={logout}>Logout</button>
        </div>
      </nav>
      
      <main className="dashboard-content">
        <h1>Dashboard</h1>
        <div className="action-cards">
          <div className="glass-card clickable" onClick={() => navigate('/meeting/new')}>
            <h3>Create New Meeting</h3>
            <p>Start an instant meeting</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
