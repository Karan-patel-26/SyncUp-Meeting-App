import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Hand, Users } from 'lucide-react';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isHandRaised: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleHand: () => void;
  onLeave: () => void;
}

export const MeetingControls = ({
  isMuted,
  isVideoOff,
  isChatOpen,
  isParticipantsOpen,
  isHandRaised,
  onToggleMute,
  onToggleVideo,
  onToggleChat,
  onToggleParticipants,
  onToggleHand,
  onLeave,
}: MeetingControlsProps) => {
  return (
    <div className="meeting-controls-bar">
      <button 
        className={`control-btn ${isMuted ? 'active' : ''}`} 
        onClick={onToggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      <button 
        className={`control-btn ${isVideoOff ? 'active' : ''}`} 
        onClick={onToggleVideo}
        title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
      >
        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
      </button>

      <button 
        className={`control-btn ${isHandRaised ? 'active' : ''}`} 
        onClick={onToggleHand}
        title={isHandRaised ? 'Lower hand' : 'Raise hand'}
        style={isHandRaised ? { backgroundColor: '#f59e0b' } : {}}
      >
        <Hand size={24} />
      </button>

      <button 
        className={`control-btn ${isParticipantsOpen ? 'active' : ''}`} 
        onClick={onToggleParticipants}
        title="Participants"
      >
        <Users size={24} />
      </button>

      <button 
        className={`control-btn ${isChatOpen ? 'active' : ''}`} 
        onClick={onToggleChat}
        title="Chat"
      >
        <MessageSquare size={24} />
      </button>

      <button 
        className="control-btn danger" 
        onClick={onLeave}
        title="Leave Meeting"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};
