import { useState, useEffect } from "react"; // Added useEffect
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Video, Calendar, Clock, ArrowRight } from "lucide-react";

const HomePage = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  // --- NEW CODE: Redirect Admin to Dashboard ---
  useEffect(() => {
    if (authUser?.role === "interviewer") {
      navigate("/admin");
    }
  }, [authUser, navigate]);
  // ---------------------------------------------

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
            <label className="block text-sm font-medium text-blue-100 mb-2">Join Interview Room</label>
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

      {/* Stats Grid (Same as before) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upcoming</h3>
              <p className="text-sm text-gray-500">Scheduled sessions</p>
            </div>
          </div>
          <div className="text-center py-6 text-gray-400">
            <p>No upcoming interviews scheduled</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">History</h3>
              <p className="text-sm text-gray-500">Past recordings</p>
            </div>
          </div>
          <div className="text-center py-6 text-gray-400">
            <p>No past interviews found</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;