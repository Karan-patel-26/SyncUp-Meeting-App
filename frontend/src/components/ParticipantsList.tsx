import { X, MicOff, UserMinus } from 'lucide-react';
import { socket } from '../api/socket';

interface Participant {
  id: string;
  fullName: string;
  isHost: boolean;
}

interface ParticipantsListProps {
  roomId: string;
  participants: Participant[];
  isCurrentUserHost: boolean;
  onClose: () => void;
}

export const ParticipantsList = ({ 
  roomId, 
  participants, 
  isCurrentUserHost, 
  onClose 
}: ParticipantsListProps) => {

  const handleMute = (targetUserId: string) => {
    socket.emit('mute-user', roomId, targetUserId);
  };

  const handleKick = (targetUserId: string) => {
    socket.emit('kick-user', roomId, targetUserId);
  };

  return (
    <div className="participants-panel">
      <div className="chat-header">
        <h3>Participants ({participants.length})</h3>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="chat-messages" style={{ padding: 0 }}>
        {participants.map((p) => (
          <div key={p.id} className="participant-item">
            <div className="participant-info">
              <div className="participant-avatar">
                {p.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="participant-name">{p.fullName}</span>
                {p.isHost && <span className="host-badge">Host</span>}
              </div>
            </div>

            {isCurrentUserHost && !p.isHost && (
              <div className="participant-actions">
                <button 
                  className="action-btn" 
                  title="Mute for everyone"
                  onClick={() => handleMute(p.id)}
                >
                  <MicOff size={16} />
                </button>
                <button 
                  className="action-btn danger" 
                  title="Remove from meeting"
                  onClick={() => handleKick(p.id)}
                >
                  <UserMinus size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
