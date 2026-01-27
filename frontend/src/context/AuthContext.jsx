import { createContext, useContext, useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start true to check auth on load

  // 1. Check if user is already logged in (Persistence)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If we have a token/user saved, we could validate it here
        // For now, let's assume if state is set, we are good.
        // But better: Check local storage or verify with backend
        const storedUser = localStorage.getItem("user-info");
        if (storedUser) {
           setAuthUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.log("Error checking auth", error);
        setAuthUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signup = async (userData) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/signup", userData);
      setAuthUser(res.data);
      localStorage.setItem("user-info", JSON.stringify(res.data)); // Save to storage
      toast.success("Account created successfully!");
      return true; // Return success
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", userData);
      setAuthUser(res.data);
      localStorage.setItem("user-info", JSON.stringify(res.data)); // Save to storage
      toast.success("Logged in successfully!");
      return true; // Return success
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthUser(null);
    localStorage.removeItem("user-info"); // Clear storage
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider value={{ authUser, signup, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};