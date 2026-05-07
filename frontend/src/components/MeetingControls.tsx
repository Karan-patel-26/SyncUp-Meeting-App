import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Hand, Users, Monitor, Circle, ClosedCaption, Palette, FileText, Wand2, Camera, Brain } from 'lucide-react';

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

  return (
    <div className="meeting-controls-bar">
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
          className={`control-btn ${isEffectsOpen ? 'active' : ''}`} 
          onClick={onToggleEffects}
          title="Video Effects"
        >
          <Wand2 size={24} />
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button 
          className={`control-btn ${isHandRaised ? 'active' : ''}`} 
          onClick={onToggleHand}
          title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          style={isHandRaised ? { backgroundColor: '#f59e0b' } : {}}
        >
          <Hand size={24} />
        </button>

        <button 
          className={`control-btn ${isScreenSharing ? 'screen-share-active' : ''}`} 
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <Monitor size={24} />
        </button>

        <button 
          className={`control-btn ${isCaptionsEnabled ? 'cc-active' : ''}`} 
          onClick={onToggleCaptions}
          title={isCaptionsEnabled ? 'Disable Captions' : 'Enable Captions'}
        >
          <ClosedCaption size={24} />
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button 
          className={`control-btn ${isWhiteboardOpen ? 'active' : ''}`} 
          onClick={onToggleWhiteboard}
          title={isWhiteboardOpen ? 'Close Whiteboard' : 'Open Whiteboard'}
        >
          <Palette size={24} />
        </button>

        <button 
          className={`control-btn ${isNotesOpen ? 'active' : ''}`} 
          onClick={onToggleNotes}
          title={isNotesOpen ? 'Close Notes' : 'Shared Notes'}
        >
          <FileText size={24} />
        </button>

        <button 
          className={`control-btn ${isRecording ? 'active' : ''}`} 
          onClick={onToggleRecording}
          title={isRecording ? 'Stop recording' : 'Start recording'}
          style={isRecording ? { color: '#ef4444' } : {}}
        >
          <Circle size={24} fill={isRecording ? '#ef4444' : 'transparent'} />
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
          className={`control-btn ${isInsightsOpen ? 'active' : ''}`} 
          onClick={onToggleInsights}
          title="AI Insights"
          style={isInsightsOpen ? { color: 'var(--secondary-color)' } : {}}
        >
          <Brain size={24} />
        </button>

        <button 
          className="control-btn" 
          onClick={onSnap}
          title="Snap Screenshot"
        >
          <Camera size={24} />
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
    </div>
  );
};
