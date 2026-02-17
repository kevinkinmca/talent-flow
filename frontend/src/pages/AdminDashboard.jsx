import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { List, LogOut, Video, Clock, X, CheckCircle, XCircle, AlertCircle, CalendarPlus, Mail, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios"; 

const AdminDashboard = () => {
  const { authUser, logout } = useAuth(); 
  const navigate = useNavigate();
  
  // --- Data States ---
  const [history, setHistory] = useState([]); 
  const [upcoming, setUpcoming] = useState([]); // <--- NEW: State for Admin's scheduled interviews
  
  // --- Modal States ---
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ email: "", date: "", time: "" });

  // --- Fetch Admin Data ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (authUser?._id) {
            // 1. Fetch Past Interviews
            const historyRes = await axios.get(`http://192.168.5.35:3000/api/interview/history/${authUser._id}`);
            setHistory(historyRes.data);

            // 2. Fetch Upcoming Interviews
            const upcomingRes = await axios.get(`http://192.168.5.35:3000/api/interview/upcoming/${authUser._id}`);
            setUpcoming(upcomingRes.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, [authUser]);

  const createNewInterview = () => {
    const randomId = Math.random().toString(36).substring(2, 9);
    navigate(`/interview/${randomId}`);
  };

  const handleUpdateVerdict = async (verdict) => {
    try {
        await axios.post("http://192.168.5.35:3000/api/interview/end", {
            roomId: selectedInterview.roomId,
            verdict: verdict
        });

        setHistory(history.map(item => 
            item.roomId === selectedInterview.roomId 
                ? { ...item, verdict: verdict, status: "Completed" } 
                : item
        ));
        
        setSelectedInterview(null);
        toast.success(`Candidate marked as ${verdict}`);
    } catch (error) {
        console.error("Error saving verdict:", error);
        toast.error("Failed to update result.");
    }
  };

  // --- Handle Schedule Submit ---
  const handleScheduleSubmit = async (e) => {
      e.preventDefault();
      try {
          const combinedDateTime = new Date(`${scheduleData.date}T${scheduleData.time}`).toISOString();
          
          const res = await axios.post("http://192.168.5.35:3000/api/interview/schedule", {
              email: scheduleData.email,
              scheduledDate: combinedDateTime,
              interviewerId: authUser._id
          });

          toast.success("Interview Scheduled Successfully!");
          setShowScheduleModal(false);
          setScheduleData({ email: "", date: "", time: "" });

          // Add the newly created meeting instantly to the UI
          setUpcoming(prev => [...prev, res.data].sort((a,b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)));
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to schedule interview");
      }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Interviewer Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your sessions and review candidate performance.</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition">
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* --- TOP ROW: ACTION CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Card 1: Start Instant Interview */}
        <div 
            onClick={createNewInterview}
            className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group hover:border-blue-500 h-72 flex flex-col items-center justify-center text-center"
        >
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition">
            <Video size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Instant Interview</h2>
          <p className="text-gray-500 mb-8 max-w-xs text-sm">Start a live video session instantly with a unique room code.</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full max-w-[200px] font-medium shadow-lg shadow-blue-200">
            Start Meeting
          </button>
        </div>

        {/* Card 2: Schedule Interview */}
        <div 
            onClick={() => setShowScheduleModal(true)} 
            className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group hover:border-purple-500 h-72 flex flex-col items-center justify-center text-center"
        >
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition">
            <CalendarPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Schedule Interview</h2>
          <p className="text-gray-500 mb-8 max-w-xs text-sm">Invite a candidate to a future meeting using their email address.</p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 w-full max-w-[200px] font-medium shadow-lg shadow-purple-200">
            Schedule
          </button>
        </div>
      </div>

      {/* --- BOTTOM ROW: LIST CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
        {/* --- NEW: Upcoming Interviews Card --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center text-purple-600">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Upcoming Interviews</h2>
              <p className="text-gray-500 text-sm">Scheduled sessions waiting to start.</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
            {upcoming.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Calendar size={40} className="mb-2 opacity-20"/>
                    <p>No upcoming interviews.</p>
                </div>
            ) : (
                upcoming.map((interview) => (
                    <div key={interview._id} className="p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition flex justify-between items-center group">
                        <div>
                            <p className="font-bold text-gray-900">{interview.candidateName || "Unknown Candidate"}</p>
                            <p className="text-xs text-gray-600 mt-1">
                                <Clock size={12} className="inline mr-1 mb-0.5" />
                                {new Date(interview.scheduledDate).toLocaleDateString()} at {new Date(interview.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate(`/interview/${interview.roomId}`)}
                            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-purple-700 transition"
                        >
                            <Video size={16} /> Join
                        </button>
                    </div>
                ))
            )}
          </div>
        </div>

        {/* Card 3: Past Interviews */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-600">
              <List size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Past Interviews</h2>
              <p className="text-gray-500 text-sm">Recent candidate sessions.</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
            {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Clock size={40} className="mb-2 opacity-20"/>
                    <p>No interviews found.</p>
                </div>
            ) : (
                history.map((interview) => (
                    <div 
                        key={interview._id} 
                        onClick={() => setSelectedInterview(interview)} 
                        className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-gray-900">{interview.candidateName || "Unknown Candidate"}</p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {interview.roomId}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                                interview.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {interview.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                             <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={12}/> {new Date(interview.startTime).toLocaleDateString()}
                             </span>
                             <span className="text-xs font-bold text-blue-500 group-hover:text-blue-700">View Details →</span>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* --- SCHEDULE POPUP MODAL --- */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <CalendarPlus size={20} className="text-purple-600"/> Schedule Meeting
                    </h2>
                    <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleScheduleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Candidate Email</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="email" 
                                required 
                                placeholder="Enter candidate's exact email" 
                                value={scheduleData.email} 
                                onChange={(e) => setScheduleData({...scheduleData, email: e.target.value})} 
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Date</label>
                            <input 
                                type="date" 
                                required 
                                value={scheduleData.date} 
                                onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})} 
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Time</label>
                            <input 
                                type="time" 
                                required 
                                value={scheduleData.time} 
                                onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})} 
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition mt-4">
                        Confirm Schedule
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* --- VIEW DETAILS MODAL --- */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Interview Details</h2>
                    <button onClick={() => setSelectedInterview(null)} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Candidate Name</p>
                        <p className="font-bold text-lg text-gray-900">{selectedInterview.candidateName || "Unknown"}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Room ID</p>
                            <p className="font-medium text-gray-800 font-mono">{selectedInterview.roomId}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Date</p>
                            <p className="font-medium text-gray-800">
                                {new Date(selectedInterview.startTime).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Current Result</p>
                        <div className="flex items-center gap-2">
                            {selectedInterview.verdict === 'Pass' && <span className="flex items-center gap-1.5 text-sm font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg border border-green-200"><CheckCircle size={16}/> Passed</span>}
                            {selectedInterview.verdict === 'Fail' && <span className="flex items-center gap-1.5 text-sm font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-lg border border-red-200"><XCircle size={16}/> Failed</span>}
                            {selectedInterview.verdict === 'Pending' && <span className="flex items-center gap-1.5 text-sm font-bold text-yellow-700 bg-yellow-100 px-3 py-1.5 rounded-lg border border-yellow-200"><AlertCircle size={16}/> Pending Grading</span>}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    {selectedInterview.verdict === 'Pending' ? (
                        <>
                            <button onClick={() => setSelectedInterview(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
                                Cancel
                            </button>
                            <button onClick={() => handleUpdateVerdict('Fail')} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-bold border border-red-200">
                                Fail Candidate
                            </button>
                            <button onClick={() => handleUpdateVerdict('Pass')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold shadow-md shadow-green-200">
                                Pass Candidate
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setSelectedInterview(null)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium w-full">
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;