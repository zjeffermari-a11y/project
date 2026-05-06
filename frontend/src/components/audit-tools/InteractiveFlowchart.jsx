import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { Save, Plus, Trash2, Layout } from 'lucide-react';
import api from '../../api';
import StandardAuditFooter from '../common/StandardAuditFooter';


const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start Audit Process' },
    position: { x: 250, y: 5 },
  },
];

let id = 1;
const getId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const FlowchartEditor = ({ engagement, user, readOnly }) => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [signOffHistory, setSignOffHistory] = useState([]);

  const [formData, setFormData] = useState({
    nodes: initialNodes,
    edges: [],
    preparedBy: '', preparedTitle: 'Auditor',
    reviewedBy: '', reviewedTitle: 'Assistant Team Leader',
    approvedBy: '', approvedTitle: 'IAS Director',
    attachments: []
  });

  const nodes = formData.nodes;
  const edges = formData.edges;

  const setNodes = (nds) => setFormData(fd => ({ ...fd, nodes: typeof nds === 'function' ? nds(fd.nodes) : nds }));
  const setEdges = (eds) => setFormData(fd => ({ ...fd, edges: typeof eds === 'function' ? eds(fd.edges) : eds }));

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));


  useEffect(() => {
    fetchVersions();
    loadLatest();
  }, [engagement.id]);


  const fetchVersions = async () => {
    try {
      const res = await api.get(`/engagements/${engagement.id}/tools/flowchart/versions`);
      setVersions(res.data);
    } catch (_) {}
  };

  const loadLatest = async () => {
    try {
      const res = await api.get(`/engagements/${engagement.id}/tools/flowchart`);
      if (res.data?.form_data) {
        setFormData(fd => ({ ...fd, ...res.data.form_data }));
        setSignOffHistory(res.data.document?.history || res.data.sign_off_history || []);
        setSelectedVersionId(res.data.document?.id || res.data.id);
      }
    } catch (_) {}
  };


  const handleVersionSelect = async (versionId) => {
    try {
      const docRes = await api.get(`/engagements/${engagement.id}/documents`);
      const target = docRes.data.find(d => d.id === parseInt(versionId));
      if (target && target.form_data) {
        setFormData(fd => ({ ...fd, ...target.form_data }));
        setSignOffHistory(target.history || target.sign_off_history || []);
        setSelectedVersionId(versionId);
      }
    } catch (e) { alert('Failed to load version: ' + e.message); }
  };


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
      if (!type || !reactFlowInstance) return;

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

  const handleSave = async () => {
    if (!reactFlowInstance) return;
    setSaving(true);
    try {
      const flow = reactFlowInstance.toObject();
      const res = await api.post(`/engagements/${engagement.id}/tools/flowchart`, {
        form_data: { ...formData, nodes: flow.nodes, edges: flow.edges },
        document_type: 'Process Flowchart',
        phase: 'planning'
      });
      setLastSaved(new Date().toLocaleTimeString());
      fetchVersions();
      if (res.data.document) setSelectedVersionId(res.data.document.id);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };


  const handleSignOffSuccess = (data) => {
    setSignOffHistory(data.document?.history || []);
    if (data.document?.id) setSelectedVersionId(data.document.id);
    fetchVersions();
  };

  return (
    <AuditToolWrapper
      toolTitle="Process Flowchart"
      toolCode="FLOW"
      phase="Audit Planning"
      engagementTitle={engagement.title}
      onSave={handleSave}
      isSaving={saving}
      lastSaved={lastSaved}
      readOnly={readOnly}
      versions={versions}
      selectedVersionId={selectedVersionId}
      onVersionSelect={handleVersionSelect}
    >
      <div className="flex h-[calc(100vh-160px)] w-full border border-slate-700 rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
        {!readOnly && (
          <div className="w-72 bg-slate-800 border-r border-slate-700 p-6 flex flex-col gap-6">
            <div>
              <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-4">Flow Elements</h3>
              <div className="space-y-3">
                <div 
                  className="bg-emerald-500/10 border-2 border-emerald-500/50 p-4 rounded-xl text-center text-[11px] cursor-grab shadow-lg font-black text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95" 
                  onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'input')} 
                  draggable
                >
                  START PROCESS
                </div>
                
                <div 
                  className="bg-indigo-500/10 border-2 border-indigo-500/50 p-4 rounded-xl text-center text-[11px] cursor-grab shadow-lg font-black text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-95" 
                  onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'default')} 
                  draggable
                >
                  PROCEDURE STEP
                </div>
                
                <div 
                  className="bg-rose-500/10 border-2 border-rose-500/50 p-4 rounded-xl text-center text-[11px] cursor-grab shadow-lg font-black text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95" 
                  onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'output')} 
                  draggable
                >
                  END PROCESS
                </div>
              </div>
            </div>
          </div>
        )}


        <div className="flex-1 relative bg-[#0f172a]" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={readOnly ? undefined : onNodesChange}
            onEdgesChange={readOnly ? undefined : onEdgesChange}
            onConnect={readOnly ? undefined : onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            defaultEdgeOptions={{ style: { stroke: '#6366f1', strokeWidth: 3 }, animated: true }}
          >
            <Controls className="bg-slate-800 border-slate-700 fill-white" />
            <MiniMap 
              style={{ background: '#1e293b' }}
              maskColor="rgba(0, 0, 0, 0.3)"
              nodeStrokeColor={(n) => {
                if (n.type === 'input') return '#10b981';
                if (n.type === 'output') return '#f43f5e';
                if (n.type === 'default') return '#6366f1';
                return '#94a3b8';
              }} 
              nodeColor={(n) => {
                if (n.type === 'input') return '#10b981';
                if (n.type === 'output') return '#f43f5e';
                if (n.type === 'default') return '#6366f1';
                return '#1e293b';
              }} 
            />
            <Background color="#334155" variant="lines" gap={20} size={1} />
          </ReactFlow>
        </div>
      </div>
      <StandardAuditFooter 
        documentId={selectedVersionId}
        history={signOffHistory}
        onSigned={handleSignOffSuccess}
        readOnly={readOnly}
        formData={formData}
        setFormData={set}
        className="bg-white p-12 mt-12 border-t-2 border-slate-100 rounded-b-2xl shadow-inner"
        signatories={[
          { label: 'Prepared by', stage: 'prepared', nameField: 'preparedBy', titleField: 'preparedTitle' },
          { label: 'Reviewed by', stage: 'reviewed', nameField: 'reviewedBy', titleField: 'reviewedTitle' },
          { label: 'Approved by', stage: 'approved', nameField: 'approvedBy', titleField: 'approvedTitle' }
        ]}
      />
    </AuditToolWrapper>

  );
};

export default function InteractiveFlowchart({ engagement, user, readOnly }) {
  return (
    <ReactFlowProvider>
      <FlowchartEditor engagement={engagement} user={user} readOnly={readOnly} />
    </ReactFlowProvider>
  );
}
