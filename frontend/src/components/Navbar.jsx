import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User } from "lucide-react";

const Navbar = () => {
  const { authUser, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
      {/* Logo */}
      <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
        Talent Flow
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        {authUser ? (
          // If User is Logged In: Show Name & Logout
          <>
            <span className="text-gray-700 font-medium flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Hello, {authUser.name}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        ) : (
          // If User is Logged Out: Show Login/Signup
          <>
            <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;