import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
}

export const MeetingControls = ({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
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
        className="control-btn danger" 
        onClick={onLeave}
        title="Leave Meeting"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};
