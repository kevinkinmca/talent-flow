import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";

const CodeEditor = ({ roomId }) => {
  const [code, setCode] = useState("// Start coding here...");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 1. Connect to Backend using YOUR NETWORK IP
    // CHANGE: localhost -> 192.168.5.35
    const newSocket = io("http://192.168.5.35:3000"); 
    setSocket(newSocket);

    // 2. Join the specific room
    newSocket.emit("join-room", roomId);

    // 3. Listen for code updates from others
    newSocket.on("code-update", (newCode) => {
      setCode(newCode);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  // 4. Handle my typing
  const handleEditorChange = (value) => {
    setCode(value);
    if (socket) {
      socket.emit("code-change", { roomId, code: value });
    }
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="h-10 bg-[#1e1e1e] border-b border-gray-700 flex items-center px-4 justify-between shrink-0">
        <span className="text-gray-400 text-sm font-medium">JavaScript</span>
        <span className="text-gray-500 text-xs flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          Live Sync
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code} // Bind value to state
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
    </div>
  );
};

export default CodeEditor;