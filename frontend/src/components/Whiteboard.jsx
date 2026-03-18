import { useEffect, useRef, useState } from "react";
import { Eraser, Trash2, Pen } from "lucide-react";

const Whiteboard = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#3b82f6"); // Default blue pen makes it obvious
  const [brushSize, setBrushSize] = useState(3);
  const [activeTool, setActiveTool] = useState("pen"); // "pen" or "eraser"
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;

    // This dynamically resizes the canvas without deleting the drawing
    const setCanvasSize = () => {
        const rect = parent.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            const ctx = canvas.getContext("2d");
            let imgData = null;
            if (canvas.width > 0 && canvas.height > 0) {
                 imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            }
            
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctxRef.current = ctx;

            if (imgData) ctx.putImageData(imgData, 0, 0);
        }
    };

    setCanvasSize();

    // Automatically recalculate size if window resizes
    const observer = new ResizeObserver(setCanvasSize);
    observer.observe(parent);

    if (socket) {
      socket.on("draw-update", (data) => {
        drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
      });
      socket.on("whiteboard-cleared", () => {
         ctxRef.current?.clearRect(0, 0, canvas.width, canvas.height);
      });
    }

    return () => {
      observer.disconnect();
      if (socket) {
        socket.off("draw-update");
        socket.off("whiteboard-cleared");
      }
    };
  }, [socket]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const drawLine = (x0, y0, x1, y1, strokeColor, lineWidth, emit) => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.closePath();

    if (!emit || !socket) return;
    socket.emit("draw", {
      roomId,
      drawData: { x0, y0, x1, y1, color: strokeColor, size: lineWidth }
    });
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    currentPos.current = getCoordinates(e);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const newPos = getCoordinates(e);
    
    // If activeTool is eraser, use background color (#1e1e1e) and make brush huge
    const activeColor = activeTool === "eraser" ? "#1e1e1e" : color;
    const activeSize = activeTool === "eraser" ? 25 : brushSize; 
    
    drawLine(currentPos.current.x, currentPos.current.y, newPos.x, newPos.y, activeColor, activeSize, true);
    currentPos.current = newPos;
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) socket.emit("clear-whiteboard", roomId);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 bg-gray-900 border-b border-gray-700 shrink-0 shadow-md z-10">
        
        {/* Pen Button */}
        <button 
            onClick={() => setActiveTool("pen")} 
            className={`p-2 rounded transition flex items-center gap-2 ${activeTool === "pen" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
            title="Pen"
        >
            <Pen size={18} />
        </button>
        
        {/* Color Picker */}
        <input 
            type="color" 
            value={color} 
            onChange={(e) => { setColor(e.target.value); setActiveTool("pen"); }} 
            className={`w-8 h-8 rounded cursor-pointer bg-transparent border-none ${activeTool !== 'pen' ? 'opacity-50' : ''}`}
            title="Pen Color"
        />
        
        {/* Brush Size */}
        <input 
            type="range" 
            min="1" max="10" 
            value={brushSize} 
            onChange={(e) => setBrushSize(e.target.value)} 
            className="w-24 accent-blue-500 ml-2" 
            title="Brush Size"
        />
        
        <div className="w-px h-6 bg-gray-700 mx-2"></div> {/* Divider */}

        {/* Eraser Button */}
        <button 
            onClick={() => setActiveTool("eraser")} 
            className={`p-2 rounded transition flex items-center gap-2 ${activeTool === "eraser" ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800"}`}
            title="Eraser"
        >
            <Eraser size={18} />
        </button>
        
        {/* Clear Canvas */}
        <button onClick={clearCanvas} className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded transition ml-auto flex items-center gap-2" title="Clear Canvas">
            <Trash2 size={18} />
            <span className="text-sm font-medium hidden sm:block">Clear</span>
        </button>
      </div>
      
      {/* Canvas Area */}
      <div className="flex-1 w-full h-full relative cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute top-0 left-0 touch-none block"
        />
      </div>
    </div>
  );
};

export default Whiteboard;