import { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Spinner } from './Spinner';
import api from '../api/axios';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated: (newMeeting: any) => void;
}

export const CreateMeetingModal = ({ isOpen, onClose, onMeetingCreated }: CreateMeetingModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    password: '',
    waitingRoom: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/meetings', formData);
      onMeetingCreated(response.data);
      onClose(); // Close modal on success
      setFormData({ title: '', description: '', scheduledAt: '', password: '', waitingRoom: false }); // reset
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create meeting.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule a Meeting">
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          label="Meeting Title"
          name="title"
          placeholder="e.g., Weekly Sync"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <textarea
            className="form-input"
            name="description"
            placeholder="What is this meeting about?"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        <Input
          label="Scheduled Time"
          name="scheduledAt"
          type="datetime-local"
          value={formData.scheduledAt}
          onChange={handleChange}
          required
        />

        <Input
          label="Meeting Password (Optional)"
          name="password"
          type="password"
          placeholder="Leave blank for no password"
          value={formData.password}
          onChange={handleChange}
        />

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <input 
            type="checkbox" 
            id="waitingRoom" 
            name="waitingRoom" 
            checked={formData.waitingRoom}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="waitingRoom" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
            Enable Waiting Room (Host must admit participants)
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-center" disabled={isLoading} style={{ gap: '0.5rem', minWidth: '120px' }}>
            {isLoading ? <Spinner size={18} /> : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
