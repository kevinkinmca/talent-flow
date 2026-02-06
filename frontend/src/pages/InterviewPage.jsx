import { 
  StreamVideo, 
  StreamVideoClient, 
  StreamCall, 
  StreamTheme, 
  PaginatedGridLayout, 
  SpeakerLayout, 
  useCallStateHooks, 
  useCall
} from '@stream-io/video-react-sdk';
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Loader2, Send, Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, MonitorUp, AlertTriangle, RefreshCw, EyeOff, MoveHorizontal } from 'lucide-react';
import CodeEditor from "../components/CodeEditor"; 
import io from "socket.io-client"; 
import toast from "react-hot-toast";
import * as faceapi from 'face-api.js'; 

const apiKey = "mptsv46er4qt"; 

const MeetingRoom = () => {
  const navigate = useNavigate();
  const call = useCall(); 
  
  const { useMicrophoneState, useCameraState, useParticipantCount, useHasOngoingScreenShare, useLocalParticipant } = useCallStateHooks();
  
  const { isEnabled: isMicOn } = useMicrophoneState();
  const { isEnabled: isCamOn } = useCameraState();
  const participantCount = useParticipantCount();
  const hasOngoingScreenShare = useHasOngoingScreenShare(); 

  const { authUser } = useAuth();
  const { id: roomId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [socket, setSocket] = useState(null);
  
  // Face & Head Detection State
  const localParticipant = useLocalParticipant();
  const videoRef = useRef(null); 
  const [modelsLoaded, setModelsLoaded] = useState(false);
  // We still keep the state to track logic, even if we don't display the badge
  const [faceWarning, setFaceWarning] = useState(""); 
  const lastWarningTime = useRef(0);

  // 1. Setup Socket
  useEffect(() => {
    // UPDATE YOUR IP HERE
    const newSocket = io("http://192.168.5.35:3000"); 
    setSocket(newSocket);
    newSocket.emit("join-room", roomId);

    newSocket.on("question-update", (questionData) => {
      setQuestions((prev) => [...prev, questionData]);
    });

    newSocket.on("meeting-ended", () => {
        toast.error("Host has ended the meeting.");
        navigate("/"); 
    });

    return () => newSocket.disconnect();
  }, [roomId, navigate]);

  // 2. Load Face Models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; 
      try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        console.log("Face & Landmark Models Loaded");
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
  }, []);

  // 3. AI Detection Loop
  useEffect(() => {
    if (!modelsLoaded || authUser.role === 'interviewer') return;
    
    const stream = localParticipant?.videoStream;
    if (!stream || !videoRef.current) return;

    videoRef.current.srcObject = stream;

    const detectBehavior = async () => {
      if (!videoRef.current) return;
      
      const detections = await faceapi.detectAllFaces(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      const now = Date.now();
      let currentIssue = ""; 

      // A. FACE COUNT CHECKS
      if (detections.length === 0) {
        currentIssue = "⚠️ ALERT: Face Not Visible!";
      } else if (detections.length > 1) {
        currentIssue = "⚠️ ALERT: Multiple Faces Detected!";
      } else {
        // B. HEAD ROTATION CHECK
        const landmarks = detections[0].landmarks;
        const nose = landmarks.getNose()[3];
        const jaw = landmarks.getJawOutline();
        const leftJaw = jaw[0];
        const rightJaw = jaw[16];

        const distToLeft = Math.abs(nose.x - leftJaw.x);
        const distToRight = Math.abs(nose.x - rightJaw.x);
        const ratio = distToLeft / distToRight;

        if (ratio < 0.5) {
            currentIssue = "⚠️ ALERT: Looking Away (Right)";
        } else if (ratio > 2.0) {
            currentIssue = "⚠️ ALERT: Looking Away (Left)";
        }
      }

      if (currentIssue) {
        setFaceWarning(currentIssue);

        // Only send TOAST/SOCKET if 4 seconds have passed
        if (now - lastWarningTime.current > 4000) {
            toast.error(currentIssue);
            lastWarningTime.current = now;

            if (socket) {
                 const alertData = {
                    id: Date.now(),
                    text: currentIssue,
                    sender: "SYSTEM",
                    time: new Date().toLocaleTimeString()
                };
                socket.emit("question-change", { roomId, question: alertData });
            }
        }
      } else {
        setFaceWarning(""); 
      }
    };

    const interval = setInterval(detectBehavior, 1000); 
    return () => clearInterval(interval);

  }, [modelsLoaded, localParticipant, socket, authUser.role]);


  // Tab Switch Detector
  useEffect(() => {
    if (authUser.role === 'interviewer') return; 
    const handleVisibilityChange = () => {
        if (document.hidden && socket) {
            toast.error("⚠️ WARNING: Tab Switching is Monitored!");
            const alertData = {
                id: Date.now(),
                text: "⚠️ ALERT: Candidate switched tabs!",
                sender: "SYSTEM",
                time: new Date().toLocaleTimeString()
            };
            socket.emit("question-change", { roomId, question: alertData });
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [socket, authUser.role]);

  // Add Question
  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    const questionData = {
      id: Date.now(),
      text: newQuestion,
      sender: authUser.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit("question-change", { roomId, question: questionData });
    setNewQuestion("");
  };

  const handleLeaveCall = async () => {
    if (authUser.role === 'interviewer') {
        if (socket) socket.emit("end-meeting", roomId);
        navigate("/admin");
    } else {
        navigate("/");
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      
      {/* --- HIDDEN VIDEO FOR AI --- */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" 
      />

      {/* --- TOP ROW --- */}
      <div className="h-[50%] bg-gray-900 relative border-b border-gray-700 flex flex-col min-h-0 overflow-hidden">
          
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-2 pointer-events-none">
            <div className="bg-black/60 px-3 py-1 rounded-full text-white text-xs flex items-center gap-2 backdrop-blur-md border border-white/10 w-fit">
                <Users size={12} /> {participantCount} Active
            </div>
            
            {authUser.role === 'candidate' && !hasOngoingScreenShare && (
                <div className="bg-red-600/90 px-3 py-1 rounded-full text-white text-xs flex items-center gap-2 animate-pulse font-bold w-fit">
                    <MonitorUp size={12} /> SHARE SCREEN
                </div>
            )}
            
            {/* REMOVED: The Red Badge Logic has been deleted here.
               The user will still see Toast alerts and Chat Logs, but no persistent red badge.
            */}
          </div>

          <div className="flex-1 w-full h-full relative overflow-hidden">
              {hasOngoingScreenShare ? (
                  <SpeakerLayout participantsBarPosition="right" />
              ) : (
                  <PaginatedGridLayout groupSize={2} participantBarPosition="bottom" videoPlaceholder={false} />
              )}
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
              <button onClick={() => call.microphone.toggle()} className={`p-3 rounded-full text-white transition-all shadow-lg ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500'}`}>
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button onClick={() => call.camera.toggle()} className={`p-3 rounded-full text-white transition-all shadow-lg ${isCamOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500'}`}>
                {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button onClick={() => call.screenShare.toggle()} className={`p-3 rounded-full text-white transition-all shadow-lg ${hasOngoingScreenShare ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
                <MonitorUp size={20} />
              </button>
              <button onClick={handleLeaveCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg">
                <PhoneOff size={20} />
              </button>
          </div>
      </div>

      {/* --- BOTTOM ROW --- */}
      <div className="h-[50%] flex min-h-0 relative z-30 bg-gray-900">
          <div className="w-1/2 bg-gray-900 border-r border-gray-700 flex flex-col">
            <div className="p-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center px-4">
                <h2 className="font-bold text-white text-sm flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-400" /> Questions & Alerts
                </h2>
                <span className="text-[10px] bg-green-900 text-green-200 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                        <p className="text-sm">No questions yet.</p>
                    </div>
                ) : (
                    questions.map((q) => (
                    <div key={q.id} className={`p-3 rounded-lg border shadow-sm ${q.sender === "SYSTEM" ? "bg-red-900/30 border-red-500/50" : "bg-gray-800 border-gray-700"}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-bold ${q.sender === "SYSTEM" ? "text-red-400" : "text-blue-400"}`}>{q.sender}</span>
                            <span className="text-[10px] text-gray-500">{q.time}</span>
                        </div>
                        <p className={`text-sm ${q.sender === "SYSTEM" ? "text-red-200 font-semibold" : "text-white"}`}>{q.text}</p>
                    </div>
                    ))
                )}
            </div>
            {authUser.role === "interviewer" && (
                <div className="p-3 bg-gray-800 border-t border-gray-700 shrink-0">
                    <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Type question..."
                        className="flex-1 bg-black/30 text-white text-sm px-4 py-2 rounded-lg outline-none border border-gray-600 focus:border-blue-500"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                    />
                    <button onClick={handleAddQuestion} className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg"><Send size={18} /></button>
                    </div>
                </div>
            )}
          </div>
          <div className="w-1/2 bg-[#1e1e1e] flex flex-col">
              <CodeEditor roomId={roomId} />
          </div>
      </div>
    </div>
  );
};

const InterviewPage = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    if (!authUser.streamToken) { toast.error("Auth Error"); navigate('/login'); return; }

    let myClient = null;
    let myCall = null;

    const initCall = async () => {
      try {
        myClient = new StreamVideoClient({
            apiKey,
            user: { id: authUser._id, name: authUser.name, image: authUser.image },
            token: authUser.streamToken,
        });
        setClient(myClient);
        myCall = myClient.call('default', id);
        await myCall.join({ create: true });
        setCall(myCall);
      } catch (error) {
        console.error(error);
        if (error.code === 40 || error.message?.includes('expired')) {
            toast.error("Session expired. Please login again.");
            navigate('/login');
        }
      }
    };
    initCall();

    return () => {
        if (myCall) myCall.leave().catch(console.error);
        if (myClient) myClient.disconnectUser().catch(console.error);
        setClient(null); setCall(null);
    };
  }, [authUser, id, navigate]);

  if (!client || !call) return (
    <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-gray-900 flex-col gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <span className="text-gray-400">Loading AI Proctoring...</span>
      <button onClick={() => window.location.reload()} className="text-sm text-blue-400 hover:underline flex items-center gap-2"><RefreshCw size={14} /> Stuck? Reload</button>
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] bg-black text-white flex flex-col">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme><MeetingRoom /></StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
};

export default InterviewPage;