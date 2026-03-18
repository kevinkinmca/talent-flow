import { useState, useEffect } from "react"; 
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Video, CheckCircle, XCircle, AlertCircle } from "lucide-react"; 
import axios from "axios"; 

const HomePage = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  
  const [history, setHistory] = useState([]); 
  const [upcoming, setUpcoming] = useState([]); // <--- State for scheduled interviews

  // Redirect Admin
  useEffect(() => {
    if (authUser?.role === "interviewer") {
      navigate("/admin");
    }
  }, [authUser, navigate]);

  // --- Fetch Candidate Dashboard Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (authUser?._id) {
            // 1. Fetch History (Completed)
            const historyRes = await axios.get(`http://10.10.159.188:3000/api/interview/history/${authUser._id}`);
            setHistory(historyRes.data);

            // 2. Fetch Upcoming (Scheduled)
            const upcomingRes = await axios.get(`http://10.10.159.188:3000/api/interview/upcoming/${authUser._id}`);
            setUpcoming(upcomingRes.data);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };
    fetchData();
  }, [authUser]);

  const handleJoin = () => {
    if (meetingCode.trim()) {
      navigate(`/interview/${meetingCode}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* 1. Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {authUser?.name || "Candidate"}!
        </h1>
        <p className="text-blue-100 text-lg mb-6">
          Ready for your evaluation? Enter the meeting code provided by your interviewer.
        </p>
        
        {/* Join Interview Interface */}
        <div className="bg-white/10 p-4 rounded-xl max-w-md backdrop-blur-sm border border-white/20">
            <label className="block text-sm font-medium text-blue-100 mb-2">Join Instant Room</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Enter Meeting Code"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-white"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                />
                <button 
                    onClick={handleJoin}
                    disabled={!meetingCode}
                    className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    Join <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* --- UPCOMING CARD --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upcoming</h3>
              <p className="text-sm text-gray-500">Scheduled sessions</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
             {upcoming.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                    <p>No upcoming interviews scheduled</p>
                </div>
             ) : (
                upcoming.map((item) => {
                    const scheduledDate = new Date(item.scheduledDate);
                    return (
                        <div key={item._id} className="p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-gray-800 text-sm">
                                    {scheduledDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-xs text-gray-600 font-medium mt-1 bg-white px-2 py-0.5 rounded border border-purple-100 inline-block">
                                    <Clock size={10} className="inline mr-1 mb-0.5"/> 
                                    {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                            <button 
                                onClick={() => navigate(`/interview/${item.roomId}`)} 
                                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-purple-700 transition transform group-hover:scale-105"
                            >
                                <Video size={16} /> Join
                            </button>
                        </div>
                    )
                })
             )}
          </div>
        </div>

        {/* --- HISTORY CARD --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">History</h3>
              <p className="text-sm text-gray-500">Past recordings</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                    <p>No past interviews found</p>
                </div>
            ) : (
                history.map((item) => (
                    <div key={item._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-800 text-sm">Code: {item.roomId}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(item.startTime).toLocaleDateString()} at {new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                        
                        {/* Status & Verdict Badges */}
                        <div className="flex flex-col items-end gap-1">
                            {/* 1. Meeting Status (Live/Completed) */}
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                                item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {item.status}
                            </span>

                            {/* 2. Verdict / Score (Pass/Fail/Pending) */}
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-gray-400 font-medium uppercase">Result:</span>
                                {item.verdict === 'Pass' && <span className="flex items-center gap-1 text-[11px] font-bold text-green-600"><CheckCircle size={10}/> Pass</span>}
                                {item.verdict === 'Fail' && <span className="flex items-center gap-1 text-[11px] font-bold text-red-600"><XCircle size={10}/> Fail</span>}
                                {item.verdict === 'Pending' && <span className="flex items-center gap-1 text-[11px] font-bold text-yellow-600"><AlertCircle size={10}/> Pending</span>}
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;