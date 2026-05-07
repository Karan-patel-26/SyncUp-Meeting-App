import { useState } from 'react';
import { X, User, Bell, Shield, Palette, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

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
                  <input type="text" className="form-input" defaultValue={user?.fullName} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.7 }}>Email Address</label>
                  <input type="email" className="form-input" defaultValue={user?.email} disabled />
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
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={onClose}>Save Changes</button>
          </div>

        </div>
      </div>
    </div>
  );
};
