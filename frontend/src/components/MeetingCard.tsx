import { format } from 'date-fns';
import { Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MeetingProps {
  meeting: {
    _id: string;
    title: string;
    description?: string;
    status: 'scheduled' | 'active' | 'ended';
    scheduledAt: string;
    participants: string[];
  };
}

export const MeetingCard = ({ meeting }: MeetingProps) => {
  const navigate = useNavigate();
  const formattedDate = format(new Date(meeting.scheduledAt), 'MMM d, yyyy h:mm a');

  return (
    <div className="glass-card meeting-card">
      <div className="meeting-card-header">
        <div>
          <h3 className="meeting-title">{meeting.title}</h3>
          <div className="meeting-time">
            <Calendar size={16} />
            <span>{formattedDate}</span>
          </div>
        </div>
        <span className={`meeting-status status-${meeting.status}`}>
          {meeting.status}
        </span>
      </div>
      
      {meeting.description && (
        <p className="meeting-description">{meeting.description}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
        <div className="meeting-time" style={{ color: 'var(--primary-color)' }}>
          <Users size={16} />
          <span>{meeting.participants.length} Participants</span>
        </div>
        
        {meeting.status !== 'ended' && (
          <button 
            className="btn-primary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            onClick={() => navigate(`/meeting/${meeting._id}`)}
          >
            Join Meeting
          </button>
        )}
      </div>
    </div>
  );
};
