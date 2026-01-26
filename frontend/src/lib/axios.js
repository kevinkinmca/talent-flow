import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api", // Connects to your backend
  withCredentials: true, // Allows cookies if needed later
});