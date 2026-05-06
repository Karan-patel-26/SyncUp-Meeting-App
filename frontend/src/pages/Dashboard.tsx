import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Video } from 'lucide-react';
import api from '../api/axios';
import { MeetingCard } from '../components/MeetingCard';
import { CreateMeetingModal } from '../components/CreateMeetingModal';
import { Spinner } from '../components/Spinner';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/meetings');
      setMeetings(response.data);
    } catch (error) {
      console.error('Failed to fetch meetings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeetingCreated = (newMeeting: any) => {
    // Determine if it should be added to the list (e.g. if we are showing all meetings)
    // For now, let's prepend it to the state
    setMeetings((prev) => [newMeeting, ...prev]);
  };

  const handleQuickMeeting = async () => {
    // For an instant meeting, just create one starting now
    try {
      const response = await api.post('/meetings', {
        title: `${user?.fullName}'s Instant Meeting`,
        scheduledAt: new Date().toISOString()
      });
      navigate(`/meeting/${response.data._id}`);
    } catch (error) {
      console.error('Failed to start instant meeting', error);
    }
  };

  return (
    <div className="page-container">
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Video size={28} style={{ color: 'var(--primary-color)' }} />
          <h2 style={{ margin: 0 }}>Antigravity Meetings</h2>
        </div>
        <div className="user-controls">
          <span style={{ fontWeight: 500 }}>Welcome, {user?.fullName}</span>
          <button className="btn-secondary" onClick={logout}>Logout</button>
        </div>
      </nav>
      
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0 }}>Your Meetings</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={handleQuickMeeting}>
              Start Instant
            </button>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Schedule
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-center" style={{ height: '300px' }}>
            <Spinner size={40} className="text-primary" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="glass-card flex-center" style={{ flexDirection: 'column', height: '300px', gap: '1rem' }}>
            <CalendarIcon size={48} color="var(--text-secondary)" />
            <h3 style={{ margin: 0 }}>No meetings scheduled</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Get started by scheduling your first meeting.</p>
          </div>
        ) : (
          <div className="action-cards">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting._id} meeting={meeting} />
            ))}
          </div>
        )}
      </main>

      <CreateMeetingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onMeetingCreated={handleMeetingCreated} 
      />
    </div>
  );
};

// Helper component for empty state
const CalendarIcon = ({ size, color }: { size: number, color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export default Dashboard;
