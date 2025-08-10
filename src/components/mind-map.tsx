import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Square, Circle, Diamond, Trash2, Link } from 'lucide-react';

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
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9'
];

const SHAPES = [
  { type: 'square' as const, icon: Square, label: 'Square' },
  { type: 'circle' as const, icon: Circle, label: 'Circle' },
  { type: 'diamond' as const, icon: Diamond, label: 'Diamond' }
];

export function MindMap() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [newNodeText, setNewNodeText] = useState('');
  const [selectedShape, setSelectedShape] = useState<'square' | 'circle' | 'diamond'>('square');
  const canvasRef = useRef<HTMLDivElement>(null);

  const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  const createNode = useCallback((x: number, y: number) => {
    const newNode: Node = {
      id: Date.now().toString(),
      x,
      y,
      text: newNodeText || 'New Node',
      shape: selectedShape,
      color: getRandomColor(),
      connections: []
    };
    setNodes(prev => [...prev, newNode]);
    setNewNodeText('');
  }, [newNodeText, selectedShape]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createNode(x, y);
    }
  }, [createNode]);

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
      if (node) {
        setDragOffset({
          x: e.clientX - node.x,
          y: e.clientY - node.y
        });
      }
    }
  }, [isConnecting, connectFrom, nodes]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
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

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, text } : node
    ));
  }, []);

  const renderNode = (node: Node) => {
    const isSelected = selectedNode === node.id;
    const isConnectTarget = isConnecting && connectFrom === node.id;
    
    const baseClasses = `
      absolute cursor-pointer transition-all duration-200 
      border-2 flex items-center justify-center text-center p-3 min-w-[120px] min-h-[80px]
      font-mono text-sm font-medium shadow-lg hover:shadow-xl
      ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''}
      ${isConnectTarget ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
    `;

    const shapeClasses = {
      square: 'rounded-lg',
      circle: 'rounded-full',
      diamond: 'transform rotate-45'
    };

    const style = {
      left: node.x - 60,
      top: node.y - 40,
      backgroundColor: node.color,
      borderColor: isSelected ? '#fbbf24' : '#374151',
      color: '#1f2937'
    };

    return (
      <div
        key={node.id}
        className={`${baseClasses} ${shapeClasses[node.shape]}`}
        style={style}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
      >
        <div className={node.shape === 'diamond' ? 'transform -rotate-45' : ''}>
          {isSelected ? (
            <input
              type="text"
              value={node.text}
              onChange={(e) => updateNodeText(node.id, e.target.value)}
              onBlur={() => setSelectedNode(null)}
              className="bg-transparent border-none outline-none text-center w-full"
              autoFocus
            />
          ) : (
            <span className="break-words">{node.text}</span>
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
        stroke="#6b7280"
        strokeWidth="3"
        strokeDasharray="5,5"
        className="drop-shadow-sm"
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex items-center justify-between p-4 border-b border-amber-200 dark:border-gray-700 bg-amber-100/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 font-mono">
            Mind Map Studio
          </h2>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Node text..."
              value={newNodeText}
              onChange={(e) => setNewNodeText(e.target.value)}
              className="w-32 text-sm bg-white/80 border-amber-300"
            />
            <div className="flex gap-1">
              {SHAPES.map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant={selectedShape === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedShape(type)}
                  className="p-2"
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isConnecting ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsConnecting(!isConnecting);
              setConnectFrom(null);
            }}
            className="flex items-center gap-2"
          >
            <Link className="w-4 h-4" />
            {isConnecting ? 'Cancel Connect' : 'Connect Nodes'}
          </Button>
          
          {selectedNode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteNode(selectedNode)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="w-full h-full relative cursor-crosshair bg-gradient-to-br from-amber-50/30 to-orange-100/30 dark:from-gray-900/30 dark:to-gray-800/30"
          onClick={handleCanvasClick}
          style={{
            backgroundImage: `
              radial-gradient(circle at 25px 25px, rgba(245, 158, 11, 0.1) 2px, transparent 2px),
              radial-gradient(circle at 75px 75px, rgba(245, 158, 11, 0.1) 2px, transparent 2px)
            `,
            backgroundSize: '100px 100px'
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {connections.map(renderConnection)}
          </svg>
          
          <div className="relative" style={{ zIndex: 2 }}>
            {nodes.map(renderNode)}
          </div>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-amber-700 dark:text-amber-300 font-mono">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">Create Your Mind Map</h3>
                <p className="text-sm opacity-75">Click anywhere to add your first node</p>
                <p className="text-xs opacity-50 mt-2">Use the tools above to customize shapes and connect ideas</p>
              </div>
            </div>
          )}

          {isConnecting && connectFrom && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-700">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-mono">
                Click another node to create connection
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}