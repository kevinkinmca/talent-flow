import { 
  StreamVideo, 
  StreamVideoClient, 
  StreamCall, 
  StreamTheme, 
  CallControls, 
  PaginatedGridLayout, 
  SpeakerLayout, // <--- 1. Import SpeakerLayout
  useCallStateHooks // <--- 2. Import this hook
} from '@stream-io/video-react-sdk';
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Loader2 } from 'lucide-react';
import CodeEditor from "../components/CodeEditor"; 

const apiKey = "mptsv46er4qt"; // Make sure this matches your .env

// --- NEW COMPONENT: HANDLES THE UI INSIDE THE CALL ---
const MeetingRoom = () => {
  const navigate = useNavigate();
  const { useHasOngoingScreenShare } = useCallStateHooks(); // Detect screen share
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const { authUser } = useAuth();
  const { id } = useParams();

  return (
    <div className="flex-1 flex overflow-hidden">
      
      {/* LEFT SIDE: Video & Controls (40% width) */}
      <div className="w-[40%] flex flex-col border-r border-gray-700 bg-gray-900">
         
         {/* Video Area */}
         <div className="flex-1 p-2 overflow-y-auto custom-scrollbar relative">
            {/* LOGIC: 
              If screen share is active -> Use SpeakerLayout (Big Screen + Small Faces)
              If normal talking -> Use Grid (Side-by-side equal size)
            */}
            {hasOngoingScreenShare ? (
              <SpeakerLayout participantsBarPosition="bottom" />
            ) : (
              <PaginatedGridLayout 
                  groupSize={2} 
                  participantBarPosition="bottom"
              />
            )}
         </div>
         
         {/* Controls Bar */}
         <div className="p-4 bg-gray-800 flex justify-center gap-4 border-t border-gray-700 shrink-0">
            <CallControls onLeave={() => navigate(authUser.role === 'interviewer' ? '/admin' : '/')} />
         </div>
      </div>

      {/* RIGHT SIDE: Code Editor (60% width) */}
      <div className="flex-1 bg-[#1e1e1e] flex flex-col">
        <CodeEditor roomId={id} />
      </div>

    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const InterviewPage = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }

    if (!authUser.streamToken) {
       console.error("No Stream Token found!");
       return;
    }

    const myClient = new StreamVideoClient({
      apiKey,
      user: {
        id: authUser._id,
        name: authUser.name,
        image: authUser.image || `https://getstream.io/random_png/?name=${authUser.name}`,
      },
      token: authUser.streamToken,
    });

    setClient(myClient);

    const myCall = myClient.call('default', id);
    myCall.join({ create: true });
    setCall(myCall);

    return () => {
      myClient.disconnectUser();
      setClient(null);
      setCall(null);
    };
  }, [authUser, id, navigate]);

  if (!client || !call) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-500">Joining Interview Room...</span>
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] bg-gray-900 text-white flex flex-col">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <StreamTheme>
             {/* RENDER THE NEW MEETING ROOM COMPONENT */}
             <MeetingRoom />
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
};

export default InterviewPage;