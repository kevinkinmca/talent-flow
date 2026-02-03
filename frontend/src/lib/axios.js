import axios from "axios";

export const axiosInstance = axios.create({
  // UPDATE THIS LINE:
  // If your backend is on port 5000:
  //baseURL: "http://10.191.25.239:5000/api", 
  
  // OR if your backend is on port 3000:
  //baseURL: "http://10.191.25.239:3000/api",
  baseURL: "http://192.168.5.35:3000/api", 

  withCredentials: true,
});