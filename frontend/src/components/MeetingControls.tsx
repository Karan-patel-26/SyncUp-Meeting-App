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
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          padding: '0.75rem',
          minWidth: '220px',
          zIndex: 100,
          background: 'rgba(15, 17, 21, 0.95)', /* More solid for visibility */
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          animation: 'slideUp 0.2s ease-out forwards'
        }}>
          {[
            { icon: <Hand size={18} />, label: 'Raise Hand', active: isHandRaised, onClick: onToggleHand },
            { icon: <Users size={18} />, label: 'Participants', active: isParticipantsOpen, onClick: onToggleParticipants },
            { icon: <Brain size={18} />, label: 'AI Insights', active: isInsightsOpen, onClick: onToggleInsights },
            { icon: <Palette size={18} />, label: 'Whiteboard', active: isWhiteboardOpen, onClick: onToggleWhiteboard },
            { icon: <FileText size={18} />, label: 'Shared Notes', active: isNotesOpen, onClick: onToggleNotes },
            { icon: <Wand2 size={18} />, label: 'Video Effects', active: isEffectsOpen, onClick: onToggleEffects },
            { icon: <ClosedCaption size={18} />, label: 'Captions', active: isCaptionsEnabled, onClick: onToggleCaptions },
            { icon: <Circle size={18} fill={isRecording ? '#ef4444' : 'transparent'} />, label: isRecording ? 'Stop Recording' : 'Record', active: isRecording, onClick: onToggleRecording },
            { icon: <Camera size={18} />, label: 'Snap Screenshot', active: false, onClick: onSnap },
          ].map((item, idx) => (
            <button 
              key={idx}
              className={`menu-item ${item.active ? 'active' : ''}`}
              onClick={() => { item.onClick(); setIsMoreOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                width: '100%',
                background: item.active ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: item.active ? 'var(--primary-color)' : 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
