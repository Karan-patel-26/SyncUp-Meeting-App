import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hand, Monitor, Lock, Users } from 'lucide-react';
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
import { VideoEffectsMenu } from '../components/VideoEffectsMenu';
import { videoEffectService } from '../services/videoEffect.service';
import type { EffectType } from '../services/videoEffect.service';
import { Spinner } from '../components/Spinner';
import { Input } from '../components/Input';

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
  const [waitingParticipants, setWaitingParticipants] = useState<ParticipantInfo[]>([]);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  
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
  const [isEffectsOpen, setIsEffectsOpen] = useState(false);
  const [activeEffect, setActiveEffect] = useState<EffectType>('none');
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
  const rawStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const initialize = async () => {
      try {
        const res = await api.get(`/meetings/${roomId}`);
        const meeting = res.data.meeting;
        setMeetingHostId(meeting.host._id || meeting.host);
        
        const isHost = (meeting.host._id || meeting.host) === user.id;
        if (!isHost) {
          if (meeting.password) {
            setNeedsPassword(true);
            return;
          }
          if (meeting.waitingRoom) {
            setIsWaiting(true);
            socket.connect();
            socket.emit('join-waiting-room', roomId, { id: user.id, fullName: user.fullName });
            setupWaitingListeners();
            return;
          }
        }

        setIsAccessGranted(true);
        startMeeting(meeting);
      } catch (err: any) {
        console.error('Error during room initialization:', err);
        setError(err.response?.data?.message || 'Could not initialize meeting room.');
      }
    };

    initialize();

    return () => {
      socket.off('participant-waiting');
      socket.off('access-granted');
      socket.off('access-denied');
      socket.disconnect();
    };
  }, [roomId, user]);

  const setupWaitingListeners = () => {
    socket.on('access-granted', (userId: string) => {
      if (user && userId === user.id) {
        setIsWaiting(false);
        setIsAccessGranted(true);
        window.location.reload(); // Refresh to start fully
      }
    });

    socket.on('access-denied', (userId: string) => {
      if (user && userId === user.id) {
        navigate('/');
      }
    });
  };

  const startMeeting = async (meeting: any) => {
    if (!user) return;
    try {
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
      rawStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      connectToSocket(stream);
      initSpeechRecognition();
    } catch (err) {
      console.error('Error starting meeting:', err);
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
          socket.emit('transcription-chunk', roomId, user?.id, transcript);
          setCaptions(prev => ({ ...prev, [user?.id as string]: transcript }));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };

      recognitionRef.current = recognition;
    }
  };

  const connectToSocket = (stream: MediaStream) => {
    if (!user) return;
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

    socket.on('participant-waiting', (participant: ParticipantInfo) => {
      setWaitingParticipants(prev => [...prev, participant]);
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
        const audioTrack = streamRef.current?.getAudioTracks()[0];
        if (audioTrack && audioTrack.enabled) {
          audioTrack.enabled = false;
          setIsMuted(true);
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

  const createPeer = (userId: string, stream: MediaStream, isInitiator = true) => {
    const peer = new RTCPeerConnection(configuration);

    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [userId]: event.streams[0] }));
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate, roomId, userId);
      }
    };

    if (isInitiator) {
      peer.onnegotiationneeded = async () => {
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('offer', offer, roomId, userId);
        } catch (err) {
          console.error('Error during negotiation:', err);
        }
      };
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
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    socket.emit(nextState ? 'raise-hand' : 'lower-hand', roomId, user?.id);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        const videoTrack = stream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });

        videoTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error('Failed to start screen share', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    setScreenStream(null);
    setIsScreenSharing(false);
    
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      try {
        const recorder = new MediaRecorder(localStream!);
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

  const handleEffectChange = async (effect: EffectType) => {
    setActiveEffect(effect);
    if (!rawStreamRef.current) return;

    try {
      let nextStream: MediaStream;
      if (effect === 'none') {
        nextStream = rawStreamRef.current;
        videoEffectService.stopEffect();
      } else {
        nextStream = await videoEffectService.startEffect(rawStreamRef.current, effect);
      }

      setLocalStream(nextStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = nextStream;

      const videoTrack = nextStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
    } catch (err) {
      console.error('Failed to apply video effect', err);
    }
  };

  const handleVerifyPassword = async (password: string) => {
    try {
      await api.post(`/meetings/${roomId}/verify-access`, { password });
      setNeedsPassword(false);
      
      const res = await api.get(`/meetings/${roomId}`);
      if (res.data.meeting.waitingRoom) {
        setIsWaiting(true);
        socket.connect();
        socket.emit('join-waiting-room', roomId, { id: user?.id, fullName: user?.fullName });
        setupWaitingListeners();
      } else {
        setIsAccessGranted(true);
        startMeeting(res.data.meeting);
      }
    } catch (err) {
      alert('Invalid Password');
    }
  };

  const handleLeave = async () => {
    if (meetingHostId === user?.id && transcriptRef.current.length > 0) {
      try {
        await api.post(`/meetings/${roomId}/summarize`, { transcript: transcriptRef.current.join(' ') });
      } catch (err) {
        console.error('Failed to generate summary', err);
      }
    }
    navigate('/');
  };

  const toggleQuality = () => {
    const next = videoQuality === '720p' ? '360p' : '720p';
    setVideoQuality(next);
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      videoTrack.applyConstraints({
        width: next === '720p' ? 1280 : 640,
        height: next === '720p' ? 720 : 360
      });
    }
  };

  if (error) return <div className="page-container flex-center"><h3>{error}</h3><button className="btn-primary" onClick={() => navigate('/')}>Go Home</button></div>;

  if (!isAccessGranted && !isWaiting && !needsPassword) return <div className="page-container flex-center" style={{ flexDirection: 'column', gap: '1rem' }}><Spinner size={48} className="text-primary" /><h4>Preparing your meeting room...</h4></div>;

  const gridStyle = {
    gridTemplateColumns: activeParticipants.length + Object.keys(remoteStreams).length <= 1 ? '1fr' : 
                         activeParticipants.length + Object.keys(remoteStreams).length <= 2 ? '1fr 1fr' : 
                         'repeat(auto-fit, minmax(300px, 1fr))'
  };

  return (
    <div className="meeting-room">
      <div className="meeting-layout">
        {isAccessGranted && (
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
              isMuted={isMuted} isVideoOff={isVideoOff} isChatOpen={isChatOpen} isParticipantsOpen={isParticipantsOpen}
              isHandRaised={isHandRaised} isScreenSharing={isScreenSharing} isRecording={isRecording} isCaptionsEnabled={isCaptionsEnabled}
              isWhiteboardOpen={isWhiteboardOpen} isNotesOpen={isNotesOpen} isEffectsOpen={isEffectsOpen}
              onToggleMute={toggleMute} onToggleVideo={toggleVideo} 
              onToggleChat={() => { setIsChatOpen(!isChatOpen); setIsParticipantsOpen(false); setIsNotesOpen(false); setIsEffectsOpen(false); }}
              onToggleParticipants={() => { setIsParticipantsOpen(!isParticipantsOpen); setIsChatOpen(false); setIsNotesOpen(false); setIsEffectsOpen(false); }}
              onToggleHand={toggleHand} onToggleScreenShare={toggleScreenShare} onToggleRecording={toggleRecording}
              onToggleCaptions={toggleCaptions} onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
              onToggleNotes={() => { setIsNotesOpen(!isNotesOpen); setIsChatOpen(false); setIsParticipantsOpen(false); setIsEffectsOpen(false); }}
              onToggleEffects={() => { setIsEffectsOpen(!isEffectsOpen); setIsChatOpen(false); setIsParticipantsOpen(false); setIsNotesOpen(false); }}
              onLeave={handleLeave} 
            />
          </div>
        )}

        {isEffectsOpen && <VideoEffectsMenu activeEffect={activeEffect} onSelectEffect={handleEffectChange} onClose={() => setIsEffectsOpen(false)} />}
        {isChatOpen && roomId && <ChatPanel roomId={roomId} onClose={() => setIsChatOpen(false)} />}
        {isParticipantsOpen && roomId && (
          <ParticipantsList 
            roomId={roomId} participants={activeParticipants} waitingParticipants={waitingParticipants}
            isCurrentUserHost={meetingHostId === user?.id} onClose={() => setIsParticipantsOpen(false)} 
          />
        )}
        {isNotesOpen && roomId && <SharedNotes roomId={roomId} onClose={() => setIsNotesOpen(false)} />}
        {isWhiteboardOpen && roomId && <Whiteboard roomId={roomId} onClose={() => setIsWhiteboardOpen(false)} />}

        {!isAccessGranted && needsPassword && (
          <div className="security-overlay">
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
              <Lock size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
              <h2>Meeting Protected</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>This meeting requires a password to join.</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const pwd = (e.currentTarget.elements.namedItem('pwd') as HTMLInputElement).value;
                handleVerifyPassword(pwd);
              }}>
                <Input 
                  label="Room Password"
                  name="pwd" 
                  type="password" 
                  placeholder="Enter password" 
                  required 
                />
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Join Meeting</button>
              </form>
            </div>
          </div>
        )}

        {!isAccessGranted && isWaiting && (
          <div className="security-overlay">
            <div className="glass-card" style={{ padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
              <Users size={48} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
              <h2>Waiting to Join</h2>
              <p style={{ color: 'var(--text-secondary)' }}>The host has been notified. Please wait to be admitted.</p>
              <div className="spinner" style={{ margin: '1.5rem auto' }}></div>
              <button className="btn-secondary" onClick={() => navigate('/')} style={{ width: '100%' }}>Leave Waiting Room</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;
