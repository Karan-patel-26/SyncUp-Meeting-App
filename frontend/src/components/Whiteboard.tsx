import { useEffect, useRef, useState } from 'react';
import { Pencil, Eraser, Trash2, Download, X } from 'lucide-react';
import { socket } from '../api/socket';

interface WhiteboardProps {
  roomId: string;
  onClose: () => void;
}

export const Whiteboard = ({ roomId, onClose }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth] = useState(3);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

  const colors = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set display size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(window.devicePixelRatio, window.devicePixelRatio);
      context.lineCap = 'round';
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      contextRef.current = context;
    }

    // Socket listeners
    socket.on('draw-data', (data: any) => {
      const { x0, y0, x1, y1, color, width } = data;
      drawOnCanvas(x0, y0, x1, y1, color, width, false);
    });

    socket.on('clear-whiteboard', () => {
      if (contextRef.current && canvasRef.current) {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    });

    return () => {
      socket.off('draw-data');
      socket.off('clear-whiteboard');
    };
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth, tool]);

  const drawOnCanvas = (x0: number, y0: number, x1: number, y1: number, strokeColor: string, strokeWidth: number, emit: boolean) => {
    const context = contextRef.current;
    if (!context) return;

    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.stroke();
    context.closePath();

    if (emit) {
      socket.emit('draw-data', roomId, { x0, y0, x1, y1, color: strokeColor, width: strokeWidth });
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      const touchEvent = e as React.TouchEvent;
      clientX = touchEvent.touches[0].clientX;
      clientY = touchEvent.touches[0].clientY;
    } else {
      const mouseEvent = e as React.MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    lastPos.current = { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    drawOnCanvas(lastPos.current.x, lastPos.current.y, x, y, contextRef.current!.strokeStyle as string, lineWidth, true);
    lastPos.current = { x, y };
  };

  const clearCanvas = () => {
    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      socket.emit('clear-whiteboard', roomId);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="whiteboard-container">
      <div className="whiteboard-toolbar">
        <div className="tool-group">
          <button 
            className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
            onClick={() => setTool('pencil')}
            title="Pencil"
          >
            <Pencil size={20} />
          </button>
          <button 
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <Eraser size={20} />
          </button>
        </div>

        <div className="tool-group">
          {colors.map(c => (
            <div 
              key={c} 
              className={`color-swatch ${color === c && tool === 'pencil' ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => { setColor(c); setTool('pencil'); }}
            />
          ))}
        </div>

        <div className="tool-group" style={{ marginLeft: 'auto', gap: '0.75rem' }}>
          <button className="tool-btn" onClick={clearCanvas} title="Clear All Canvas">
            <Trash2 size={20} />
          </button>
          <button className="tool-btn" onClick={downloadCanvas} title="Download as Image">
            <Download size={20} />
          </button>
          <button className="tool-btn danger" onClick={onClose} title="Close Whiteboard">
            <X size={20} />
          </button>
        </div>
      </div>

      <canvas 
        ref={canvasRef}
        className="whiteboard-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrawing}
        onMouseOut={endDrawing}
      />
    </div>
  );
};
