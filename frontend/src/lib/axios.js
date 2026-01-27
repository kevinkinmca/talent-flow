import axios from "axios";

export const axiosInstance = axios.create({
  // CHANGED: localhost -> 192.168.5.35
  // This allows devices on your Wi-Fi (like your phone) to connect to the backend.
  baseURL: "http://192.168.5.35:3000/api", 
  
  withCredentials: true, // Allows cookies if needed later
});