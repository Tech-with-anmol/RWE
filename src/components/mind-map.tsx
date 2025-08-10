import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Square, Circle, Diamond, Trash2, Link } from 'lucide-react';
import { saveMindMap, getMindMap } from './load-data';

interface Node {
  id: string;
  x: number;
  y: number;
  text: string;
  shape: 'square' | 'circle' | 'diamond';
  color: string;
  connections: string[];
}

interface Connection {
  from: string;
  to: string;
}

const COLORS = [
  '#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff8000', 
  '#8000ff', '#0080ff', '#ff0080', '#80ff00', '#ff4000'
];

const THEMES = {
  terminal: {
    bg: 'bg-black',
    text: 'text-green-400',
    accent: 'text-cyan-400',
    border: 'border-green-500',
    buttonBg: 'bg-gray-900',
    buttonHover: 'hover:bg-gray-800',
    nodeBg: 'rgba(0, 20, 0, 0.9)',
    nodeText: '#00ff00',
    connection: '#00ff00',
    canvas: 'linear-gradient(45deg, #001100 25%, transparent 25%), linear-gradient(-45deg, #001100 25%, transparent 25%)',
    canvasSize: '20px 20px'
  },
  ocean: {
    bg: 'bg-gradient-to-br from-blue-900 to-blue-950',
    text: 'text-blue-200',
    accent: 'text-cyan-300',
    border: 'border-blue-400',
    buttonBg: 'bg-blue-800',
    buttonHover: 'hover:bg-blue-700',
    nodeBg: 'rgba(30, 58, 138, 0.8)',
    nodeText: '#bfdbfe',
    connection: '#38bdf8',
    canvas: 'radial-gradient(circle at 25% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 25%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)',
    canvasSize: '60px 60px'
  },
  forest: {
    bg: 'bg-gradient-to-br from-green-900 to-emerald-950',
    text: 'text-green-200',
    accent: 'text-emerald-300',
    border: 'border-green-400',
    buttonBg: 'bg-green-800',
    buttonHover: 'hover:bg-green-700',
    nodeBg: 'rgba(34, 197, 94, 0.2)',
    nodeText: '#bbf7d0',
    connection: '#10b981',
    canvas: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(34, 197, 94, 0.05) 10px, rgba(34, 197, 94, 0.05) 20px)',
    canvasSize: '40px 40px'
  },
  sunset: {
    bg: 'bg-gradient-to-br from-orange-600 via-red-500 to-pink-600',
    text: 'text-orange-100',
    accent: 'text-yellow-200',
    border: 'border-orange-300',
    buttonBg: 'bg-red-700',
    buttonHover: 'hover:bg-red-600',
    nodeBg: 'rgba(251, 146, 60, 0.3)',
    nodeText: '#fef3c7',
    connection: '#fbbf24',
    canvas: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
    canvasSize: '80px 80px'
  },
  neon: {
    bg: 'bg-gray-900',
    text: 'text-pink-300',
    accent: 'text-cyan-300',
    border: 'border-pink-500',
    buttonBg: 'bg-purple-900',
    buttonHover: 'hover:bg-purple-800',
    nodeBg: 'rgba(139, 69, 19, 0.1)',
    nodeText: '#f0abfc',
    connection: '#06b6d4',
    canvas: 'linear-gradient(90deg, transparent 98%, rgba(236, 72, 153, 0.3) 100%), linear-gradient(0deg, transparent 98%, rgba(6, 182, 212, 0.3) 100%)',
    canvasSize: '50px 50px'
  },
  minimal: {
    bg: 'bg-gray-50',
    text: 'text-gray-800',
    accent: 'text-gray-600',
    border: 'border-gray-300',
    buttonBg: 'bg-white',
    buttonHover: 'hover:bg-gray-100',
    nodeBg: 'rgba(255, 255, 255, 0.95)',
    nodeText: '#374151',
    connection: '#6b7280',
    canvas: 'radial-gradient(circle at 50% 50%, rgba(156, 163, 175, 0.1) 1px, transparent 1px)',
    canvasSize: '24px 24px'
  },
  porch: {
    bg: 'bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900',
    text: 'text-amber-200',
    accent: 'text-orange-300',
    border: 'border-amber-600',
    buttonBg: 'bg-amber-800',
    buttonHover: 'hover:bg-amber-700',
    nodeBg: 'rgba(120, 53, 15, 0.8)',
    nodeText: '#fef3c7',
    connection: '#f59e0b',
    canvas: 'radial-gradient(ellipse at 30% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(251, 191, 36, 0.05) 0%, transparent 50%)',
    canvasSize: '40px 40px'
  },
  winter: {
    bg: 'bg-gradient-to-br from-slate-100 to-stone-200',
    text: 'text-slate-700',
    accent: 'text-stone-600',
    border: 'border-slate-300',
    buttonBg: 'bg-stone-100',
    buttonHover: 'hover:bg-stone-200',
    nodeBg: 'rgba(248, 250, 252, 0.9)',
    nodeText: '#475569',
    connection: '#64748b',
    canvas: 'repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.03) 0px, rgba(148, 163, 184, 0.03) 2px, transparent 2px, transparent 12px)',
    canvasSize: '24px 24px'
  }
};

const SHAPES = [
  { type: 'square' as const, icon: Square, label: 'Square' },
  { type: 'circle' as const, icon: Circle, label: 'Circle' },
  { type: 'diamond' as const, icon: Diamond, label: 'Diamond' }
];

export function MindMap({ currentConversationId }: { currentConversationId: number | null }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [newNodeText, setNewNodeText] = useState('');
  const [selectedShape, setSelectedShape] = useState<'square' | 'circle' | 'diamond'>('square');
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('terminal');
  const [mapTitle, setMapTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[currentTheme];

  const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  const saveMindMapToDb = useCallback(async () => {
    if (!mapTitle.trim()) {
      alert('Please enter a title for your mind map');
      return;
    }
    
    if (!currentConversationId) {
      alert('No active conversation. Please select or create a conversation first.');
      return;
    }
    
    setIsSaving(true);
    try {
      await saveMindMap(currentConversationId, mapTitle.trim(), nodes, connections, currentTheme);
      alert('Mind map saved successfully!');
    } catch (error) {
      alert('Failed to save mind map');
    } finally {
      setIsSaving(false);
    }
  }, [mapTitle, nodes, connections, currentTheme, currentConversationId]);

  useEffect(() => {
    const loadMindMapFromDb = async () => {
      if (!currentConversationId) {
        setNodes([]);
        setConnections([]);
        setMapTitle('');
        setCurrentTheme('terminal');
        return;
      }
      
      try {
        const savedMindMap = await getMindMap(currentConversationId);
        if (savedMindMap) {
          setMapTitle(savedMindMap.title);
          setNodes(JSON.parse(savedMindMap.nodes));
          setConnections(JSON.parse(savedMindMap.connections));
          setCurrentTheme(savedMindMap.theme as keyof typeof THEMES);
        } else {
          setNodes([]);
          setConnections([]);
          setMapTitle('');
          setCurrentTheme('terminal');
        }
      } catch (error) {
        setNodes([]);
        setConnections([]);
        setMapTitle('');
        setCurrentTheme('terminal');
      }
    };
    
    loadMindMapFromDb();
  }, [currentConversationId]);

  
  const createNode = useCallback((x: number, y: number) => {
    if (!canvasRef.current || !newNodeText.trim()) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const nodeWidth = 120;
    const nodeHeight = 80;
    const padding = 10;
    
    const constrainedX = Math.max(padding, Math.min(rect.width - nodeWidth - padding, x));
    const constrainedY = Math.max(padding, Math.min(rect.height - nodeHeight - padding, y));
    
    const newNode: Node = {
      id: Date.now().toString(),
      x: constrainedX,
      y: constrainedY,
      text: newNodeText.trim(),
      shape: selectedShape,
      color: getRandomColor(),
      connections: []
    };
    setNodes(prev => [...prev, newNode]);
    setNewNodeText('');
  }, [newNodeText, selectedShape]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!isConnecting && newNodeText.trim() && (target === canvasRef.current || target.closest('[data-canvas]'))) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createNode(x, y);
    }
  }, [createNode, isConnecting, newNodeText]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (isConnecting) {
      if (!connectFrom) {
        setConnectFrom(nodeId);
      } else if (connectFrom !== nodeId) {
        const newConnection = { from: connectFrom, to: nodeId };
        setConnections(prev => [...prev, newConnection]);
        setNodes(prev => prev.map(node => 
          node.id === connectFrom 
            ? { ...node, connections: [...node.connections, nodeId] }
            : node
        ));
        setConnectFrom(null);
        setIsConnecting(false);
      }
    } else {
      setSelectedNode(nodeId);
      setDraggedNode(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (node && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left - node.x,
          y: e.clientY - rect.top - node.y
        });
      }
    }
  }, [isConnecting, connectFrom, nodes]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left - dragOffset.x;
      const rawY = e.clientY - rect.top - dragOffset.y;
      
      const nodeWidth = 120;
      const nodeHeight = 80;
      const padding = 10;
      
      const x = Math.max(padding, Math.min(rect.width - nodeWidth - padding, rawX));
      const y = Math.max(padding, Math.min(rect.height - nodeHeight - padding, rawY));
      
      setNodes(prev => prev.map(node => 
        node.id === draggedNode ? { ...node, x, y } : node
      ));
    }
  }, [draggedNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  useEffect(() => {
    if (draggedNode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedNode, handleMouseMove, handleMouseUp]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
    setSelectedNode(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNode) {
        deleteNode(selectedNode);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, deleteNode]);

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, text } : node
    ));
  }, []);

  const renderNode = (node: Node) => {
    const isSelected = selectedNode === node.id;
    const isConnectTarget = isConnecting && connectFrom === node.id;
    const isDragging = draggedNode === node.id;
    
    const baseClasses = `
      absolute transition-all duration-75 ease-out
      border-2 flex items-center justify-center text-center p-3 min-w-[120px] min-h-[80px]
      font-mono text-sm font-bold shadow-lg hover:shadow-xl select-none
      ${isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'}
      ${isSelected ? 'ring-2 ring-opacity-80' : ''}
      ${isConnectTarget ? 'ring-2 ring-opacity-80' : ''}
    `;

    const shapeClasses = {
      square: 'rounded-sm',
      circle: 'rounded-full',
      diamond: 'transform rotate-45'
    };

    const style = {
      left: node.x - 60,
      top: node.y - 40,
      backgroundColor: theme.nodeBg,
      borderColor: isSelected ? theme.connection : '#333',
      color: theme.nodeText,
      transform: isDragging ? 'scale(1.05)' : 'scale(1)',
      boxShadow: isSelected ? `0 0 20px ${theme.connection}` : `0 0 10px rgba(0,255,0,0.3)`
    };

    return (
      <div
        key={node.id}
        className={`${baseClasses} ${shapeClasses[node.shape]}`}
        style={style}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        onDoubleClick={() => deleteNode(node.id)}
      >
        <div className={node.shape === 'diamond' ? 'transform -rotate-45' : ''}>
          {isSelected ? (
            <input
              type="text"
              value={node.text}
              onChange={(e) => updateNodeText(node.id, e.target.value)}
              onBlur={() => setSelectedNode(null)}
              className="bg-transparent border-none outline-none text-center w-full font-mono font-bold"
              style={{ color: theme.nodeText }}
              autoFocus
            />
          ) : (
            <span className="break-words font-mono font-bold">{node.text}</span>
          )}
        </div>
      </div>
    );
  };

  const renderConnection = (connection: Connection) => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);
    
    if (!fromNode || !toNode) return null;

    const x1 = fromNode.x;
    const y1 = fromNode.y;
    const x2 = toNode.x;
    const y2 = toNode.y;

    return (
      <line
        key={`${connection.from}-${connection.to}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={theme.connection}
        strokeWidth="2"
        strokeDasharray="8,4"
        className="drop-shadow-sm"
        style={{ filter: `drop-shadow(0 0 4px ${theme.connection})` }}
      />
    );
  };


  return (
    <div className={`flex flex-col h-full ${theme.bg}`}>
      <div className={`flex items-center justify-between p-4 border-b ${theme.border} ${theme.buttonBg}/50`}>
        <div className="flex items-center gap-4">
          <h2 className={`text-lg font-bold ${theme.text} font-mono tracking-wider`}>
            Mind Map
          </h2>
          <Input
            type="text"
            placeholder="Enter map title..."
            value={mapTitle}
            onChange={(e) => setMapTitle(e.target.value)}
            className="w-48 text-sm font-mono"
            style={{ 
              backgroundColor: theme.nodeBg,
              borderColor: theme.connection,
              color: theme.nodeText
            }}
          />
          <Button
            size="sm"
            onClick={saveMindMapToDb}
            disabled={isSaving || !mapTitle.trim()}
            className="font-mono"
            style={{
              backgroundColor: theme.connection,
              borderColor: theme.connection,
              color: '#000'
            }}
          >
            {isSaving ? 'SAVING...' : 'SAVE'}
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder=">>_node_name..."
              value={newNodeText}
              onChange={(e) => setNewNodeText(e.target.value)}
              className={`w-40 text-sm ${theme.buttonBg} ${theme.border} ${theme.text} font-mono placeholder:${theme.accent}/50`}
              style={{ 
                backgroundColor: theme.nodeBg,
                borderColor: theme.connection,
                color: theme.nodeText
              }}
            />
            <div className="flex gap-1">
              {SHAPES.map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant={selectedShape === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedShape(type)}
                  className={`p-2 ${theme.buttonBg} ${theme.border} ${theme.text} ${theme.buttonHover} font-mono`}
                  title={label}
                  style={{
                    backgroundColor: selectedShape === type ? theme.connection : theme.nodeBg,
                    borderColor: theme.connection,
                    color: selectedShape === type ? '#000' : theme.nodeText
                  }}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={currentTheme}
            onChange={(e) => setCurrentTheme(e.target.value as keyof typeof THEMES)}
            className="px-3 py-1 rounded font-mono text-sm border"
            style={{
              backgroundColor: theme.nodeBg,
              borderColor: theme.connection,
              color: theme.nodeText
            }}
          >
            <option value="terminal">[TERMINAL]</option>
            <option value="ocean">[OCEAN]</option>
            <option value="forest">[FOREST]</option>
            <option value="sunset">[SUNSET]</option>
            <option value="neon">[NEON]</option>
            <option value="minimal">[MINIMAL]</option>
            <option value="porch">[PORCH]</option>
            <option value="winter">[WINTER]</option>
          </select>
          
          <Button
            variant={isConnecting ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsConnecting(!isConnecting);
              setConnectFrom(null);
            }}
            className={`flex items-center gap-2 ${theme.buttonBg} ${theme.border} ${theme.text} ${theme.buttonHover} font-mono`}
            style={{
              backgroundColor: isConnecting ? theme.connection : theme.nodeBg,
              borderColor: theme.connection,
              color: isConnecting ? '#000' : theme.nodeText
            }}
          >
            <Link className="w-4 h-4" />
            {isConnecting ? '[CANCEL]' : '[LINK]'}
          </Button>
          
          {selectedNode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteNode(selectedNode)}
              className="flex items-center gap-2 bg-red-900 border-red-500 text-red-300 hover:bg-red-800 font-mono"
            >
              <Trash2 className="w-4 h-4" />
              [DELETE]
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          data-canvas="true"
          className={`w-full h-full relative cursor-crosshair ${theme.bg}`}
          onClick={handleCanvasClick}
          style={{
            backgroundImage: theme.canvas,
            backgroundSize: theme.canvasSize
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {connections.map(renderConnection)}
          </svg>
          
          <div className="relative" style={{ zIndex: 2 }} data-canvas="true">
            {nodes.map(renderNode)}
          </div>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center" data-canvas="true">
              <div className={`text-center ${theme.text} font-mono`}>
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2 tracking-wider">[INITIALIZE_MIND_MAP]</h3>
                <p className={`text-sm opacity-75 ${theme.accent}`}>Enter map title and node name, then click to deploy</p>
                <p className={`text-xs opacity-50 mt-2 ${theme.accent}`}>Double-click nodes to delete • Name required</p>
              </div>
            </div>
          )}

          {isConnecting && connectFrom && (
            <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 ${theme.buttonBg} px-4 py-2 rounded border ${theme.border}`}
                 style={{ 
                   backgroundColor: theme.nodeBg,
                   borderColor: theme.connection,
                   boxShadow: `0 0 10px ${theme.connection}`
                 }}>
              <p className={`text-sm ${theme.text} font-mono`}>
                [SELECT_TARGET_NODE]
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}