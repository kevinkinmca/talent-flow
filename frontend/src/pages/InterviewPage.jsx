import { 
  StreamVideo, 
  StreamVideoClient, 
  StreamCall, 
  StreamTheme, 
  CallControls, 
  PaginatedGridLayout, // <--- CHANGED: Imported Grid Layout
  CallParticipantsList 
} from '@stream-io/video-react-sdk';
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Loader2 } from 'lucide-react';

// Make sure this matches your .env VITE_STREAM_API_KEY
const apiKey = "mptsv46er4qt"; 

const InterviewPage = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // <--- This grabs the ID from the URL!
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

    // 1. Initialize Client
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

    // 2. Join the Specific Call (using the ID from URL)
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
            {/* Video Area */}
            <div className="flex-1 p-4">
               {/* CHANGED: Uses Grid Layout for side-by-side view */}
               <PaginatedGridLayout />
            </div>
            
            {/* Controls */}
            <div className="p-4 bg-gray-800 flex justify-center gap-4 border-t border-gray-700">
              <CallControls onLeave={() => navigate(authUser.role === 'interviewer' ? '/admin' : '/')} />
            </div>
          </StreamTheme>
        </StreamCall>
      </StreamVideo>
    </div>
  );
};

export default InterviewPage;