
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hand } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../api/socket';
import { MeetingControls } from '../components/MeetingControls';
import { ChatPanel } from '../components/ChatPanel';
import { Spinner } from '../components/Spinner';

// ICE servers for WebRTC
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ]
};

const MeetingRoom = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [id: string]: MediaStream }>({});
  const [raisedHands, setRaisedHands] = useState<{ [id: string]: boolean }>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [error, setError] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        streamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        connectToSocket(stream);
      } catch (err: any) {
        console.error('Error accessing media devices.', err);
        setError('Could not access camera/microphone. Please allow permissions.');
      }
    };

    const connectToSocket = (stream: MediaStream) => {
      socket.connect();
      socket.emit('join-room', roomId, user.id);

      socket.on('user-connected', async (userId: string) => {
        console.log('User connected:', userId);
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
        console.log('User disconnected:', userId);
        if (peersRef.current[userId]) {
          peersRef.current[userId].close();
          delete peersRef.current[userId];
          
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });

          setRaisedHands((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }
      });

      // Hand Raise Listeners
      socket.on('hand-raised', (userId: string) => {
        setRaisedHands((prev) => ({ ...prev, [userId]: true }));
      });

      socket.on('hand-lowered', (userId: string) => {
        setRaisedHands((prev) => ({ ...prev, [userId]: false }));
      });
    };

    initializeMedia();

    return () => {
      socket.disconnect();
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-disconnected');
      socket.off('hand-raised');
      socket.off('hand-lowered');

      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, user]);

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
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
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

  const handleLeave = () => {
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
            {/* Local Video */}
            <div className="video-container">
              <video ref={localVideoRef} autoPlay muted playsInline />
              <div className="participant-label">You ({user?.fullName})</div>
              {isHandRaised && (
                <div className="hand-indicator">
                  <Hand size={20} />
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([peerId, stream]) => (
              <div key={peerId} className="video-container">
                <video 
                  className="remote-video"
                  autoPlay 
                  playsInline 
                  ref={(video) => {
                    if (video && video.srcObject !== stream) {
                      video.srcObject = stream;
                    }
                  }} 
                />
                <div className="participant-label">Participant</div>
                {raisedHands[peerId] && (
                  <div className="hand-indicator">
                    <Hand size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <MeetingControls 
            isMuted={isMuted} 
            isVideoOff={isVideoOff} 
            isChatOpen={isChatOpen}
            isHandRaised={isHandRaised}
            onToggleMute={toggleMute} 
            onToggleVideo={toggleVideo} 
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onToggleHand={toggleHand}
            onLeave={handleLeave} 
          />
        </div>

        {isChatOpen && roomId && (
          <ChatPanel roomId={roomId} onClose={() => setIsChatOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;
