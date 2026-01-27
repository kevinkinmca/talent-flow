import { useAuth } from "../context/AuthContext";
import { PlusCircle, List, LogOut, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const createNewInterview = () => {
    // 1. Generate a random meeting ID
    const randomId = Math.random().toString(36).substring(2, 9);
    // 2. Navigate to that room (Admin becomes the host)
    navigate(`/interview/${randomId}`);
  };

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Interviewer Dashboard</h1>
        <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Start Interview (NEW) */}
        <div 
            onClick={createNewInterview}
            className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group hover:border-blue-500"
        >
          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition">
            <Video size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2">Create Interview</h2>
          <p className="text-gray-500 mb-6">Start a new live session instantly.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full font-medium">
            Start Meeting
          </button>
        </div>

        {/* Card 2: Add Question */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group">
          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition">
            <PlusCircle size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2">Add Question</h2>
          <p className="text-gray-500 mb-6">Create coding challenges.</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 w-full font-medium">
            Create
          </button>
        </div>

        {/* Card 3: View Candidates */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition cursor-pointer group">
          <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition">
            <List size={24} />
          </div>
          <h2 className="text-xl font-bold mb-2">Past Interviews</h2>
          <p className="text-gray-500 mb-6">Review recordings and scores.</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full font-medium">
            View List
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;