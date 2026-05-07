import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Video, Play, Calendar } from 'lucide-react';
import api from '../api/axios';
import { MeetingCard } from '../components/MeetingCard';
import { CreateMeetingModal } from '../components/CreateMeetingModal';
import { Spinner } from '../components/Spinner';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'meetings' | 'recordings'>('meetings');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meetingsRes, recordingsRes] = await Promise.all([
        api.get('/meetings'),
        api.get('/meetings/recordings')
      ]);
      setMeetings(meetingsRes.data.meetings);
      setRecordings(recordingsRes.data.recordings);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeetingCreated = (newMeeting: any) => {
    setMeetings((prev) => [newMeeting, ...prev]);
  };

  const handleQuickMeeting = async () => {
    try {
      const response = await api.post('/meetings', {
        title: `${user?.fullName}'s Instant Meeting`,
        scheduledAt: new Date().toISOString()
      });
      navigate(`/meeting/${response.data.meeting._id}`);
    } catch (error) {
      console.error('Failed to start instant meeting', error);
    }
  };

  return (
    <div className="page-container">
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Video size={28} style={{ color: 'var(--primary-color)' }} />
          <h2 style={{ margin: 0 }}>Meetings</h2>
        </div>
        <div className="user-controls">
          <span style={{ fontWeight: 500 }}>Welcome, {user?.fullName}</span>
          <button className="btn-secondary" onClick={logout}>Logout</button>
        </div>
      </nav>
      
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={handleQuickMeeting}>
              Start Instant
            </button>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Schedule
            </button>
          </div>
        </div>

        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'meetings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('meetings')}
          >
            Your Meetings
          </div>
          <div 
            className={`tab ${activeTab === 'recordings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('recordings')}
          >
            Recordings
          </div>
        </div>

        {isLoading ? (
          <div className="flex-center" style={{ height: '300px' }}>
            <Spinner size={40} className="text-primary" />
          </div>
        ) : activeTab === 'meetings' ? (
          meetings.length === 0 ? (
            <div className="glass-card flex-center" style={{ flexDirection: 'column', height: '300px', gap: '1rem' }}>
              <Calendar size={48} color="var(--text-secondary)" />
              <h3 style={{ margin: 0 }}>No meetings scheduled</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Get started by scheduling your first meeting.</p>
            </div>
          ) : (
            <div className="action-cards">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting._id} meeting={meeting} />
              ))}
            </div>
          )
        ) : (
          recordings.length === 0 ? (
            <div className="glass-card flex-center" style={{ flexDirection: 'column', height: '300px', gap: '1rem' }}>
              <Video size={48} color="var(--text-secondary)" />
              <h3 style={{ margin: 0 }}>No recordings found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Recordings from your meetings will appear here.</p>
            </div>
          ) : (
            <div className="recordings-grid">
              {recordings.map((rec) => (
                <div key={rec._id} className="recording-card">
                  <div className="recording-thumb">
                    <a href={rec.url} target="_blank" rel="noopener noreferrer" className="play-icon">
                      <Play size={24} fill="white" />
                    </a>
                  </div>
                  <div className="recording-info">
                    <div className="recording-title">{rec.title}</div>
                    <div className="recording-meta">
                      {new Date(rec.createdAt).toLocaleDateString()} • {(rec.size / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
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

export default Dashboard;
