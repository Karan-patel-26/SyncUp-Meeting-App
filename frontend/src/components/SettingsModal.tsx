import { useState, useEffect } from 'react';
import { X, User, Bell, Shield, Palette, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Settings State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [prefs, setPrefs] = useState({
    notifications: {
      email: user?.preferences?.notifications?.email ?? true,
      chatSounds: user?.preferences?.notifications?.chatSounds ?? true,
      handRaise: user?.preferences?.notifications?.handRaise ?? true,
    },
    privacy: {
      defaultWaitingRoom: user?.preferences?.privacy?.defaultWaitingRoom ?? true,
      defaultPassword: user?.preferences?.privacy?.defaultPassword ?? false,
      profileVisibility: user?.preferences?.privacy?.profileVisibility ?? 'Everyone',
    }
  });

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      if (user.preferences) {
        setPrefs(user.preferences);
      }
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.patch('/auth/settings', {
        fullName,
        preferences: prefs
      });
      updateUser(response.data.user);
      onClose();
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotif = (key: keyof typeof prefs.notifications) => {
    setPrefs(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  if (!isOpen) return null;


  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'devices', label: 'Audio & Video', icon: <Volume2 size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  ];

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content" style={{ maxWidth: '800px', padding: 0, overflow: 'hidden', display: 'flex', height: '500px' }}>
        
        {/* Sidebar */}
        <div style={{ width: '240px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--glass-border)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  width: '100%',
                  background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  opacity: activeTab === tab.id ? 1 : 0.6
                }}
              >
                {tab.icon}
                <span style={{ fontWeight: 500 }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative' }}>
          <button className="modal-close" onClick={onClose} style={{ top: '1.5rem', right: '1.5rem' }}>
            <X size={20} />
          </button>

          {activeTab === 'profile' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Profile Settings</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
                  {user?.fullName.charAt(0)}
                </div>
                <div>
                  <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Change Avatar</button>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>JPG, GIF or PNG. Max size 2MB.</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.7 }}>Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.7 }}>Email Address</label>
                  <input type="email" className="form-input" value={user?.email} disabled />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Audio & Video</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.7 }}>Camera</label>
                  <select className="form-input" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <option>Integrated Webcam (1920:1080)</option>
                    <option>OBS Virtual Camera</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.7 }}>Microphone</label>
                  <select className="form-input" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <option>Default - MacBook Pro Microphone</option>
                    <option>External Mic (USB)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Notifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[
                  { id: 'email', label: 'Email Notifications', desc: 'Receive updates about scheduled meetings', checked: prefs.notifications.email },
                  { id: 'chatSounds', label: 'Chat Sounds', desc: 'Play a sound when a new message arrives', checked: prefs.notifications.chatSounds },
                  { id: 'handRaise', label: 'Hand Raise Alerts', desc: 'Notify when someone raises their hand', checked: prefs.notifications.handRaise },
                  { id: 'browser', label: 'Browser Notifications', desc: 'Show alerts even when the app is in the background', checked: false },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.desc}</div>
                    </div>
                    <div 
                      onClick={() => item.id !== 'browser' && toggleNotif(item.id as any)}
                      style={{ 
                        width: '44px', 
                        height: '24px', 
                        background: item.checked ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', 
                        borderRadius: '12px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        background: 'white', 
                        borderRadius: '50%', 
                        position: 'absolute', 
                        top: '3px', 
                        left: item.checked ? '23px' : '3px',
                        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Privacy & Security</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Default Meeting Security</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={prefs.privacy.defaultWaitingRoom} 
                        onChange={() => setPrefs(p => ({ ...p, privacy: { ...p.privacy, defaultWaitingRoom: !p.privacy.defaultWaitingRoom } }))}
                        style={{ accentColor: 'var(--primary-color)' }} 
                      /> 
                      Enable Waiting Room for all new meetings
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={prefs.privacy.defaultPassword} 
                        onChange={() => setPrefs(p => ({ ...p, privacy: { ...p.privacy, defaultPassword: !p.privacy.defaultPassword } }))}
                        style={{ accentColor: 'var(--primary-color)' }} 
                      /> 
                      Require password for all new meetings
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.7 }}>Who can see my profile?</label>
                  <select 
                    className="form-input" 
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                    value={prefs.privacy.profileVisibility}
                    onChange={(e) => setPrefs(p => ({ ...p, privacy: { ...p.privacy, profileVisibility: e.target.value } }))}
                  >
                    <option>Everyone</option>
                    <option>Only people I've met with</option>
                    <option>Nobody (Private)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Appearance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.7 }}>Interface Theme</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, padding: '1rem', background: '#0b0d11', border: '2px solid var(--primary-color)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
                      Dark Mode (Default)
                    </div>
                    <div style={{ flex: 1, padding: '1rem', background: '#ffffff', color: '#000', border: '1px solid #ddd', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', opacity: 0.5 }}>
                      Light Mode (Coming Soon)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
