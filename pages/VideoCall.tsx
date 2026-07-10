import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socketService';

const VideoCall: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!session) return;
    const socket = getSocket();
    if (!socket) return;

    const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    const createPC = async () => {
      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate && userId) {
          socket.emit('webrtc:ice', { targetUserId: userId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
      }

      return pc;
    };

    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (_) {
        setMsg('Camera/mic access denied');
      }
    };

    startLocalStream();

    socket.on('webrtc:offer', async ({ fromUserId, offer }) => {
      if (!userId || fromUserId !== userId) return;
      setCallStatus('ringing');
      const pc = await createPC();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { targetUserId: userId, answer });
      setCallStatus('connected');
    });

    socket.on('webrtc:answer', async ({ fromUserId, answer }) => {
      if (!userId || fromUserId !== userId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setCallStatus('connected');
    });

    socket.on('webrtc:ice', async ({ fromUserId, candidate }) => {
      if (!userId || fromUserId !== userId || !pcRef.current) return;
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
    });

    socket.on('webrtc:end', () => {
      cleanup();
      navigate(-1);
    });

    return () => { cleanup(); socket.off('webrtc:offer'); socket.off('webrtc:answer'); socket.off('webrtc:ice'); socket.off('webrtc:end'); };
  }, [userId, session]);

  const [msg, setMsg] = useState('');

  const startCall = async () => {
    if (!userId || !session) return;
    const socket = getSocket();
    if (!socket) return;
    setCallStatus('calling');
    try {
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }
      const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('webrtc:ice', { targetUserId: userId, candidate: e.candidate });
      };

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };

      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:offer', { targetUserId: userId, offer });
    } catch (err: any) { setMsg(err.message); setCallStatus('idle'); }
  };

  const cleanup = () => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    setCallStatus('idle');
  };

  const endCall = () => {
    const socket = getSocket();
    if (socket && userId) socket.emit('webrtc:end', { targetUserId: userId });
    cleanup();
    navigate(-1);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      {msg && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-purple-900/80 text-white text-sm px-4 py-2 rounded-xl">{msg}</div>}

      <div className="relative h-screen flex flex-col">
        <div className="flex-1 relative bg-[#0a0a1a]">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
          {callStatus === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl mb-4">📹</p>
                <p className="text-white/60">Waiting to connect...</p>
                <button onClick={startCall} className="mt-4 bg-emerald-600 text-white font-bold px-8 py-3 rounded-2xl">Start Call</button>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 right-4 w-32 h-48 rounded-2xl overflow-hidden border-2 border-white/20 bg-[#1a1a2e] shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="bg-[#0f0f1a]/90 backdrop-blur-xl p-4 flex items-center justify-center gap-4">
          <button onClick={toggleMute} className={`p-4 rounded-full ${isMuted ? 'bg-red-600' : 'bg-white/10'} text-white text-xl`}>
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button onClick={endCall} className="p-4 rounded-full bg-red-600 text-white text-xl shadow-lg shadow-red-600/30">📞</button>
          <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-white/10'} text-white text-xl`}>
            {isVideoOff ? '🚫' : '📷'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
