import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Folder, ChevronDown, ChevronRight, FileText, Plus, PenTool, Download, CheckCircle, RotateCcw, Building2, Calendar, FileCheck2, FileCode2 } from 'lucide-react';
import api from '../api';

const DOCUMENTS = {
    planning: { title: 'Audit Planning Documents', theme: 'indigo', items: ['Audit Notification Memorandum (ANM)', 'Inventory of MOVs (IM)', 'Audit Area Profile (AAP)', 'Audit Engagement Plan (AEP)', 'Audit Work Program (AWP)', 'Summary of Audit Team Roles (RR)', 'Compliance Checklist (CC)', 'Management Audit Checklist', 'Audit Inquiry Memorandum (AIM)'] },
    execution: { title: 'Audit Execution Documents', theme: 'emerald', items: ['Notice of Entry/Exit Conference (ECM)', 'Entry/Exit Conference Notes (ECN)', 'Interim Audit Memorandum (IAM)', 'Interview Notes (IN)', 'Walkthrough Test Work Paper (WT)'] },
    reporting: { title: 'Audit Reporting Documents', theme: 'amber', items: ['Internal Audit Report (IAR)', 'Audit Feedback Survey Form (AFSF)', 'Audit Feedback Survey Analysis Report (AFSAR)'] },
    followup: { title: 'Audit Follow Up Documents', theme: 'rose', items: ['Action Plan Status (AAPIS)', 'Compliance to Recommendations (IAsCARes)', 'Internal Audit Follow-up Report (IAFR)', 'Completion Assessment Report (ComARe)'] }
};

const THEMES = {
    indigo: { ring: 'ring-indigo-500', hoverBorder: 'hover:border-indigo-500', bgMain: 'bg-indigo-600', textMain: 'text-indigo-600', bgLight: 'bg-indigo-50', bgHover: 'hover:bg-indigo-50', borderLight: 'border-indigo-100', textLight: 'text-indigo-400', borderDash: 'border-indigo-300', dashHover: 'hover:border-indigo-400' },
    emerald: { ring: 'ring-emerald-500', hoverBorder: 'hover:border-emerald-500', bgMain: 'bg-emerald-600', textMain: 'text-emerald-600', bgLight: 'bg-emerald-50', bgHover: 'hover:bg-emerald-50', borderLight: 'border-emerald-100', textLight: 'text-emerald-400', borderDash: 'border-emerald-300', dashHover: 'hover:border-emerald-500' },
    amber: { ring: 'ring-amber-500', hoverBorder: 'hover:border-amber-500', bgMain: 'bg-amber-600', textMain: 'text-amber-600', bgLight: 'bg-amber-50', bgHover: 'hover:bg-amber-50', borderLight: 'border-amber-100', textLight: 'text-amber-400', borderDash: 'border-amber-300', dashHover: 'hover:border-amber-400' },
    rose: { ring: 'ring-rose-500', hoverBorder: 'hover:border-rose-500', bgMain: 'bg-rose-600', textMain: 'text-rose-600', bgLight: 'bg-rose-50', bgHover: 'hover:bg-rose-50', borderLight: 'border-rose-100', textLight: 'text-rose-400', borderDash: 'border-rose-300', dashHover: 'hover:border-rose-400' }
};

function DocumentItem({ doc, phaseKey, themeColor, engagementId, documents, onRefresh }) {
    const [expanded, setExpanded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const theme = THEMES[themeColor];

    const relatedDocs = documents.filter(d => d.phase === phaseKey && d.document_type === doc);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !engagementId) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('engagement_id', engagementId);
        formData.append('document_type', doc);
        formData.append('phase', phaseKey);
        try {
            await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onRefresh();
        } catch (err) { alert('Upload failed: ' + (err.response?.data?.message || err.message)); } 
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleSign = async (docId) => {
        try { await api.post(`/documents/${docId}/sign`); onRefresh(); } 
        catch (err) { alert('Sign failed: ' + err.message); }
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
                    <span className="text-sm font-bold text-slate-800">{doc}</span>
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

                    {(doc === 'Audit Notification Memorandum (ANM)' || doc === 'Audit Work Program (AWP)') && (
                        <div className={`mt-4 mb-2 p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-between`}>
                            <div>
                                <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2"><FileCode2 className="w-4 h-4"/> Dynamic Template Available</h4>
                                <p className="text-[10px] text-blue-600 font-bold mt-1">Automatically generate this document filled with the specific details from this audit engagement.</p>
                            </div>
                            <Link to={`/auditor/workspace/${engagementId}/generate/${doc === 'Audit Notification Memorandum (ANM)' ? 'anm' : 'awp'}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-colors shrink-0">
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
    const [engagement, setEngagement] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [activeTab, setActiveTab] = useState('tools'); // 'tools' or 'movs'
    const [selectedPhase, setSelectedPhase] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkspaceData();
    }, [id]);

    const fetchWorkspaceData = async () => {
        setLoading(true);
        try {
            const [engRes, docRes] = await Promise.all([
                api.get(`/engagements`),
                api.get(`/engagements/${id}/documents`)
            ]);
            // Find specific engagement from list
            const current = engRes.data.find(e => e.id.toString() === id.toString());
            setEngagement(current || null);
            setDocuments(docRes.data);
        } catch (err) {
            console.error('Failed to load workspace', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMovAction = async (movId, status) => {
        try {
            await api.patch(`/movs/${movId}/status`, { status });
            fetchWorkspaceData();
        } catch (err) {
            alert('Action failed: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400">Loading Workspace...</div>;
    if (!engagement) return <div className="p-10 text-center font-bold text-rose-500">Engagement not found.</div>;

    const PhaseCard = ({ phaseId, label, iconTheme }) => {
        const isSelected = selectedPhase === phaseId;
        const theme = THEMES[iconTheme];
        return (
            <div onClick={() => setSelectedPhase(phaseId)} className={`group bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all duration-300 flex flex-col items-center text-center cursor-pointer ${isSelected ? `ring-4 ${theme.ring} shadow-xl scale-105` : `hover:shadow-xl ${theme.hoverBorder}`}`}>
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-inner ${isSelected ? `${theme.bgMain} text-white` : `${theme.bgLight} ${theme.textMain} group-hover:${theme.bgMain} group-hover:text-white`}`}>
                    <Folder className="h-10 w-10" />
                </div>
                <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{label}</h3>
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
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
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

                            {selectedPhase && DOCUMENTS[selectedPhase] && (
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                                        <Folder className="h-5 w-5 text-slate-400" />
                                        <h2 className="text-sm font-black text-slate-600 uppercase tracking-widest">{DOCUMENTS[selectedPhase].title}</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                                            {DOCUMENTS[selectedPhase].items.map((doc, idx) => (
                                                <DocumentItem key={idx} doc={doc} engagementId={engagement.id} documents={documents} onRefresh={fetchWorkspaceData} phaseKey={selectedPhase} themeColor={DOCUMENTS[selectedPhase].theme} />
                                            ))}
                                        </div>
                                    </div>
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

                </div>
            </div>
        </div>
    );
}
