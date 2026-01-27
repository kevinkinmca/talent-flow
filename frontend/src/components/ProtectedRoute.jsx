import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const { authUser, loading } = useAuth();

  // 1. Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 2. If not logged in, redirect to Login Page
  if (!authUser) {
    return <Navigate to="/login" />;
  }

  // 3. If logged in, show the protected page (The Dashboard)
  return children;
};

export default ProtectedRoute;