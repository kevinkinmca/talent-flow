import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";
import { axiosInstance } from "../lib/axios"; // Ensure this path matches your file!

const CodeEditor = ({ roomId }) => {
  const [code, setCode] = useState("// Start coding here...");
  const [socket, setSocket] = useState(null);
  
  // --- STATE FOR COMPILER ---
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Connect to Backend using YOUR CURRENT NETWORK IP
    // Ensure this IP matches your backend server.js address
    const newSocket = io("http://192.168.5.35:3000"); 
    setSocket(newSocket);

    // 2. Join the specific room
    newSocket.emit("join-room", roomId);

    // 3. Listen for code updates from others
    newSocket.on("code-update", (newCode) => {
      setCode(newCode);
    });

    // --- 4. NEW: Listen for Output Updates (Sync Result) ---
    newSocket.on("output-update", (newOutput) => {
      setOutput(newOutput); // <--- Updates the black box for everyone!
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  // 5. Handle my typing
  const handleEditorChange = (value) => {
    setCode(value);
    if (socket) {
      socket.emit("code-change", { roomId, code: value });
    }
  };

  // --- 6. RUN CODE FUNCTION (With Sync) ---
  const runCode = async () => {
    setIsLoading(true);
    const startMsg = "Running...";
    setOutput(startMsg);
    
    // Notify others that code is running
    if (socket) socket.emit("output-change", { roomId, output: startMsg });

    try {
      const response = await axiosInstance.post("/compile", {
        language: language,
        code: code
      });
      
      const result = response.data.output;
      setOutput(result);

      // --- Sync Success Result ---
      if (socket) {
        socket.emit("output-change", { roomId, output: result });
      }

    } catch (error) {
      console.error(error);
      const errorMsg = "Error: Failed to execute code.\nCheck if backend is running.";
      setOutput(errorMsg);

      // --- Sync Error Message ---
      if (socket) {
        socket.emit("output-change", { roomId, output: errorMsg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="h-12 bg-[#1e1e1e] border-b border-gray-700 flex items-center px-4 justify-between shrink-0">
        
        {/* Left: Language Selector */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-medium">Language:</span>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600 outline-none focus:border-blue-500"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript (Node)</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        {/* Right: Run Button & Status */}
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Live Sync
          </span>
          
          <button
            onClick={runCode}
            disabled={isLoading}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              isLoading 
                ? "bg-gray-600 text-gray-400 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isLoading ? "Running..." : "▶ Run Code"}
          </button>
        </div>
      </div>

      {/* Main Content Area: Split between Editor and Output */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Code Editor (Takes up 70% of height) */}
        <div className="flex-grow h-[70%]">
          <Editor
            height="100%"
            defaultLanguage={language === "python" ? "python" : "javascript"} 
            language={language === "cpp" ? "cpp" : (language === "java" ? "java" : language)}
            theme="vs-dark"
            value={code} 
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16 },
            }}
          />
        </div>

        {/* Output Console (Takes up 30% of height) */}
        <div className="h-[30%] bg-black border-t border-gray-700 p-3 overflow-auto">
            <div className="text-gray-500 text-xs uppercase mb-1 font-bold tracking-wider">Console Output</div>
            <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap">
              {output || "> Click 'Run Code' to see output..."}
            </pre>
        </div>

      </div>
    </div>
  );
};

export default CodeEditor;