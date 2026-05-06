
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hand, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../api/socket';
import api from '../api/axios';
import { MeetingControls } from '../components/MeetingControls';
import { ChatPanel } from '../components/ChatPanel';
import { ParticipantsList } from '../components/ParticipantsList';
import { AudioIndicator } from '../components/AudioIndicator';
import { LiveCaptions } from '../components/LiveCaptions';
import { Whiteboard } from '../components/Whiteboard';
import { SharedNotes } from '../components/SharedNotes';
import { Spinner } from '../components/Spinner';

// ICE servers for WebRTC
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ]
};

interface ParticipantInfo {
  id: string;
  fullName: string;
  isHost: boolean;
}

const MeetingRoom = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [id: string]: MediaStream }>({});
  const [activeParticipants, setActiveParticipants] = useState<ParticipantInfo[]>([]);
  const [raisedHands, setRaisedHands] = useState<{ [id: string]: boolean }>({});
  const [captions, setCaptions] = useState<{ [id: string]: string }>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'360p' | '720p'>('720p');
  const [meetingHostId, setMeetingHostId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const streamRef = useRef<MediaStream | null>(null);
  const participantsMapRef = useRef<{ [id: string]: string }>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string[]>([]);

  useEffect(() => {
    if (!roomId || !user) return;

    const initialize = async () => {
      try {
        const res = await api.get(`/meetings/${roomId}`);
        const meeting = res.data.meeting;
        setMeetingHostId(meeting.host._id || meeting.host);
        
        const pMap: { [id: string]: string } = {};
        meeting.participants.forEach((p: any) => {
          pMap[p._id] = p.fullName;
        });
        participantsMapRef.current = pMap;

        setActiveParticipants([{
          id: user.id,
          fullName: user.fullName,
          isHost: (meeting.host._id || meeting.host) === user.id
        }]);

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
        setLocalStream(stream);
        streamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        connectToSocket(stream);
        initSpeechRecognition();
      } catch (err: any) {
        console.error('Error during room initialization:', err);
        setError(err.response?.data?.message || 'Could not initialize meeting room.');
      }
    };

    const initSpeechRecognition = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          
          if (transcript) {
            socket.emit('transcription-chunk', roomId, user.id, transcript);
            setCaptions(prev => ({ ...prev, [user.id]: transcript }));
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
        };

        recognitionRef.current = recognition;
      }
    };

    const connectToSocket = (stream: MediaStream) => {
      socket.connect();
      socket.emit('join-room', roomId, user.id);

      socket.on('user-connected', async (userId: string) => {
        const name = participantsMapRef.current[userId] || 'Anonymous';
        setActiveParticipants(prev => {
          if (prev.find(p => p.id === userId)) return prev;
          return [...prev, { id: userId, fullName: name, isHost: userId === meetingHostId }];
        });

        const peer = createPeer(userId, stream);
        peersRef.current[userId] = peer;
      });

      socket.on('offer', async (offer: RTCSessionDescriptionInit, senderSocketId: string) => {
        const peer = createPeer(senderSocketId, stream, false);
        peersRef.current[senderSocketId] = peer;
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', answer, roomId, senderSocketId);
      });

      socket.on('answer', async (answer: RTCSessionDescriptionInit, senderSocketId: string) => {
        const peer = peersRef.current[senderSocketId];
        if (peer) {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socket.on('ice-candidate', async (candidate: RTCIceCandidateInit, senderSocketId: string) => {
        const peer = peersRef.current[senderSocketId];
        if (peer) {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on('user-disconnected', (userId: string) => {
        if (peersRef.current[userId]) {
          peersRef.current[userId].close();
          delete peersRef.current[userId];
          
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          setActiveParticipants(prev => prev.filter(p => p.id !== userId));
        }
      });

      socket.on('hand-raised', (userId: string) => {
        setRaisedHands((prev) => ({ ...prev, [userId]: true }));
      });

      socket.on('hand-lowered', (userId: string) => {
        setRaisedHands((prev) => ({ ...prev, [userId]: false }));
      });

      socket.on('transcription-chunk', (userId: string, text: string) => {
        setCaptions(prev => ({ ...prev, [userId]: text }));
        const name = participantsMapRef.current[userId] || 'Participant';
        transcriptRef.current.push(`${name}: ${text}`);
      });

      socket.on('mute-remote-user', (targetUserId: string) => {
        if (targetUserId === user.id) {
          if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack && audioTrack.enabled) {
              audioTrack.enabled = false;
              setIsMuted(true);
            }
          }
        }
      });

      socket.on('kick-remote-user', (targetUserId: string) => {
        if (targetUserId === user.id) {
          alert('You have been removed from the meeting by the host.');
          navigate('/');
        }
      });
    };

    initialize();

    return () => {
      socket.disconnect();
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-disconnected');
      socket.off('hand-raised');
      socket.off('hand-lowered');
      socket.off('transcription-chunk');
      socket.off('mute-remote-user');
      socket.off('kick-remote-user');

      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [roomId, user, navigate, meetingHostId]);

  const createPeer = (userId: string, stream: MediaStream, initiator: boolean = true) => {
    const peer = new RTCPeerConnection(configuration);

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate, roomId, userId);
      }
    };

    peer.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };

    if (initiator) {
      peer.createOffer().then((offer) => {
        peer.setLocalDescription(offer);
        socket.emit('offer', offer, roomId, userId);
      });
    }

    return peer;
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    if (newState) {
      socket.emit('raise-hand', roomId, user?.id);
    } else {
      socket.emit('lower-hand', roomId, user?.id);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(screen);
        setIsScreenSharing(true);
        
        const videoTrack = screen.getVideoTracks()[0];
        
        // Swap tracks in all peer connections
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });

        if (localVideoRef.current) localVideoRef.current.srcObject = screen;

        videoTrack.onended = () => stopScreenShare(screen);
      } catch (err) {
        console.error('Failed to share screen', err);
      }
    } else {
      if (screenStream) stopScreenShare(screenStream);
    }
  };

  const stopScreenShare = (screen: MediaStream) => {
    screen.getTracks().forEach(track => track.stop());
    setScreenStream(null);
    setIsScreenSharing(false);

    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    }
  };

  const toggleQuality = async () => {
    const newQuality = videoQuality === '720p' ? '360p' : '720p';
    setVideoQuality(newQuality);
    
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const constraints = newQuality === '720p' 
        ? { width: 1280, height: 720 } 
        : { width: 640, height: 360 };
      
      try {
        await videoTrack.applyConstraints(constraints);
      } catch (err) {
        console.error('Failed to apply constraints', err);
      }
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const streamToRecord = screenStream || localStream;
        if (!streamToRecord) return;

        const options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }

        const recorder = new MediaRecorder(streamToRecord, options);
        mediaRecorderRef.current = recorder;
        recordedChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          await uploadRecordingFile(blob);
        };

        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start recording', err);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const uploadRecordingFile = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('recording', blob, `recording-${Date.now()}.webm`);

    try {
      await api.post(`/meetings/${roomId}/recordings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Recording saved successfully!');
    } catch (err) {
      console.error('Failed to upload recording', err);
      alert('Failed to save recording.');
    }
  };

  const toggleCaptions = () => {
    if (!isCaptionsEnabled) {
      recognitionRef.current?.start();
    } else {
      recognitionRef.current?.stop();
      setCaptions({});
    }
    setIsCaptionsEnabled(!isCaptionsEnabled);
  };

  const handleLeave = async () => {
    if (meetingHostId === user?.id && transcriptRef.current.length > 0) {
      try {
        await api.post(`/meetings/${roomId}/summarize`, {
          transcript: transcriptRef.current.join('\n')
        });
      } catch (err) {
        console.error('Failed to summarize meeting', err);
      }
    }
    navigate('/');
  };

  if (error) {
    return (
      <div className="page-container flex-center">
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: 'var(--danger-color)' }}>Error</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!localStream) {
    return (
      <div className="page-container flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
        <Spinner size={48} className="text-primary" />
        <p>Initializing media...</p>
      </div>
    );
  }

  const totalParticipants = 1 + Object.keys(remoteStreams).length;
  const gridStyle = {
    gridTemplateColumns: totalParticipants === 1 
      ? '1fr' 
      : totalParticipants === 2 
        ? 'repeat(2, 1fr)' 
        : 'repeat(auto-fit, minmax(300px, 1fr))'
  };

  return (
    <div className="meeting-room">
      <div className="meeting-layout">
        <div className="video-section">
          <div className="video-grid" style={gridStyle}>
            <div className="video-container">
              <video ref={localVideoRef} autoPlay muted playsInline />
              <div className="participant-label">
                {isScreenSharing && <Monitor size={14} style={{ marginRight: '4px' }} />}
                You ({user?.fullName})
              </div>
              <AudioIndicator stream={isScreenSharing ? null : localStream} />
              {isHandRaised && <div className="hand-indicator"><Hand size={20} /></div>}
              {isScreenSharing && <div className="screen-share-indicator">You are sharing screen</div>}
              {isCaptionsEnabled && <LiveCaptions text={captions[user?.id || '']} />}
              <button className="quality-badge" onClick={toggleQuality}>{videoQuality}</button>
            </div>

            {Object.entries(remoteStreams).map(([peerId, stream]) => (
              <div key={peerId} className="video-container">
                <video 
                  className="remote-video"
                  autoPlay 
                  playsInline 
                  ref={(video) => {
                    if (video && video.srcObject !== stream) video.srcObject = stream;
                  }} 
                />
                <div className="participant-label">{participantsMapRef.current[peerId] || 'Participant'}</div>
                <AudioIndicator stream={stream} />
                {raisedHands[peerId] && <div className="hand-indicator"><Hand size={20} /></div>}
                {isCaptionsEnabled && <LiveCaptions text={captions[peerId]} />}
              </div>
            ))}
          </div>

          <MeetingControls 
            isMuted={isMuted} 
            isVideoOff={isVideoOff} 
            isChatOpen={isChatOpen}
            isParticipantsOpen={isParticipantsOpen}
            isHandRaised={isHandRaised}
            isScreenSharing={isScreenSharing}
            isRecording={isRecording}
            isCaptionsEnabled={isCaptionsEnabled}
            isWhiteboardOpen={isWhiteboardOpen}
            isNotesOpen={isNotesOpen}
            onToggleMute={toggleMute} 
            onToggleVideo={toggleVideo} 
            onToggleChat={() => { setIsChatOpen(!isChatOpen); setIsParticipantsOpen(false); setIsNotesOpen(false); }}
            onToggleParticipants={() => { setIsParticipantsOpen(!isParticipantsOpen); setIsChatOpen(false); setIsNotesOpen(false); }}
            onToggleHand={toggleHand}
            onToggleScreenShare={toggleScreenShare}
            onToggleRecording={toggleRecording}
            onToggleCaptions={toggleCaptions}
            onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
            onToggleNotes={() => { setIsNotesOpen(!isNotesOpen); setIsChatOpen(false); setIsParticipantsOpen(false); }}
            onLeave={handleLeave} 
          />
        </div>

        {isNotesOpen && roomId && <SharedNotes roomId={roomId} onClose={() => setIsNotesOpen(false)} />}
        {isWhiteboardOpen && roomId && (
          <Whiteboard roomId={roomId} onClose={() => setIsWhiteboardOpen(false)} />
        )}

        {isRecording && (
          <div className="recording-indicator">
            <div className="recording-dot"></div>
            REC
          </div>
        )}

        {isChatOpen && roomId && <ChatPanel roomId={roomId} onClose={() => setIsChatOpen(false)} />}
        {isParticipantsOpen && roomId && (
          <ParticipantsList 
            roomId={roomId} 
            participants={activeParticipants} 
            isCurrentUserHost={meetingHostId === user?.id}
            onClose={() => setIsParticipantsOpen(false)} 
          />
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;
