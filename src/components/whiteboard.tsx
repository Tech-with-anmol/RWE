import React from 'react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Pen, Eraser, Square, Circle, Trash2, Undo, Redo, Download } from 'lucide-react';

interface WhiteboardProps {
  conversationId: number | null;
}

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle';
type DrawingData = {
  tool: Tool;
  points: { x: number; y: number }[];
  color: string;
  size: number;
};

export function Whiteboard({ conversationId }: WhiteboardProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [tool, setTool] = React.useState<Tool>('pen');
  const [color, setColor] = React.useState('#000000');
  const [size, setSize] = React.useState(2);
  const [drawings, setDrawings] = React.useState<DrawingData[]>([]);
  const [history, setHistory] = React.useState<DrawingData[][]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [startPoint, setStartPoint] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setColor(isDark ? '#ffffff' : '#000000');
  }, []);

  React.useEffect(() => {
    if (conversationId) {
      loadDrawings();
    } else {
      setDrawings([]);
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [conversationId]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      redrawCanvas();
    }
  }, [drawings, conversationId]);

  const loadDrawings = () => {
    if (!conversationId) return;
    
    try {
      const saved = localStorage.getItem(`whiteboard_${conversationId}`);
      if (saved) {
        const data = JSON.parse(saved);
        setDrawings(data.drawings || []);
        setHistory(data.history || []);
        setHistoryIndex(data.historyIndex || -1);
      } else {
        setDrawings([]);
        setHistory([]);
        setHistoryIndex(-1);
      }
    } catch (error) {
      console.error('Failed to load drawings:', error);
      setDrawings([]);
      setHistory([]);
      setHistoryIndex(-1);
    }
  };

  const saveDrawings = () => {
    if (!conversationId) return;
    try {
      localStorage.setItem(`whiteboard_${conversationId}`, JSON.stringify({
        drawings,
        history,
        historyIndex
      }));
    } catch (error) {
      console.error('Failed to save drawings:', error);
    }
  };

  React.useEffect(() => {
    if (conversationId && drawings.length > 0) {
      const timeoutId = setTimeout(() => {
        saveDrawings();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [drawings, conversationId]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isDark ? '#0a0a0a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawings.forEach(drawing => {
      if (drawing.points.length === 0) return;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (drawing.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = drawing.size * 5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = drawing.size;
      }

      if (drawing.tool === 'rectangle' && drawing.points.length >= 2) {
        const start = drawing.points[0];
        const end = drawing.points[drawing.points.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (drawing.tool === 'circle' && drawing.points.length >= 2) {
        const start = drawing.points[0];
        const end = drawing.points[drawing.points.length - 1];
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
        drawing.points.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
    });
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);

    if (tool === 'rectangle' || tool === 'circle') {
      return;
    }

    const newDrawing: DrawingData = {
      tool,
      points: [pos],
      color,
      size
    };

    setDrawings(prev => [...prev, newDrawing]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);

    if (tool === 'rectangle' || tool === 'circle') {
      return;
    }

    setDrawings(prev => {
      const newDrawings = [...prev];
      const currentDrawing = newDrawings[newDrawings.length - 1];
      if (currentDrawing) {
        currentDrawing.points.push(pos);
      }
      return newDrawings;
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const pos = getMousePos(e);

    if (tool === 'rectangle' || tool === 'circle') {
      const newDrawing: DrawingData = {
        tool,
        points: [startPoint, pos],
        color,
        size
      };
      setDrawings(prev => {
        const newDrawings = [...prev, newDrawing];
        addToHistory(newDrawings);
        return newDrawings;
      });
    } else {
      addToHistory(drawings);
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const addToHistory = (currentDrawings: DrawingData[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...currentDrawings]);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  const clearCanvas = () => {
    setDrawings([]);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setDrawings(history[historyIndex - 1] || []);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setDrawings(history[historyIndex + 1] || []);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard_${conversationId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a conversation to access the whiteboard
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-2 border-b border-border flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pen')}
          >
            <Pen className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('eraser')}
          >
            <Eraser className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('rectangle')}
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('circle')}
          >
            <Circle className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded border cursor-pointer"
          onFocus={(e) => e.target.blur()}
        />

        <input
          type="range"
          min="1"
          max="20"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-20"
          onFocus={(e) => e.target.blur()}
        />

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCanvas}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full cursor-crosshair border-0 block"
          style={{ touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDrawing(false);
            setStartPoint(null);
          }}
        />
      </div>
    </div>
  );
}
