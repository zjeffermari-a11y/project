import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Folder, ChevronDown, ChevronRight, FileText, Plus, PenTool, Download, CheckCircle, CheckCircle2, RotateCcw, Building2, Calendar, FileCheck2, FileCode2, ExternalLink, Lock } from 'lucide-react';
import api from '../api';
import MovTable from '../components/dashboard/MovTable';
import SignOffButton from '../components/common/SignOffButton';


const DOCUMENTS = {
    planning: { title: 'Audit Planning Documents', theme: 'indigo', items: [
        { label: 'Interactive Flowchart', toolKey: 'flowchart' },
        { label: 'Audit Notification Memorandum (ANM)', toolKey: null, generateKey: 'anm' },
        { label: 'Inventory of MOVs (IM)', toolKey: 'iom' },
        { label: 'Audit Area Profile (AAP)', toolKey: 'aap' },
        { label: 'Audit Engagement Plan (AEP)', toolKey: null },
        { label: 'Audit Work Program (AWP)', toolKey: 'awp' },
        { label: 'Summary of Audit Team Roles (RR)', toolKey: null },
        { label: 'Compliance Checklist (CC)', toolKey: 'ccl' },
        { label: 'Management Audit Checklist', toolKey: 'mac' },
    ]},
    execution: { title: 'Audit Execution Documents', theme: 'emerald', items: [
        { label: 'Audit Inquiry Memorandum (AIM)', toolKey: null },
        { label: 'Notice of Entry/Exit Conference (ECM)', toolKey: 'neecm' },
        { label: 'Entry Conference Briefer (ECB)', toolKey: 'ecb' },
        { label: 'Entry/Exit Conference Notes (ECN)', toolKey: null },
        { label: 'Operations Audit Checklist (OAC)', toolKey: 'oac' },
        { label: 'Walkthrough Test Work Paper (WT)', toolKey: 'wt' },
        { label: 'Interim Audit Memorandum (IAM)', toolKey: null },
        { label: 'Interview Notes (IN)', toolKey: null },
    ]},
    reporting: { title: 'Audit Reporting Documents', theme: 'amber', items: [
        { label: 'Internal Audit Report (IAR)', toolKey: null },
        { label: 'Audit Feedback Survey Form (AFSF)', toolKey: null },
        { label: 'Audit Feedback Survey Analysis Report (AFSAR)', toolKey: null },
    ]},
    followup: { title: 'Audit Follow Up Documents', theme: 'rose', items: [
        { label: 'Action Plan Status (AAPIS)', toolKey: null },
        { label: 'Compliance to Recommendations (IAsCARes)', toolKey: null },
        { label: 'Internal Audit Follow-up Report (IAFR)', toolKey: null },
        { label: 'Completion Assessment Report (ComARe)', toolKey: null },
    ]}
};


const THEMES = {
    indigo: { ring: 'ring-indigo-500', hoverBorder: 'hover:border-indigo-500', bgMain: 'bg-indigo-600', textMain: 'text-indigo-600', bgLight: 'bg-indigo-50', bgHover: 'hover:bg-indigo-50', borderLight: 'border-indigo-100', textLight: 'text-indigo-400', borderDash: 'border-indigo-300', dashHover: 'hover:border-indigo-400' },
    emerald: { ring: 'ring-emerald-500', hoverBorder: 'hover:border-emerald-500', bgMain: 'bg-emerald-600', textMain: 'text-emerald-600', bgLight: 'bg-emerald-50', bgHover: 'hover:bg-emerald-50', borderLight: 'border-emerald-100', textLight: 'text-emerald-400', borderDash: 'border-emerald-300', dashHover: 'hover:border-emerald-500' },
    amber: { ring: 'ring-amber-500', hoverBorder: 'hover:border-amber-500', bgMain: 'bg-amber-600', textMain: 'text-amber-600', bgLight: 'bg-amber-50', bgHover: 'hover:bg-amber-50', borderLight: 'border-amber-100', textLight: 'text-amber-400', borderDash: 'border-amber-300', dashHover: 'hover:border-amber-400' },
    rose: { ring: 'ring-rose-500', hoverBorder: 'hover:border-rose-500', bgMain: 'bg-rose-600', textMain: 'text-rose-600', bgLight: 'bg-rose-50', bgHover: 'hover:bg-rose-50', borderLight: 'border-rose-100', textLight: 'text-rose-400', borderDash: 'border-rose-300', dashHover: 'hover:border-rose-400' }
};

import { useDataContext } from '../context/DataContext';

function DocumentItem({ doc, phaseKey, themeColor, engagementId, documents, onRefresh }) {
    const { refreshData } = useDataContext();
    const [expanded, setExpanded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const theme = THEMES[themeColor];
    const { label, toolKey, generateKey } = doc;

    const relatedDocs = documents.filter(d => d.phase === phaseKey && d.document_type === label);


    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !engagementId) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('engagement_id', engagementId);
        formData.append('document_type', label);
        formData.append('phase', phaseKey);
        try {
            await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onRefresh();
            refreshData();
        } catch (err) { alert('Upload failed: ' + (err.response?.data?.message || err.message)); } 
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleSign = async (docId) => {
        try { 
            await api.post(`/documents/${docId}/sign`); 
            onRefresh(); 
            refreshData();
        } catch (err) { alert('Sign failed: ' + err.message); }
    };

    const handleDownload = async (docId, fileName) => {
        try {
            const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a'); link.href = url; link.setAttribute('download', fileName);
            document.body.appendChild(link); link.click(); link.parentNode.removeChild(link);
        } catch (err) { alert('Download failed'); }
    };

    return (
        <div className={`flex flex-col p-5 rounded-xl border ${theme.borderLight} ${theme.bgLight}/30 ${theme.bgHover} transition-colors group`}>
            <div className="flex items-center justify-between w-full cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-4 pr-2">
                    <div className={`${theme.textLight} group-hover:${theme.textMain}`}><Folder className="h-7 w-7" /></div>
                    <span className="text-sm font-bold text-slate-800">{label}</span>
                    {toolKey && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded">Interactive</span>}
                </div>
                <div className="flex items-center gap-4">
                    {relatedDocs.length > 0 && <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${theme.bgLight} ${theme.textMain}`}>{relatedDocs.length} File{relatedDocs.length > 1 ? 's' : ''}</span>}
                    <div className={`${theme.textLight} group-hover:${theme.textMain} shrink-0`}>{expanded ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}</div>
                </div>
            </div>

            {expanded && (
                <div className={`mt-5 pt-5 border-t ${theme.borderLight} overflow-x-auto transition-all animate-in fade-in slide-in-from-top-2`}>
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead><tr className={`text-[10px] uppercase tracking-widest text-slate-400 border-b ${theme.borderLight}`}><th className="pb-3 font-black">File Version</th><th className="pb-3 font-black pl-3">Uploaded By</th><th className="pb-3 font-black pl-3">Status</th><th className="pb-3 font-black text-right">Action</th></tr></thead>
                        <tbody className={`divide-y divide-${themeColor}-50`}>
                            {relatedDocs.length > 0 ? relatedDocs.map((d, index) => (
                                <tr key={d.id} className="hover:bg-white/60 transition-colors">
                                    <td className="py-4 flex items-center gap-2"><FileText className={`h-4 w-4 ${theme.textMain}`} /><span className="text-xs text-slate-700 font-bold">{d.file_name} <span className="text-slate-400 ml-1">(v{index + 1})</span></span></td>
                                    <td className="py-4 pl-3 text-xs text-slate-600 font-bold">{d.uploader?.name || 'Unknown'}</td>
                                    <td className="py-4 pl-3">{d.status === 'signed' ? <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">✓ Signed by {d.signer?.name}</span> : <span className="text-xs text-amber-500 font-bold italic">Pending Review</span>}</td>
                                    <td className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {d.status !== 'signed' && <button onClick={() => handleSign(d.id)} className={`text-xs ${theme.textMain} font-bold hover:underline flex items-center gap-1`}><PenTool className="h-3 w-3"/> Sign</button>}
                                            <button onClick={() => handleDownload(d.id, d.file_name)} className={`text-xs text-slate-500 hover:${theme.textMain} font-bold hover:underline flex items-center gap-1`}><Download className="h-3 w-3"/> Download</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="4" className="py-6 text-center text-xs text-slate-400 font-bold italic">No files uploaded yet.</td></tr>}
                        </tbody>
                    </table>

                    {/* Interactive Tool Button */}
                    {toolKey && (
                        <div className={`mt-4 mb-2 p-4 rounded-xl border border-indigo-200 bg-indigo-50 flex items-center justify-between`}>
                            <div>
                                <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2"><FileCode2 className="w-4 h-4"/>Interactive Tool Available</h4>
                                <p className="text-[10px] text-indigo-600 font-bold mt-1">Open the fillable, saveable digital form. Auditees can view but not edit.</p>
                            </div>
                            <Link to={`/auditor/workspace/${engagementId}/tool/${toolKey}`} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-indigo-700 transition-colors shrink-0 flex items-center gap-2">
                                <ExternalLink className="w-3.5 h-3.5" /> Open Tool
                            </Link>
                        </div>
                    )}

                    {/* Generate Template Button (ANM, AWP) */}
                    {generateKey && (
                        <div className={`mt-4 mb-2 p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-between`}>
                            <div>
                                <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2"><FileCode2 className="w-4 h-4"/>Dynamic Template Available</h4>
                                <p className="text-[10px] text-blue-600 font-bold mt-1">Automatically generate this document filled with engagement details.</p>
                            </div>
                            <Link to={`/auditor/workspace/${engagementId}/generate/${generateKey}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-colors shrink-0">
                                Generate Draft
                            </Link>
                        </div>
                    )}


                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading || !engagementId} className={`mt-5 w-full py-3 bg-white border border-dashed ${theme.borderDash} rounded-lg text-xs font-black uppercase tracking-widest ${theme.textMain} ${theme.bgHover} ${theme.dashHover} transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}>{uploading ? 'Uploading...' : <><Plus className="h-4 w-4" /> Add File Version</>}</button>
                </div>
            )}
        </div>
    );
}


export default function AuditWorkspace() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { engagements, refreshData } = useDataContext();
    const [engagement, setEngagement] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('tools'); // 'tools', 'movs', 'trail'
    const [selectedPhase, setSelectedPhase] = useState(null);
    const [awpTool, setAwpTool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completingPhase, setCompletingPhase] = useState(false);

    useEffect(() => {
        fetchWorkspaceData();
    }, [id]);

    const fetchWorkspaceData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [engRes, docRes, logRes, awpRes] = await Promise.all([
                api.get(`/engagements/${id}`),
                api.get(`/engagements/${id}/documents`),
                api.get(`/engagements/${id}/activity-logs`).catch(() => ({ data: [] })),
                api.get(`/engagements/${id}/tools/awp`).catch(() => ({ data: null }))
            ]);

            // Directly set engagement from API so phase_completions is always fresh
            setEngagement(engRes.data);

            // Also re-sync global engagements context
            await refreshData();

            setDocuments(docRes.data);
            setLogs(logRes.data);
            setAwpTool(awpRes.data);
        } catch (err) {
            console.error('Failed to load workspace', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };


    // Derived engagement from global context
    useEffect(() => {
        if (engagements.length > 0) {
            const current = engagements.find(e => e.id.toString() === id.toString());
            setEngagement(current || null);
        }
    }, [engagements, id]);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const engagementUser = engagement?.users?.find(u => u.id === currentUser?.id);
    const userRoleInEngagement = engagementUser?.pivot?.role_in_engagement;

    const isAuditor = ['Lead Auditor', 'Auditor', 'Director'].includes(userRoleInEngagement);
    const isAuditee = userRoleInEngagement === 'Auditee';

    const handleAddMov = async (data) => {
        try {
            await api.post(`/engagements/${id}/movs`, data);
            const res = await api.get(`/engagements/${id}`);
            setEngagement(res.data);
        } catch (err) {
            console.error('Failed to add MOV:', err);
        }
    };

    const handleUpdateMov = async (movId, data) => {
        try {
            await api.patch(`/engagements/${id}/movs/${movId}`, data);
            const res = await api.get(`/engagements/${id}`);
            setEngagement(res.data);
        } catch (err) {
            console.error('Failed to update MOV:', err);
        }
    };

    const handleDeleteMov = async (movId) => {
        if (!window.confirm('Are you sure you want to delete this requirement?')) return;
        try {
            await api.delete(`/engagements/${id}/movs/${movId}`);
            const res = await api.get(`/engagements/${id}`);
            setEngagement(res.data);
        } catch (err) {
            console.error('Failed to delete MOV:', err);
        }
    };

    const handleDownload = async (docId, fileName) => {
        try {
            const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a'); link.href = url; link.setAttribute('download', fileName);
            document.body.appendChild(link); link.click(); link.parentNode.removeChild(link);
        } catch (err) { alert('Download failed'); }
    };

    const handleAssign = async (docId, roleField, userId) => {
        try {
            await api.patch(`/documents/${docId}/assign`, { [roleField]: userId || null });
            await refreshData();
            fetchWorkspaceData();
        } catch (err) {
            alert('Assignment failed: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400">Loading Workspace...</div>;
    if (!engagement) return <div className="p-10 text-center font-bold text-rose-500">Engagement not found.</div>;

    // Phase gate: a phase is unlocked if:
    //   a) it is 'planning' (always open), OR
    //   b) the previous phase is recorded in engagement.phase_completions, OR
    //   c) all interactive tool docs in the previous phase have an approval signal.
    const PHASE_ORDER = ['planning', 'execution', 'reporting', 'followup'];

    const isPhaseUnlocked = (phaseId) => {
        const idx = PHASE_ORDER.indexOf(phaseId);
        if (idx <= 0) return true; // planning is always open
        const prevPhase = PHASE_ORDER[idx - 1];

        // ✅ Primary gate: explicit Team Leader sign-off persisted in DB
        const completions = engagement?.phase_completions || {};
        if (completions[prevPhase]) return true;

        // 🔒 Fallback: derive from document approvals (only applies if prev phase
        //    has interactive tool docs). Phases with NO tool docs (e.g. Reporting)
        //    are ONLY unlocked via phase_completions — never by the fallback.
        const prevItems = DOCUMENTS[prevPhase]?.items || [];
        const prevToolItems = prevItems.filter(d => d.toolKey);
        if (prevToolItems.length === 0) return false; // must be explicitly completed

        return prevToolItems.every(doc => {
            const docs = documents.filter(d => d.phase === prevPhase && d.document_type === doc.label);
            if (docs.length === 0) return false;
            const latest = docs.sort((a, b) => b.id - a.id)[0];
            const hasApproval =
                latest?.approved_by_id != null ||
                latest?.status === 'approved' ||
                latest?.history?.some(h => {
                    const s = (h.stage || '').toLowerCase().replace(/\s+/g, '_');
                    return s === 'approved_by' || s === 'approved';
                });
            return hasApproval;
        });
    };


    // Returns true if the given phase has been explicitly marked complete
    const isPhaseCompleted = (phaseId) => {
        const completions = engagement?.phase_completions || {};
        return !!completions[phaseId];
    };

    // Team Leader / Executive check (can mark phases complete)
    const canMarkComplete = () => {
        if (!currentUser || !engagement) return false;
        const engUser = engagement.users?.find(u => u.id === currentUser.id);
        const role = engUser?.pivot?.role_in_engagement;
        const executiveDesignations = ['director', 'division_chief', 'assistant_division_chief'];
        return role === 'team_leader' || executiveDesignations.includes(currentUser.designation);
    };

    const handleCompletePhase = async (phaseId) => {
        if (!window.confirm(`Mark the "${phaseId}" phase as complete? This will unlock the next phase for your team.`)) return;
        setCompletingPhase(true);
        try {
            await api.patch(`/engagements/${id}/complete-phase`, { phase: phaseId });
            await fetchWorkspaceData(true); // silent refresh — no loading spinner
        } catch (err) {
            alert('Failed to mark phase complete: ' + (err.response?.data?.message || err.message));
        } finally {
            setCompletingPhase(false);
        }
    };

    const PhaseCard = ({ phaseId, label, iconTheme }) => {
        const isSelected = selectedPhase === phaseId;
        const theme = THEMES[iconTheme];
        const unlocked = isPhaseUnlocked(phaseId);
        return (
            <div
                onClick={() => {
                    if (!unlocked) return;
                    setSelectedPhase(phaseId);
                }}
                title={!unlocked ? `Complete all ${DOCUMENTS[PHASE_ORDER[PHASE_ORDER.indexOf(phaseId)-1]]?.title} before proceeding.` : ''}
                className={`group bg-white p-6 rounded-[2rem] border shadow-sm transition-all duration-300 flex flex-col items-center text-center ${
                    !unlocked
                        ? 'border-slate-100 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? `ring-4 ${theme.ring} border-transparent shadow-xl scale-105 cursor-pointer`
                        : `border-slate-200 hover:shadow-xl ${theme.hoverBorder} cursor-pointer`
                }`}
            >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-inner ${
                    !unlocked
                        ? 'bg-slate-100 text-slate-300'
                        : isSelected
                        ? `${theme.bgMain} text-white`
                        : `${theme.bgLight} ${theme.textMain} group-hover:${theme.bgMain} group-hover:text-white`
                }`}>
                    {!unlocked ? <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> : <Folder className="h-10 w-10" />}
                </div>
                <h3 className={`font-black uppercase text-[10px] tracking-widest ${!unlocked ? 'text-slate-400' : 'text-slate-800'}`}>{label}</h3>
                {!unlocked && <span className="text-[9px] font-bold text-slate-400 mt-1">Locked</span>}
            </div>
        );
    };

    const getStatusBadge = (status) => {
        const map = {
            'pending': 'bg-slate-100 text-slate-500 border-slate-200',
            'submitted': 'bg-amber-50 text-amber-600 border-amber-200',
            'approved': 'bg-emerald-50 text-emerald-600 border-emerald-200',
            'returned': 'bg-rose-50 text-rose-600 border-rose-200',
        };
        return map[status] || map['pending'];
    };

    return (
        <div className="h-screen bg-slate-50 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-slate-900 text-white px-8 py-6 shrink-0 z-10 sticky top-0 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <button onClick={() => navigate('/auditor')} className="flex items-center gap-2 text-indigo-300 hover:text-white mb-4 text-xs font-bold uppercase tracking-widest transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border bg-slate-800 border-slate-700 text-slate-300`}>
                                    Status: {engagement.status || 'planning'}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tight">{engagement.title}</h1>
                            <p className="text-slate-400 font-bold mt-1 max-w-2xl text-sm">{engagement.description}</p>
                        </div>
                        <div className="flex items-center gap-6 text-slate-300 text-xs font-bold">
                            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700"><Calendar className="w-4 h-4 text-indigo-400" /> {engagement.start_date || 'TBD'} - {engagement.end_date || 'TBD'}</div>
                            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700"><Building2 className="w-4 h-4 text-emerald-400" /> {(engagement.movs || []).length} MOVs</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200 sticky top-[148px] z-10">
                <div className="max-w-7xl mx-auto px-8 flex gap-8">
                    <button onClick={() => setActiveTab('tools')} className={`py-4 font-black uppercase tracking-widest text-xs border-b-2 transition-colors ${activeTab === 'tools' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <span className="flex items-center gap-2"><Folder className="w-4 h-4" /> Internal Working Papers (Tools)</span>
                    </button>
                    <button onClick={() => setActiveTab('movs')} className={`py-4 font-black uppercase tracking-widest text-xs border-b-2 transition-colors ${activeTab === 'movs' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <span className="flex items-center gap-2"><FileCheck2 className="w-4 h-4" /> Auditee Submissions (MOVs)</span>
                    </button>
                    <button onClick={() => setActiveTab('trail')} className={`py-4 font-black uppercase tracking-widest text-xs border-b-2 transition-colors ${activeTab === 'trail' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Audit Trail</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-10">
                <div className="max-w-7xl mx-auto">
                    
                    {/* TOOLS TAB */}
                    {activeTab === 'tools' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-sm font-bold text-slate-500 mb-8">Select a phase below to strictly track and manage all generated internal audit document versions specific to this engagement.</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                <PhaseCard phaseId="planning" label="Audit Planning" iconTheme="indigo" />
                                <PhaseCard phaseId="execution" label="Audit Execution" iconTheme="emerald" />
                                <PhaseCard phaseId="reporting" label="Audit Reporting" iconTheme="amber" />
                                <PhaseCard phaseId="followup" label="Audit Follow Up" iconTheme="rose" />
                            </div>

                                {/* Phase document table */}
                            {selectedPhase && DOCUMENTS[selectedPhase] && (
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Folder className="h-5 w-5 text-slate-400" />
                                            <h2 className="text-sm font-black text-slate-600 uppercase tracking-widest">{DOCUMENTS[selectedPhase].title}</h2>
                                        </div>
                                        {/* Phase completion badge */}
                                        {isPhaseCompleted(selectedPhase) && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3" /> Phase Complete
                                            </span>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-200 bg-slate-50/50">
                                                    <th className="py-4 pl-6 font-black">Document / Tools</th>
                                                    <th className="py-4 px-4 font-black">Prepared By</th>
                                                    <th className="py-4 px-4 font-black">Reviewed By</th>
                                                    <th className="py-4 px-4 font-black">Approved By</th>
                                                    <th className="py-4 pr-6 text-right font-black">Final</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {DOCUMENTS[selectedPhase].items.map((doc, idx) => {
                                                    const relatedDocs = documents
                                                        .filter(d => d.phase === selectedPhase && d.document_type === doc.label)
                                                        .sort((a, b) => b.id - a.id);
                                                    const latestDoc = relatedDocs.length > 0 ? relatedDocs[0] : null;

                                                    // Read signatories from the tool's own form_data (saved via StandardAuditFooter)
                                                    const toolFormData = latestDoc?.form_data || {};

                                                    // Prepared By: prefer history sign-off > form_data > uploader
                                                    const prepHistEntry = latestDoc?.history?.find(h => h.stage === 'Prepared' || h.stage === 'prepared_by');
                                                    const preparedBy = prepHistEntry?.user?.name || toolFormData.preparedBy || latestDoc?.uploader?.name || null;
                                                    const preparedTitle = toolFormData.preparedTitle || '';
                                                    const isPrepSigned = !!prepHistEntry;

                                                    // Reviewed By: prefer history sign-off > form_data > role lookup
                                                    const revHistEntry = latestDoc?.history?.find(h => h.stage === 'Reviewed' || h.stage === 'reviewed_by');
                                                    const atlUser = engagement.users?.find(u =>
                                                        ['assistant team leader', 'asst_team_leader', 'atl'].includes(u.pivot?.role_in_engagement?.toLowerCase())
                                                    );
                                                    const tlUser = engagement.users?.find(u =>
                                                        ['team leader', 'lead_auditor', 'tl'].includes(u.pivot?.role_in_engagement?.toLowerCase())
                                                    );
                                                    const reviewedBy = revHistEntry?.user?.name || toolFormData.reviewedBy || atlUser?.name || tlUser?.name || null;
                                                    const reviewedTitle = toolFormData.reviewedTitle || '';
                                                    const isRevSigned = !!revHistEntry;

                                                    // Approved By: prefer history sign-off > form_data > director role lookup
                                                    const aprvHistEntry = latestDoc?.history?.find(h => h.stage === 'Approved' || h.stage === 'approved_by');
                                                    const directorUser = engagement.users?.find(u =>
                                                        u.pivot?.role_in_engagement?.toLowerCase() === 'director'
                                                    );
                                                    const approvedBy = aprvHistEntry?.user?.name || toolFormData.approvedBy || directorUser?.name || null;
                                                    const approvedTitle = toolFormData.approvedTitle || '';
                                                    const isAprvSigned = !!aprvHistEntry;

                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="py-4 pl-6">
                                                                <div className="flex items-start gap-4">
                                                                    <div className={`p-2 rounded-xl bg-${DOCUMENTS[selectedPhase].theme}-50 border border-${DOCUMENTS[selectedPhase].theme}-100 shrink-0 mt-0.5`}>
                                                                        <FileText className={`w-5 h-5 text-${DOCUMENTS[selectedPhase].theme}-600`} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-black text-slate-800">{doc.label}</div>
                                                                        {latestDoc && <div className="text-[10px] font-bold text-slate-400 mt-1">Updated: {new Date(latestDoc.updated_at).toLocaleDateString()}</div>}
                                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                                            {doc.toolKey && (
                                                                                isPhaseUnlocked(selectedPhase) ? (
                                                                                    <Link to={`/auditor/workspace/${engagement.id}/tool/${doc.toolKey}`} className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors">
                                                                                        <FileCode2 className="w-3 h-3" /> Interactive Tool
                                                                                    </Link>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 cursor-not-allowed" title="Complete and approve the previous phase first.">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                                                        Locked
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                            {doc.generateKey && (
                                                                                isPhaseUnlocked(selectedPhase) ? (
                                                                                    <Link to={`/auditor/workspace/${engagement.id}/generate/${doc.generateKey}`} className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors">
                                                                                        <PenTool className="w-3 h-3" /> Generate Draft
                                                                                    </Link>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 cursor-not-allowed" title="Complete and approve the previous phase first.">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                                                        Locked
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            
                                                            {/* Prepared By cell */}
                                                            <td className="py-4 px-4 align-middle">
                                                                {isPrepSigned ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0">
                                                                            {(prepHistEntry?.signer_name || preparedBy || '?').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[11px] font-black text-slate-800 leading-tight">{prepHistEntry?.signer_name || preparedBy}</div>
                                                                            {prepHistEntry?.designation && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{prepHistEntry.designation}</div>}
                                                                            <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" />Signed</div>
                                                                        </div>
                                                                    </div>
                                                                ) : latestDoc ? (
                                                                    <SignOffButton
                                                                        documentId={latestDoc.id}
                                                                        stage="prepared_by"
                                                                        label="Prepared By"
                                                                        history={latestDoc.history || []}
                                                                        onSuccess={() => fetchWorkspaceData(true)}
                                                                    />
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No file yet</span>
                                                                )}
                                                            </td>

                                                            {/* Reviewed By cell */}
                                                            <td className="py-4 px-4 align-middle">
                                                                {isRevSigned ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0">
                                                                            {(revHistEntry?.signer_name || reviewedBy || '?').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[11px] font-black text-slate-800 leading-tight">{revHistEntry?.signer_name || reviewedBy}</div>
                                                                            {revHistEntry?.designation && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{revHistEntry.designation}</div>}
                                                                            <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" />Signed</div>
                                                                        </div>
                                                                    </div>
                                                                ) : isPrepSigned && latestDoc ? (
                                                                    <SignOffButton
                                                                        documentId={latestDoc.id}
                                                                        stage="reviewed_by"
                                                                        label="Reviewed By"
                                                                        history={latestDoc.history || []}
                                                                        onSuccess={() => fetchWorkspaceData(true)}
                                                                    />
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">{isPrepSigned ? 'No file yet' : 'Awaiting Prep'}</span>
                                                                )}
                                                            </td>

                                                            {/* Approved By cell */}
                                                            <td className="py-4 px-4 align-middle">
                                                                {isAprvSigned ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0">
                                                                            {(aprvHistEntry?.signer_name || approvedBy || '?').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[11px] font-black text-slate-800 leading-tight">{aprvHistEntry?.signer_name || approvedBy}</div>
                                                                            {aprvHistEntry?.designation && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{aprvHistEntry.designation}</div>}
                                                                            <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" />Approved</div>
                                                                        </div>
                                                                    </div>
                                                                ) : isRevSigned && latestDoc ? (
                                                                    <SignOffButton
                                                                        documentId={latestDoc.id}
                                                                        stage="approved_by"
                                                                        label="Approved By"
                                                                        history={latestDoc.history || []}
                                                                        onSuccess={() => fetchWorkspaceData(true)}
                                                                    />
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">{isRevSigned ? 'No file yet' : 'Awaiting Review'}</span>
                                                                )}
                                                            </td>

                                                            <td className="py-4 pr-6 text-right">
                                                                {latestDoc ? (
                                                                    <button onClick={() => handleDownload(latestDoc.id, latestDoc.file_name)} className="p-2 border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm" title="Download Latest Version">
                                                                        <Download className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <div className="text-slate-200 p-2 border border-dashed border-slate-100 rounded-xl">
                                                                        <Download className="w-4 h-4" />
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mark as Complete footer — only visible to Team Leaders & Executives */}
                                    {canMarkComplete() && (
                                        <div className={`px-6 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4`}>
                                            {isPhaseCompleted(selectedPhase) ? (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-widest">Phase Signed Off</p>
                                                        <p className="text-[10px] font-bold text-emerald-500 mt-0.5">
                                                            Completed on {new Date(engagement.phase_completions?.[selectedPhase]).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Team Leader Sign-Off</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Mark this phase as complete to unlock the next stage for your team.</p>
                                                </div>
                                            )}
                                            {!isPhaseCompleted(selectedPhase) && (
                                                <button
                                                    onClick={() => handleCompletePhase(selectedPhase)}
                                                    disabled={completingPhase}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm shrink-0"
                                                >
                                                    <Lock className="w-3.5 h-3.5" />
                                                    {completingPhase ? 'Saving...' : 'Mark as Complete'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MOVS TAB */}
                    {activeTab === 'movs' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-100 bg-emerald-50 text-emerald-900">
                                    <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-emerald-600" /> Status Tracker</h3>
                                    <p className="text-xs text-emerald-600/70 mt-1 font-bold">Review and approve initial requirement submissions from assigned auditees.</p>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {(!engagement.movs || engagement.movs.length === 0) ? (
                                        <div className="p-12 text-center text-slate-400 italic text-sm font-bold">No MOVs assigned to this engagement yet.</div>
                                    ) : engagement.movs.map(mov => (
                                        <div key={mov.id} className="p-6 hover:bg-slate-50 border-l-4 border-l-transparent hover:border-l-emerald-400 transition-colors">
                                            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h4 className="text-base font-black text-slate-800">{mov.requirement_name}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Auditee Office ID: {mov.auditee_id}</p>
                                                    <div className="mt-3">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(mov.status)}`}>{mov.status}</span>
                                                    </div>
                                                    {mov.management_comment && (
                                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Management Comment:</p>
                                                            <p className="text-xs text-amber-800 font-medium">{mov.management_comment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {mov.status === 'submitted' && (
                                                    <div className="flex flex-row md:flex-col gap-2 shrink-0">
                                                        <button onClick={() => handleMovAction(mov.id, 'approved')} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm shadow-emerald-200"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
                                                        <button onClick={() => handleMovAction(mov.id, 'returned')} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 hover:border-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Return</button>
                                                    </div>
                                                )}
                                                {mov.status === 'approved' && <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-black uppercase tracking-widest"><CheckCircle className="w-4 h-4" /> Approved</div>}
                                                {mov.status === 'returned' && <div className="flex items-center gap-1.5 text-rose-500 text-xs font-black uppercase tracking-widest"><RotateCcw className="w-4 h-4" /> Sent Back</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AUDIT TRAIL TAB */}
                    {activeTab === 'trail' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-100 bg-amber-50 text-amber-900">
                                    <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /> Audit Trail</h3>
                                    <p className="text-xs text-amber-600/70 mt-1 font-bold">Chronological ledger of all state-mutating activities for this engagement.</p>
                                </div>
                                <div className="p-8">
                                    {(!logs || logs.length === 0) ? (
                                        <div className="text-center text-slate-400 italic text-sm font-bold py-10">No activities recorded yet.</div>
                                    ) : (
                                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-8 pb-4">
                                            {logs.map((log, idx) => (
                                                <div key={log.id} className="relative">
                                                    <div className="absolute -left-[41px] bg-white border-4 border-amber-100 w-5 h-5 rounded-full flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-1 rounded-md">{log.action_type.replace('_', ' ')}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-800">{log.description}</p>
                                                        <p className="text-xs text-slate-500 mt-1">By: {log.user?.name || 'System'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
