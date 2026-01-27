import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminDashboard from "./pages/AdminDashboard";
import InterviewPage from "./pages/InterviewPage"; // The Interview Room
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* --- PROTECTED ROUTES --- */}
        
        {/* Candidate Home (Join Interface) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />

        {/* Admin Dashboard (Create Interface) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard /> 
            </ProtectedRoute>
          } 
        />

        {/* Video Interview Room (Dynamic ID) */}
        <Route 
          path="/interview/:id" 
          element={
            <ProtectedRoute>
              <InterviewPage /> 
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Toaster />
    </div>
  );
}

export default App;