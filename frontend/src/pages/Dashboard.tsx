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
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (meetings.length > 0) {
      const future = meetings
        .filter(m => new Date(m.scheduledAt) > new Date())
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      
      if (future.length > 0) {
        setNextMeeting(future[0]);
      }
    }
  }, [meetings]);

  useEffect(() => {
    if (!nextMeeting) return;

    const timer = setInterval(() => {
      const diff = new Date(nextMeeting.scheduledAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft('Starting now!');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}m ${secs}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [nextMeeting]);


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
      <nav className="navbar" style={{ border: 'none', padding: '1.5rem 0' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => {
            const colors = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];
            const current = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
            const next = colors[(colors.indexOf(current) + 1) % colors.length] || colors[0];
            document.documentElement.style.setProperty('--primary-color', next);
          }}
          title="Click to change theme color"
        >
          <div style={{ background: 'var(--primary-color)', padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(var(--primary-color-rgb), 0.3)', transition: 'all 0.3s ease' }}>
            <Video size={24} color="white" />
          </div>
          <h2 style={{ margin: 0, letterSpacing: '-0.5px' }}>SyncUp</h2>
        </div>
        <div className="user-controls">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Logged in as</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.fullName}</div>
          </div>
          <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={{ marginBottom: '3rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Hello, {user?.fullName.split(' ')[0]}! 👋</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Ready to start your next collaboration?</p>
        </div>
        {nextMeeting && (
          <div className="countdown-badge">
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', animation: 'pulse 2s infinite' }}></div>
            Next meeting: <span style={{ fontWeight: 800 }}>{timeLeft}</span>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-label">Total Meetings</div>
          <div className="stat-value">{meetings.length}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Hours Spent</div>
          <div className="stat-value">{(meetings.length * 0.8).toFixed(1)}h</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Recordings</div>
          <div className="stat-value">{recordings.length}</div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-label">Team Rank</div>
          <div className="stat-value">Top 5%</div>
        </div>
      </div>
      
      <main className="dashboard-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div className="glass-card floating" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', opacity: 0.8 }}>JOIN A MEETING</div>
              <input 
                type="text" 
                placeholder="Enter meeting ID or link..." 
                className="form-input" 
                style={{ padding: '0.75rem 1rem' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) {
                      const id = val.includes('/') ? val.split('/').pop() : val;
                      navigate(`/meeting/${id}`);
                    }
                  }
                }}
              />
            </div>
            <button className="btn-primary" style={{ marginTop: '1.6rem' }} onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              if (input.value) {
                const id = input.value.includes('/') ? input.value.split('/').pop() : input.value;
                navigate(`/meeting/${id}`);
              }
            }}>Join</button>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" style={{ padding: '1rem 2rem' }} onClick={handleQuickMeeting}>
              Instant Meeting
            </button>
            <button className="btn-primary" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsModalOpen(true)}>
              <Plus size={20} /> Schedule New
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
