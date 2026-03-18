import axios from "axios";

export const axiosInstance = axios.create({
  // UPDATE THIS LINE:
  // If your backend is on port 5000:
  //baseURL: "http://192.168.215.239:3000/api", 
  
  // OR if your backend is on port 3000:
  //baseURL: "http://192.168.96.239:3000/api",
  baseURL: "http://10.10.159.188:3000/api", 


  withCredentials: true,
});
