import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save } from 'lucide-react';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start Audit Process' },
    position: { x: 250, y: 5 },
  },
];

let id = 1;
const getId = () => `${++id}`;

const FlowchartEditor = ({ engagementId }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type === 'input' ? 'Start' : type === 'output' ? 'End' : 'Process'} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const handleSave = () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      // TODO: Save to backend
      console.log('Saved Flow:', flow);
      alert('Flowchart saved locally! (Backend integration pending)');
    }
  };

  return (
    <div className="flex h-[700px] w-full border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm font-sans">
      <div className="w-64 bg-slate-50 border-r border-slate-200 p-5 flex flex-col gap-4">
        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest mb-1">Flowchart Elements</h3>
        <p className="text-[11px] text-slate-500 mb-4 leading-tight">Drag and drop nodes to the canvas.</p>
        
        <div 
          className="bg-white border-2 border-emerald-400 p-3 rounded-full text-center text-xs cursor-grab shadow-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors" 
          onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'input')} 
          draggable
        >
          Start Node
        </div>
        
        <div 
          className="bg-white border-2 border-indigo-400 p-3 rounded text-center text-xs cursor-grab shadow-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors" 
          onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'default')} 
          draggable
        >
          Process Step
        </div>
        
        <div 
          className="bg-white border-2 border-rose-400 p-3 rounded-full text-center text-xs cursor-grab shadow-sm font-bold text-rose-700 hover:bg-rose-50 transition-colors" 
          onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'output')} 
          draggable
        >
          End Node
        </div>

        <div className="mt-auto">
          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" /> Save Flowchart
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-50/50" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          defaultEdgeOptions={{ style: { strokeWidth: 2 } }}
        >
          <Controls />
          <MiniMap nodeStrokeColor={(n) => {
            if (n.type === 'input') return '#34d399';
            if (n.type === 'output') return '#fb7185';
            if (n.type === 'default') return '#818cf8';
            return '#eee';
          }} nodeColor={(n) => {
            if (n.type === 'input') return '#a7f3d0';
            if (n.type === 'output') return '#fecdd3';
            if (n.type === 'default') return '#c7d2fe';
            return '#fff';
          }} />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default function InteractiveFlowchart({ engagementId }) {
  return (
    <ReactFlowProvider>
      <FlowchartEditor engagementId={engagementId} />
    </ReactFlowProvider>
  );
}
