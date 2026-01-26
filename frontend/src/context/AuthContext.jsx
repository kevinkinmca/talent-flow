import { createContext, useContext, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const signup = async (userData) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/signup", userData);
      setAuthUser(res.data);
      toast.success("Account created successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", userData);
      setAuthUser(res.data);
      toast.success("Logged in successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthUser(null);
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider value={{ authUser, signup, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};