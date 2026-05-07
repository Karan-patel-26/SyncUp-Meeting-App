import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Users, Sparkles, CheckCircle2, Link as LinkIcon, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MeetingProps {
  meeting: {
    _id: string;
    title: string;
    description?: string;
    status: 'scheduled' | 'active' | 'completed';
    scheduledAt: string;
    participants: string[];
    summary?: string;
    actionItems?: string[];
  };
}

export const MeetingCard = ({ meeting }: MeetingProps) => {
  const navigate = useNavigate();
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);
  const meetingDate = meeting.scheduledAt ? new Date(meeting.scheduledAt) : new Date();
  const formattedDate = isNaN(meetingDate.getTime()) ? 'No date set' : format(meetingDate, 'MMM d, yyyy h:mm a');

  const copyToClipboard = () => {
    const url = `${window.location.origin}/meeting/${meeting._id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      
      {!showSummary ? (
        <>
          {meeting.description && (
            <p className="meeting-description">{meeting.description}</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
            <div className="meeting-time" style={{ color: 'var(--primary-color)' }}>
              <Users size={16} />
              <span>{meeting.participants.length} Participants</span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.5rem', width: '36px' }}
                onClick={copyToClipboard}
                title="Copy meeting link"
              >
                {copied ? <Check size={16} color="#10b981" /> : <LinkIcon size={16} />}
              </button>
              
              {meeting.summary && (
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  onClick={() => setShowSummary(true)}
                >
                  <Sparkles size={16} />
                </button>
              )}
              {meeting.status !== 'completed' && (
                <button 
                  className="btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  onClick={() => navigate(`/meeting/${meeting._id}`)}
                >
                  Join
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="ai-summary-view">
          <div className="summary-header">
            <Sparkles size={16} color="var(--primary-color)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Summary</span>
            <button className="modal-close" style={{ marginLeft: 'auto' }} onClick={() => setShowSummary(false)}>×</button>
          </div>
          <p style={{ fontSize: '0.85rem', margin: '0.5rem 0', lineHeight: 1.4 }}>{meeting.summary}</p>
          
          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <div className="action-items-list">
              <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>ACTION ITEMS:</span>
              {meeting.actionItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
