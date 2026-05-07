import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Hand, Users, Monitor, Circle, ClosedCaption, Palette, FileText, Wand2, Camera, Brain, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isInsightsOpen: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isCaptionsEnabled: boolean;
  isWhiteboardOpen: boolean;
  isNotesOpen: boolean;
  isEffectsOpen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleInsights: () => void;
  onToggleHand: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onToggleCaptions: () => void;
  onToggleWhiteboard: () => void;
  onToggleNotes: () => void;
  onToggleEffects: () => void;
  onSnap: () => void;
  onLeave: () => void;
}

export const MeetingControls = ({
  isMuted,
  isVideoOff,
  isChatOpen,
  isParticipantsOpen,
  isInsightsOpen,
  isHandRaised,
  isScreenSharing,
  isRecording,
  isCaptionsEnabled,
  isWhiteboardOpen,
  isNotesOpen,
  isEffectsOpen,
  onToggleMute,
  onToggleVideo,
  onToggleChat,
  onToggleParticipants,
  onToggleInsights,
  onToggleHand,
  onToggleScreenShare,
  onToggleRecording,
  onToggleCaptions,
  onToggleWhiteboard,
  onToggleNotes,
  onToggleEffects,
  onSnap,
  onLeave,
}: MeetingControlsProps) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const toggleMore = () => setIsMoreOpen(!isMoreOpen);

  return (
    <div className="meeting-controls-bar" style={{ position: 'relative' }}>
      {/* Primary Controls - Always Visible */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
          className={`control-btn ${isScreenSharing ? 'screen-share-active' : ''}`} 
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <Monitor size={24} />
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

      {/* Secondary Controls - Hidden in 'More' Menu */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button 
          className={`control-btn ${isChatOpen ? 'active' : ''}`} 
          onClick={onToggleChat}
          title="Chat"
        >
          <MessageSquare size={24} />
        </button>

        <button 
          className={`control-btn ${isMoreOpen ? 'active' : ''}`} 
          onClick={toggleMore}
          title="More options"
        >
          <MoreHorizontal size={24} />
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

      <button 
        className="control-btn danger" 
        onClick={onLeave}
        title="Leave Meeting"
      >
        <PhoneOff size={24} />
      </button>

      {/* More Options Popover */}
      {isMoreOpen && (
        <div className="glass-card" style={{
          position: 'absolute',
          bottom: '120%',
          right: '50%',
          transform: 'translateX(50%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          padding: '1.5rem',
          minWidth: '280px',
          zIndex: 100,
          animation: 'slideUp 0.2s ease-out forwards'
        }}>
          <button className={`control-btn ${isHandRaised ? 'active' : ''}`} onClick={() => { onToggleHand(); setIsMoreOpen(false); }} title="Raise Hand">
            <Hand size={20} />
          </button>
          <button className={`control-btn ${isParticipantsOpen ? 'active' : ''}`} onClick={() => { onToggleParticipants(); setIsMoreOpen(false); }} title="Participants">
            <Users size={20} />
          </button>
          <button className={`control-btn ${isInsightsOpen ? 'active' : ''}`} onClick={() => { onToggleInsights(); setIsMoreOpen(false); }} title="AI Insights">
            <Brain size={20} />
          </button>
          <button className={`control-btn ${isWhiteboardOpen ? 'active' : ''}`} onClick={() => { onToggleWhiteboard(); setIsMoreOpen(false); }} title="Whiteboard">
            <Palette size={20} />
          </button>
          <button className={`control-btn ${isNotesOpen ? 'active' : ''}`} onClick={() => { onToggleNotes(); setIsMoreOpen(false); }} title="Notes">
            <FileText size={20} />
          </button>
          <button className={`control-btn ${isEffectsOpen ? 'active' : ''}`} onClick={() => { onToggleEffects(); setIsMoreOpen(false); }} title="Video Effects">
            <Wand2 size={20} />
          </button>
          <button className={`control-btn ${isCaptionsEnabled ? 'active' : ''}`} onClick={() => { onToggleCaptions(); setIsMoreOpen(false); }} title="Captions">
            <ClosedCaption size={20} />
          </button>
          <button className={`control-btn ${isRecording ? 'active' : ''}`} onClick={() => { onToggleRecording(); setIsMoreOpen(false); }} title="Record">
            <Circle size={20} fill={isRecording ? '#ef4444' : 'transparent'} />
          </button>
          <button className="control-btn" onClick={() => { onSnap(); setIsMoreOpen(false); }} title="Snap">
            <Camera size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
