// src/App.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import {
  Users,
  MessageSquare,
  Share2,
  Code2,
  Video as VideoIcon,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Lock,
  Rocket,
} from 'lucide-react';
import { useEditor } from './context/EditorContext';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
// import Avatar from './components/Avatar';

// Pick backend URL based on env (dev vs prod)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AVATAR_OPTIONS = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
  "/avatars/avatar7.png",
  "/avatars/avatar8.png",
  "/avatars/avatar9.png",
  "/avatars/avatar10.png",
];

const ALL_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
];

// STUN server for WebRTC (for demo / dev)
const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

// ----------- Video Tile Component -------------
interface VideoTileProps {
  stream: MediaStream;
  label: string;
  isLocal: boolean;
  speakerEnabled: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  label,
  isLocal,
  speakerEnabled,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-purple-500/50 bg-black/50 aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || !speakerEnabled}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] px-2 py-0.5 text-white font-semibold">
        {label}
      </div>
    </div>
  );
};
// ------------------------------------------------

// ------------------------------------------------
// Force Redeploy: Triggering new build
function App() {
  const {
    roomId,
    setRoomId,
    users,
    setUsers,
    currentUser,
    setCurrentUser,
    avatar,
    setAvatar,
    messages,
    addMessage,
  } = useEditor();

  const socketRef = useRef<Socket | null>(null);

  const [userName, setUserName] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [language, setLanguage] = useState('javascript');

  const [view, setView] = useState<'join' | 'create'>('create');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [roomNameForCreation, setRoomNameForCreation] = useState('');

  // Judge0 runner
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  // Video call state
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null); // Ref for immediate access
  const [remoteStreams, setRemoteStreams] = useState<{
    [socketId: string]: MediaStream;
  }>({});
  const peerConnections = useRef<{
    [socketId: string]: RTCPeerConnection;
  }>({});
  const iceCandidatesQueue = useRef<{
    [socketId: string]: RTCIceCandidateInit[];
  }>({});

  // Media toggles
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  const [code, setCode] = useState<string>('');
  const [stdin, setStdin] = useState<string>(''); // Manual Input State
  // A "safety net" function to prevent setting code to an object
  const safeSetCode = (newCode: any) => {
    if (typeof newCode === 'string') {
      setCode(newCode);
    } else {
      // If it's not a string, log an error and do nothing.
      // This prevents the "Objects are not valid as a React child" crash.
      console.error("❌ Invalid data received for 'code' state. Expected a string, but got:", newCode);
    }
  };

  // ---------- URL Room handling ----------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rid = params.get('room');
    if (rid) setRoomIdToJoin(rid.toUpperCase());
  }, []);

  // ---------- Core Socket.IO setup ----------
  useEffect(() => {
    if (!socketRef.current) {
      const s = io(API_BASE_URL, {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      socketRef.current = s;
    }

    const s = socketRef.current;
    if (!s) return;

    const onConnect = () =>
      console.log('✅ Connected to server, socket id:', s.id);
    const onConnectError = (err: any) => {
      console.error('❌ Socket connect_error:', err?.message || err);
      toast.error('Failed to connect to server');
    };

    const onCodeUpdate = (data: {
      roomId: string;
      code: string;
      userId: string;
    }) => {
      const isSelf = data.userId === s.id;
      if (!isSelf && typeof data.code === 'string') {
        safeSetCode(data.code);
      }
    };

    const onLanguageUpdate = (newLanguage: string) => {
      setLanguage(newLanguage);
    };

    const onInputUpdate = (newInput: string) => {
      setStdin(newInput);
    };

    const onUsersUpdate = (usersList: any[]) => {
      setUsers(usersList);
      if (usersList.some((u) => u.socketId === s.id)) {
        setIsJoined(true);
      }
    };

    const onNewMessage = (msg: any) => addMessage(msg);

    const onRoomCreated = (data: { roomId: string; users: any[] }) => {
      setRoomId(data.roomId);
      setUsers(data.users);
      setCurrentUser(userName);
      setIsJoined(true);

      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('room', data.roomId);
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?${urlParams}`,
      );

      toast.success(`Room "${data.roomId}" created!`);
    };

    const onJoinError = (message: string) => {
      toast.error(message);
      setIsJoined(false);
    };

    const onJoinSuccess = () => {
      setIsJoined(true);
      toast.success(`Joined room ${roomIdToJoin}!`);
    };

    const onDisconnect = () => {
      console.log('🔌 Disconnected from server');
      // We keep editor state; the user can refresh to reconnect.
    };

    s.on('connect', onConnect);
    s.on('connect_error', onConnectError);
    s.on('code-update', onCodeUpdate);
    s.on('language-update', onLanguageUpdate);
    s.on('input-update', onInputUpdate);
    s.on('users-update', onUsersUpdate);
    s.on('new-message', onNewMessage);
    s.on('room-created', onRoomCreated);
    s.on('join-error', onJoinError);
    s.on('join-success', onJoinSuccess);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('connect_error', onConnectError);
      s.off('code-update', onCodeUpdate);
      s.off('language-update', onLanguageUpdate);
      s.off('input-update', onInputUpdate);
      s.off('users-update', onUsersUpdate);
      s.off('new-message', onNewMessage);
      s.off('room-created', onRoomCreated);
      s.off('join-error', onJoinError);
      s.off('join-success', onJoinSuccess);
      s.off('disconnect', onDisconnect);
    };
  }, [addMessage, roomIdToJoin, safeSetCode, setUsers, setCurrentUser, setRoomId, userName]);

  // ---------- WebRTC helper ----------
  const createPeerConnection = useCallback(
    (otherSocketId: string) => {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnections.current[otherSocketId] = pc;

      // Use ref to get the current stream immediately
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStreams((prev) => ({
          ...prev,
          [otherSocketId]: remoteStream,
        }));
      };

      pc.onicecandidate = (event) => {
        const s = socketRef.current;
        if (event.candidate && s && roomId) {
          s.emit('webrtc-ice-candidate', {
            roomId,
            to: otherSocketId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      return pc;
    },
    [localStream, roomId],
  );

  // ---------- WebRTC signalling listeners ----------
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    // In App.tsx useEffect (client signalling setup)

    const onCallPeersList = (peerIds: string[]) => {
      // Use ref for check
      if (!localStreamRef.current || !roomId) return;

      // For every peer already in the room, initiate an offer IF my ID is "larger"
      peerIds.forEach(peerId => {
        // Deterministic tie-breaker: Only the "larger" ID sends the offer
        if (s.id > peerId) {
          if (!peerConnections.current[peerId]) {
            const pc = createPeerConnection(peerId);
            pc.createOffer().then((offer) => {
              pc.setLocalDescription(offer).then(() => {
                s.emit('webrtc-offer', { roomId, to: peerId, offer });
              });
            });
          }
        }
      });
    };
    s.on('call-peers-list', onCallPeersList);
    // ... remember to add s.off('call-peers-list', onCallPeersList) in cleanup

    const onUserJoinedCall = async (otherSocketId: string) => {
      // Check if *we* have an active local stream OR if the new person is the broadcaster
      // We will always try to create a connection if we detect a new peer.

      if (!roomId || !s) return;

      // --- CRUCIAL CHECK ---
      // Only create connection if we aren't already connected to them
      if (peerConnections.current[otherSocketId]) {
        console.log(`Already peering with ${otherSocketId}`);
        return;
      }

      // Deterministic tie-breaker: Only the "larger" ID sends the offer
      if (s.id > otherSocketId) {
        const pc = createPeerConnection(otherSocketId);
        if (localStreamRef.current) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          s.emit('webrtc-offer', { roomId, to: otherSocketId, offer });
        }
      }
    };


    const onWebrtcOffer = async (data: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      if (!roomId) return;

      const pc = createPeerConnection(data.from);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Process queued candidates
      const queue = iceCandidatesQueue.current[data.from];
      if (queue) {
        for (const candidate of queue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding queued ICE candidate', err);
          }
        }
        delete iceCandidatesQueue.current[data.from];
      }

      s.emit('webrtc-answer', {
        roomId,
        to: data.from,
        answer,
      });
    };

    const onWebrtcAnswer = async (data: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const pc = peerConnections.current[data.from];
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

      // Process queued candidates
      const queue = iceCandidatesQueue.current[data.from];
      if (queue) {
        for (const candidate of queue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding queued ICE candidate', err);
          }
        }
        delete iceCandidatesQueue.current[data.from];
      }
    };

    const onWebrtcIceCandidate = async (data: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnections.current[data.from];
      if (!pc) return;

      // Queue if remote description is not set yet
      if (!pc.remoteDescription) {
        if (!iceCandidatesQueue.current[data.from]) {
          iceCandidatesQueue.current[data.from] = [];
        }
        iceCandidatesQueue.current[data.from].push(data.candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('Error adding ICE candidate', err);
      }
    };

    const onUserLeftCall = (otherSocketId: string) => {
      const pc = peerConnections.current[otherSocketId];
      if (pc) {
        pc.close();
        delete peerConnections.current[otherSocketId];
      }
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[otherSocketId];
        return copy;
      });
    };

    const onRunOutput = (data: { output: string; language: string }) => {
      console.log('Received run-output payload:', data);
      setOutput(data.output);
      setLanguage(data.language);
      // optional: sync language if you want:
      // setLanguage(data.language);
    };

    s.on('user-joined-call', onUserJoinedCall);
    s.on('webrtc-offer', onWebrtcOffer);
    s.on('webrtc-answer', onWebrtcAnswer);
    s.on('webrtc-ice-candidate', onWebrtcIceCandidate);
    s.on('user-left-call', onUserLeftCall);
    s.on('run-output', onRunOutput);

    return () => {
      s.off('user-joined-call', onUserJoinedCall);
      s.off('webrtc-offer', onWebrtcOffer);
      s.off('webrtc-answer', onWebrtcAnswer);
      s.off('webrtc-ice-candidate', onWebrtcIceCandidate);
      s.off('user-left-call', onUserLeftCall);
      s.off('call-peers-list', onCallPeersList);
      s.off('run-output', onRunOutput);
    };
  }, [localStream, roomId, createPeerConnection]);

  // ---------- Video Call Controls ----------
  const startCall = async () => {
    const s = socketRef.current;
    if (!roomId || !s) {
      toast.error('Join a room first');
      return;
    }
    if (inCall) {
      toast('Already in call');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream; // Update ref immediately
      setInCall(true);
      setVideoEnabled(true);
      setAudioEnabled(true);
      setSpeakerEnabled(true);



      s.emit('join-call', roomId);
      // NEW: Ask who is already in the signalling room so I can offer them immediately
      s.emit('get-call-peers', roomId);
    } catch (err: any) {
      console.error('getUserMedia error', err);
      toast.error('Could not access camera/microphone: ' + err.name);
    }
  };

  const leaveCall = () => {
    const s = socketRef.current;
    if (!inCall || !s) return;

    s.emit('leave-call', roomId);

    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    localStreamRef.current = null; // Clear ref
    setRemoteStreams({});
    setInCall(false);
    setVideoEnabled(true);
    setAudioEnabled(true);
    setSpeakerEnabled(true);
  };

  const toggleVideo = () => {
    if (!localStream) {
      toast.error('Not in a call');
      return;
    }
    const newEnabled = !videoEnabled;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = newEnabled;
    });
    setVideoEnabled(newEnabled);
  };

  const toggleAudio = () => {
    if (!localStream) {
      toast.error('Not in a call');
      return;
    }
    const newEnabled = !audioEnabled;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = newEnabled;
    });
    setAudioEnabled(newEnabled);
  };

  const toggleSpeaker = () => {
    const newEnabled = !speakerEnabled;
    setSpeakerEnabled(newEnabled);
  };

  // ---------- Room join/create ----------
  const joinRoom = () => {
    const s = socketRef.current;
    if (!userName.trim()) return toast.error('Enter your name!');
    if (!roomIdToJoin.trim()) return toast.error('Room ID is required!');
    if (!avatar) return toast.error('Please choose an avatar!');
    if (!s || !s.connected) return toast.error('Not connected to server yet');

    const rid = roomIdToJoin.toUpperCase();
    setRoomId(rid);
    setCurrentUser(userName);

    s.emit('join-room', { roomId: rid, userName, avatar });
  };

  const handleCreateRoom = () => {
    const s = socketRef.current;
    if (!userName.trim()) return toast.error('Enter your name!');
    if (!roomNameForCreation.trim())
      return toast.error('Enter a room name!');
    if (!avatar) return toast.error('Please choose an avatar!');
    if (!s || !s.connected) return toast.error('Not connected to server yet');

    setCurrentUser(userName);
    s.emit('create-room', { roomName: roomNameForCreation, userName, avatar });
  };

  // ---------- Chat ----------
  const sendMessage = () => {
    const s = socketRef.current;
    if (!inputMessage.trim() || !s || !roomId) return;

    s.emit('chat-message', {
      roomId,
      message: inputMessage,
      userName: currentUser || userName || 'Anonymous',
      avatar,
    });
    setInputMessage('');
  };

  // ---------- Share ----------
  const copyLink = () => {
    if (!roomId) return toast.error('No room ID available');
    const link = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('Room link copied!');
  };

  // ---------- Run code via Judge0 ----------
  const runCode = async (codeToRun: string, lang: string) => {
    if (!codeToRun.trim()) {
      toast.error('Nothing to run');
      return;
    }

    setIsRunning(true);
    setOutput('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToRun, language: lang, stdin }), // Send stdin
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Execution failed');
      }

      let out = '';
      if (data.stdout) out += data.stdout;
      if (data.stderr) out += (out ? '\n' : '') + data.stderr;
      if (data.compile_output)
        out += (out ? '\n' : '') + data.compile_output;

      const finalOutput = out || '(no output)';
      setOutput(finalOutput);

      // 🔥 Broadcast this output to everyone in the room
      const s = socketRef.current;
      if (s && roomId) {
        s.emit('run-output', {
          roomId,
          output: finalOutput,
          language: lang,
        });
      }
    } catch (err: any) {
      console.error(err);
      setOutput(`Error: ${err.message || 'Run failed'}`);
      toast.error(err.message || 'Run failed');
    } finally {
      setIsRunning(false);
    }
  };
  // ---------------- LOGIN / ROOM SELECTION ----------------
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 font-sans overflow-hidden relative">
        <Toaster position="top-right" />

        {/* Ambient Background Glows - Restored and Blue-themed */}
        {/* Ambient Background Glows - Subtle and Deep */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '2s' }} />

        {/* Title Section - Standard Flow with Margin */}
        <div className="text-center mb-12 z-20 mt-10">
          <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            Code With <span className="text-blue-500">Bandhu</span>
          </h1>
          <div className="w-32 h-1.5 bg-blue-600 mx-auto mt-4 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md md:max-w-4xl relative z-10"
        >
          <div className="glass-panel rounded-3xl animate-float border-t-4 border-blue-600 bg-[#111111] shadow-2xl shadow-black/50 overflow-hidden">

            {/* Full Width Tabs - Segmented Control Style */}
            <div className="flex w-full bg-[#0a0a0a] p-1.5 border-b border-white/5">
              <button
                onClick={() => setView('join')}
                className={`flex-1 py-3.5 font-bold text-lg rounded-xl transition-all duration-300 ${view === 'join'
                  ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.6)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                Join Room
              </button>
              <button
                onClick={() => setView('create')}
                className={`flex-1 py-3.5 font-bold text-lg rounded-xl transition-all duration-300 ${view === 'create'
                  ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.6)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                Create Room
              </button>
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                {view === 'join' ? (
                  <motion.div
                    key="join"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Inputs */}
                      <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white mb-4">Enter Room Details</h2>

                        <div>
                          <label className="text-sm font-semibold text-gray-400 mb-2 block">Display Name</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              placeholder="e.g., Dev_Guru"
                              className="w-full p-4 bg-[#1a1a1a] border border-blue-500/30 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-gray-400 mb-2 block">Room ID</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                              <Lock size={20} />
                            </div>
                            <input
                              type="text"
                              value={roomIdToJoin}
                              onChange={(e) => setRoomIdToJoin(e.target.value.toUpperCase())}
                              placeholder="Enter 8-digit code"
                              className="w-full p-4 pl-12 bg-[#1a1a1a] border border-blue-500/50 rounded-xl font-mono text-lg text-white placeholder-gray-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                            />
                          </div>
                        </div>

                        <button
                          onClick={joinRoom}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-xl shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 mt-4"
                        >
                          JOIN
                        </button>


                      </div>

                      {/* Right Column: Recent Rooms (Avatars) */}
                      <div className="border-l border-white/5 pl-8 hidden md:block">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Recent Rooms</h2>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                          {AVATAR_OPTIONS.slice(0, 12).map((url) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => setAvatar(url)}
                              className={`relative rounded-full transition-all duration-200 group ${avatar === url
                                ? 'ring-2 ring-blue-500 scale-110 z-10'
                                : 'hover:scale-105 opacity-70 hover:opacity-100'
                                }`}
                            >
                              <img
                                src={url}
                                alt="avatar"
                                className="w-full h-full rounded-full object-cover bg-[#1a1a1a] border border-blue-500/20 group-hover:border-blue-500/50"
                              />
                              {/* Status Dot */}
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#111111]"></div>
                            </button>
                          ))}
                        </div>


                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="create"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Inputs */}
                      <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Room</h2>

                        <div>
                          <label className="text-sm font-semibold text-gray-400 mb-2 block">Display Name</label>
                          <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="e.g., Code_Master"
                            className="w-full p-4 bg-[#1a1a1a] border border-blue-500/50 rounded-xl text-white placeholder-gray-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-gray-400 mb-2 block">Room Name</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                              <MessageSquare size={20} />
                            </div>
                            <input
                              type="text"
                              value={roomNameForCreation}
                              onChange={(e) => setRoomNameForCreation(e.target.value)}
                              placeholder="My Awesome Project"
                              className="w-full p-4 pl-12 bg-[#1a1a1a] border border-blue-500/30 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleCreateRoom}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-xl shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 mt-4"
                        >
                          CREATE ROOM
                        </button>
                      </div>

                      {/* Right Column: Recent Rooms (Avatars) */}
                      <div className="border-l border-white/5 pl-8 hidden md:block">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Choose Avatar</h2>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                          {AVATAR_OPTIONS.slice(0, 12).map((url) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => setAvatar(url)}
                              className={`relative rounded-full transition-all duration-200 group ${avatar === url
                                ? 'ring-2 ring-blue-500 scale-110 z-10'
                                : 'hover:scale-105 opacity-70 hover:opacity-100'
                                }`}
                            >
                              <img
                                src={url}
                                alt="avatar"
                                className="w-full h-full rounded-full object-cover bg-[#1a1a1a] border border-blue-500/20 group-hover:border-blue-500/50"
                              />
                              {/* Status Dot */}
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#111111]"></div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex justify-center gap-8 mt-8 text-gray-500 text-sm">
            <a href="#" className="hover:text-blue-500 transition-colors">About</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Contact Support</a>
          </div>
          <div className="text-center text-gray-600 text-xs mt-4">
            © 2024 Code With Bandhu
          </div>
        </motion.div>
      </div>
    );
  }

  // ------------------ MAIN EDITOR / WORKSPACE ------------------
  return (
    <div className="relative flex min-h-screen flex-col bg-[#0c0a09] text-white overflow-y-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-900/20">
            <Code2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Code With <span className="text-blue-500">Bandhu</span>
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${isJoined ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                {isJoined ? 'Connected' : 'Disconnected'}
              </span>
              <span>•</span>
              <span>Room: {roomId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                const s = socketRef.current;
                if (s && roomId) {
                  s.emit('language-change', { roomId, language: e.target.value });
                }
              }}
              className="bg-transparent text-sm font-medium text-gray-300 focus:outline-none px-2 py-1"
            >
              {ALL_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-[#1a1a1a] text-white">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={copyLink}
            className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#252525] hover:text-white transition-colors border border-white/5"
            title="Copy Room Link"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={() => runCode(code, language)}
            disabled={isRunning}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-lg transition-all ${isRunning
              ? 'bg-gray-600 cursor-not-allowed opacity-70'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-900/20 hover:-translate-y-0.5'
              }`}
          >
            {isRunning ? (
              <>Running...</>
            ) : (
              <>
                <Rocket size={16} /> Run
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Users & Chat */}
        <div className="hidden md:flex w-72 flex-col border-r border-white/10 bg-[#0a0a0a]">
          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4 text-gray-400 uppercase text-xs font-bold tracking-wider">
              <Users size={14} />
              <span>Active Users ({users.length})</span>
            </div>
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.socketId} className="flex items-center gap-3 group">
                  <div className="relative">
                    <img
                      src={u.avatar || '/avatars/avatar1.png'}
                      alt={u.username}
                      className="h-10 w-10 rounded-full border-2 border-[#1a1a1a] bg-[#1a1a1a]"
                    />
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0a0a0a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                      {u.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {u.socketId === socketRef.current?.id ? '(You)' : 'Online'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area - Fixed Height */}
          <div className="h-[350px] flex flex-col flex-none border-t border-white/10 bg-[#0f0f0f]">
            <div className="p-3 border-b border-white/10 flex items-center gap-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
              <MessageSquare size={14} />
              <span>Room Chat</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.userName === (currentUser || userName);
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <img
                          src={msg.avatar}
                          className="w-6 h-6 rounded-full bg-[#1a1a1a]"
                          alt="avatar"
                        />
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm ${isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-[#1a1a1a] text-gray-200 rounded-bl-none border border-white/5'
                          }`}
                      >
                        <p>{msg.message}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-600 mt-1 px-1">
                      {isMe ? 'You' : msg.userName}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-white/10 bg-[#0a0a0a]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
                />
                <button
                  onClick={sendMessage}
                  className="bg-[#1a1a1a] hover:bg-blue-600 text-gray-400 hover:text-white p-2.5 rounded-xl transition-all border border-white/10 hover:border-blue-500"
                >
                  <Rocket size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0c0a09]">
          {/* Video Call Strip (if active) */}
          {inCall && (
            <div className="h-48 border-b border-white/10 bg-[#0a0a0a] p-4">
              <div className="flex gap-4 overflow-x-auto h-full pb-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
                {localStream && (
                  <div className="flex-shrink-0 w-64 h-full">
                    <VideoTile
                      stream={localStream}
                      label="You"
                      isLocal={true}
                      speakerEnabled={speakerEnabled}
                    />
                  </div>
                )}
                {Object.entries(remoteStreams).map(([sid, stream]) => {
                  const user = users.find(u => u.socketId === sid);
                  return (
                    <div key={sid} className="flex-shrink-0 w-64 h-full">
                      <VideoTile
                        stream={stream}
                        label={user ? user.username : `User ${sid.slice(0, 4)}`}
                        isLocal={false}
                        speakerEnabled={speakerEnabled}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language}
              value={code}
              theme="vs-dark"
              onChange={(val) => {
                if (val !== undefined) {
                  // Update local state immediately
                  setCode(val);

                  // Emit to server
                  const s = socketRef.current;
                  if (s && roomId) {
                    s.emit('code-change', { roomId, code: val });
                  }
                }
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                formatOnPaste: true,
                formatOnType: true,
              }}
            />

            {/* Floating Video Controls */}
            <div className="absolute bottom-6 right-6 flex gap-2">
              {!inCall ? (
                <button
                  onClick={startCall}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg shadow-blue-900/30 transition-all transform hover:-translate-y-1 font-semibold"
                >
                  <VideoIcon size={20} />
                  <span>Join Call</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-[#1a1a1a] p-2 rounded-full border border-white/10 shadow-xl backdrop-blur-md">
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-all ${videoEnabled ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-blue-500/20 text-blue-500'}`}
                    title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {videoEnabled ? <VideoIcon size={20} /> : <VideoOff size={20} />}
                  </button>
                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full transition-all ${audioEnabled ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-blue-500/20 text-blue-500'}`}
                    title={audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
                  >
                    {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                  <button
                    onClick={toggleSpeaker}
                    className={`p-3 rounded-full transition-all ${speakerEnabled ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-blue-500/20 text-blue-500'}`}
                    title={speakerEnabled ? 'Mute Speaker' : 'Unmute Speaker'}
                  >
                    {speakerEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button
                    onClick={leaveCall}
                    className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
                    title="Leave Call"
                  >
                    <VideoOff size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Input Panel */}
          <div className="h-32 border-t border-white/10 bg-[#0a0a0a] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#111]">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Input (stdin)</span>
              <button
                onClick={() => setStdin('')}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => {
                const val = e.target.value;
                setStdin(val);
                const s = socketRef.current;
                if (s && roomId) {
                  s.emit('input-change', { roomId, value: val });
                }
              }}
              placeholder="Enter input for your program here..."
              className="flex-1 p-4 bg-[#0a0a0a] text-gray-300 font-mono text-sm resize-none focus:outline-none"
            />
          </div>

          {/* Output Panel */}
          {output && (
            <div className="h-48 border-t border-white/10 bg-[#0a0a0a] flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#111]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Terminal Output</span>
                <button
                  onClick={() => setOutput('')}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto font-mono text-sm">
                <pre className={`${output.startsWith('Error') ? 'text-red-400' : 'text-gray-300'}`}>
                  {output}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;