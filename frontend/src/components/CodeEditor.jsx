import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";
import { axiosInstance } from "../lib/axios";
import { useAuth } from "../context/AuthContext"; 

const CodeEditor = ({ roomId }) => {
  const { authUser } = useAuth(); 
  const [code, setCode] = useState("// Start coding here...");
  const [socket, setSocket] = useState(null);
  
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);

  const [questionBank, setQuestionBank] = useState([]);
  const [selectedQuestionTitle, setSelectedQuestionTitle] = useState("");

  // --- NEW: TAB SWITCH DETECTION FOR CANDIDATE ---
  useEffect(() => {
    // Only track the candidate, we don't care if the Interviewer switches tabs!
    if (authUser?.role === "candidate") {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                const timeString = new Date().toLocaleTimeString();
                const logMessage = `⚠️ Candidate switched or minimized tabs at ${timeString}`;
                
                try {
                    // Save to database for the PDF
                    await axiosInstance.post("/interview/log-proctoring", {
                        roomId,
                        logMessage
                    });
                    
                    // Instantly alert the Admin in the live room chat!
                    if (socket) {
                        socket.emit("question-change", {
                            roomId,
                            question: {
                                id: Date.now(),
                                text: `🚨 PROCTORING ALERT:\n${logMessage}`,
                                sender: "System Anti-Cheat",
                                time: timeString
                            }
                        });
                    }
                } catch (error) {
                    console.error("Failed to log proctoring event", error);
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  }, [authUser, roomId, socket]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (authUser?.role === "interviewer") {
        try {
          const res = await axiosInstance.get(`/questions/${authUser._id}`);
          setQuestionBank(res.data);
          
          if (res.data.length > 0) {
            setSelectedQuestionTitle(res.data[0].title);
          } else {
            setSelectedQuestionTitle("custom");
          }
        } catch (error) {
          console.error("Failed to fetch questions", error);
        }
      }
    };
    fetchQuestions();
  }, [authUser]);

  useEffect(() => {
    // Note: Make sure this IP matches your current network IP!
    const newSocket = io("http://10.10.159.188:3000"); 
    setSocket(newSocket);
    newSocket.emit("join-room", roomId);

    newSocket.on("code-update", (newCode) => setCode(newCode));
    newSocket.on("output-update", (newOutput) => setOutput(newOutput)); 

    return () => newSocket.disconnect();
  }, [roomId]);

  const handleEditorChange = (value) => {
    setCode(value);
    if (socket) socket.emit("code-change", { roomId, code: value });
  };

  const runCode = async () => {
    if (!code || code.trim() === "" || code.trim() === "// Start coding here...") {
        setOutput("Please write some code first.");
        return;
    }

    setIsLoading(true);
    const startMsg = "Running...";
    setOutput(startMsg);
    if (socket) socket.emit("output-change", { roomId, output: startMsg });

    try {
      const response = await axiosInstance.post("/compile", { language, code });
      const result = response.data.output;
      setOutput(result);
      if (socket) socket.emit("output-change", { roomId, output: result });
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Error: Failed to connect to server.";
      setOutput(errorMsg);
      if (socket) socket.emit("output-change", { roomId, output: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // --- FIXED: SAVES AI REVIEW TO DATABASE ---
  const generateAIReview = async () => {
    if (!code || code.trim() === "" || code.trim() === "// Start coding here...") {
        alert("Wait for the candidate to write some code before requesting a review!");
        return;
    }

    setIsReviewing(true);
    try {
      const response = await axiosInstance.post("/compile/review", { language, code });
      const aiReviewText = response.data.review;

      // --- NEW: Save it to the Database for the PDF! ---
      await axiosInstance.post("/interview/save-ai-review", {
          roomId,
          aiReview: aiReviewText
      });

      const reviewAlert = {
        id: Date.now(),
        text: `✨ AI CODE REVIEW:\n${aiReviewText}`,
        sender: "Groq AI Assistant",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (socket) socket.emit("question-change", { roomId, question: reviewAlert });
    } catch (error) {
      console.error("Full AI Error:", error);
      alert("AI Review Failed. Check console.");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSaveAnswer = async () => {
    if (!code || code.trim() === "" || code.trim() === "// Start coding here...") {
        alert("There is no code to save yet!");
        return;
    }

    setIsSaving(true);
    try {
      let finalQuestionTitle = selectedQuestionTitle;

      if (finalQuestionTitle === "custom") {
          const questionPrompt = window.prompt("Which question did they just solve?", "Custom Question");
          if (!questionPrompt) {
              setIsSaving(false);
              return; 
          }
          finalQuestionTitle = questionPrompt;
      } else if (!finalQuestionTitle) {
          finalQuestionTitle = "Generic Question";
      }

      await axiosInstance.post("/interview/save-answer", {
          roomId,
          question: finalQuestionTitle,
          code: code,
          output: output || "No output generated."
      });
      
      alert(`✅ "${finalQuestionTitle}" saved successfully! You can now clear the screen.`);
      
      // --- FIXED: Reset the dropdown to "custom" after saving so titles don't duplicate! ---
      setSelectedQuestionTitle("custom");

    } catch (error) {
      console.error("Error saving answer:", error);
      alert("Failed to save answer.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] border-l border-gray-700 flex flex-col">
      <div className="h-12 bg-[#1e1e1e] border-b border-gray-700 flex items-center px-4 justify-between shrink-0">
        
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

        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div> Live Sync
          </span>
          
          {authUser?.role === "interviewer" && (
             <>
               <select
                  value={selectedQuestionTitle}
                  onChange={(e) => setSelectedQuestionTitle(e.target.value)}
                  className="bg-gray-800 text-gray-300 text-xs p-1 rounded border border-gray-600 outline-none focus:border-emerald-500 max-w-[140px] truncate"
                  title="Select the question being solved"
               >
                  {questionBank.map(q => (
                      <option key={q._id} value={q.title}>{q.title}</option>
                  ))}
                  <option value="custom" className="font-bold text-emerald-400">+ Custom / Manual</option>
               </select>

               <button
                 onClick={handleSaveAnswer}
                 disabled={isSaving || isLoading || isReviewing}
                 className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                   isSaving ? "bg-emerald-900 text-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/50"
                 }`}
               >
                 {isSaving ? "Saving..." : "💾 Save Answer"}
               </button>

               <button
                  onClick={generateAIReview}
                  disabled={isReviewing || isLoading || isSaving}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    isReviewing ? "bg-purple-900 text-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/50"
                  }`}
               >
                  {isReviewing ? "Analyzing..." : "✨ AI Review"}
               </button>
             </>
          )}

          <button
            onClick={runCode}
            disabled={isLoading || isReviewing || isSaving}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              isLoading ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isLoading ? "Running..." : "▶ Run Code"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-grow h-[70%]">
          <Editor
            height="100%"
            defaultLanguage={language === "python" ? "python" : "javascript"} 
            language={language === "cpp" ? "cpp" : (language === "java" ? "java" : language)}
            theme="vs-dark"
            value={code} 
            onChange={handleEditorChange}
            options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, padding: { top: 16 } }}
          />
        </div>

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