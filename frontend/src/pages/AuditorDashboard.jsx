import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Plus, X, FileText, CheckCircle, RotateCcw, ChevronRight, LayoutGrid, Folder, Database, BarChart3, Trash2, Bell, Clock, ArrowRightLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import iamsLogo from '../assets/IAMS logo.png';

export default function AuditorDashboard() {
    const [engagements, setEngagements] = useState([]);
    const [auditees, setAuditees] = useState([]);
    const [availableAuditors, setAvailableAuditors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedEngagement, setSelectedEngagement] = useState(null);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchEngagements();
        fetchAuditees();
        fetchAuditors();
    }, []);

    const fetchAuditors = async () => {
        try {
            const res = await api.get('/users/auditors');
            setAvailableAuditors(res.data);
        } catch (err) {
            console.error('Failed to load auditors', err);
        }
    };

    const fetchEngagements = async () => {
        try {
            const res = await api.get('/engagements');
            setEngagements(res.data);

            // Also extract unique auditees from engagement movs data as a fallback
            const auditeeMap = {};
            res.data.forEach(eng => {
                (eng.movs || []).forEach(mov => {
                    if (mov.auditee && !auditeeMap[mov.auditee.id]) {
                        auditeeMap[mov.auditee.id] = mov.auditee;
                    }
                });
            });
            const extracted = Object.values(auditeeMap);
            if (extracted.length > 0) {
                setAuditees(prev => prev.length > 0 ? prev : extracted);
            }

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchAuditees = async () => {
        try {
            const res = await api.get('/auditees');
            console.log('Auditees loaded:', res.data);
            setAuditees(res.data);
        } catch (err) {
            console.error('Failed to load auditees:', err);
            console.error('Response:', err.response?.status, err.response?.data);
        }
    };

    const handleLogout = async () => {
        try { await api.post('/logout'); } catch (e) { }
        localStorage.clear();
        navigate('/login');
    };
    const handleMovAction = async (movId, status) => {
        try {
            await api.patch(`/movs/${movId}/status`, { status });
            // Refresh data
            const res = await api.get('/engagements');
            setEngagements(res.data);
            // Update selected engagement with new data
            if (selectedEngagement) {
                const updated = res.data.find(e => e.id === selectedEngagement.id);
                if (updated) setSelectedEngagement(updated);
            }
        } catch (err) {
            alert('Action failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteEngagement = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to completely delete this audit engagement? This will permanently delete all related MOVs and Documents.")) {
            try {
                await api.delete(`/engagements/${id}`);
                if (selectedEngagement?.id === id) {
                    setSelectedEngagement(null);
                }
                fetchEngagements();
            } catch (err) {
                alert('Deletion failed: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleEngagementStatusUpdate = async (id, status) => {
        try {
            await api.put(`/engagements/${id}`, { status });
            fetchEngagements();
        } catch (err) {
            alert('Failed to update engagement status: ' + (err.response?.data?.message || err.message));
        }
    };

    // Computations based on data
    const totalEngagements = engagements.length;
    let auditeeSubmissions = 0;
    let pendingReview = 0;
    let totalMovs = 0;

    engagements.forEach(eng => {
        const movs = eng.movs || [];
        totalMovs += movs.length;
        movs.forEach(m => {
            if (m.status === 'submitted' || m.status === 'approved') auditeeSubmissions++;
            if (m.status === 'submitted') pendingReview++;
        });
    });

    const totalOngoing = engagements.filter(e => e.status !== 'completed' && e.status !== 'follow_up').length;
    const totalFollowUp = engagements.filter(e => e.status === 'follow_up').length;
    const totalCompleted = engagements.filter(e => e.status === 'completed').length;

    const overallCompliance = totalMovs === 0 ? 0 : Math.round((auditeeSubmissions / totalMovs) * 100);

    const filteredEngagements = engagements.filter(eng => {
        if (filter === 'ongoing') return eng.status !== 'completed' && eng.status !== 'follow_up';
        if (filter === 'follow_up') return eng.status === 'follow_up';
        if (filter === 'completed') return eng.status === 'completed';
        return true;
    });

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
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
            <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 shadow-xl z-20 shrink-0">
                <div className="mb-8">
                    <img src={iamsLogo} className="w-12 h-12 object-contain drop-shadow-sm" alt="IAMS Logo" />
                </div>

                <img src={`https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} className="w-10 h-10 rounded-xl mb-4 border border-slate-700" title={user.name} alt="Profile" />

                <nav className="flex-1 flex flex-col gap-4 mt-4 w-full px-4">
                    <a href="#" className="p-3 text-white bg-slate-800 rounded-xl flex justify-center relative group" title="Home">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    </a>
                </nav>

                <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all" title="Logout">
                    <LogOut className="w-5 h-5" />
                </button>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <header className="bg-indigo-900 px-10 pt-8 pb-6 shrink-0 z-10 relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-64 w-64 transform translate-x-16 -translate-y-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>

                    <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <h2 className="text-indigo-300 font-black uppercase tracking-widest text-xs mb-2">Welcome Back, Lead Auditor</h2>
                            <h1 className="text-4xl font-black uppercase tracking-tight mb-2">{user.name}</h1>
                            <p className="text-indigo-200 font-medium text-sm">Auditor Operations Center</p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-3 bg-indigo-800 text-indigo-300 hover:text-white outline-none rounded-full transition-colors relative cursor-pointer">
                                        <Bell className="w-5 h-5" />
                                        {pendingReview > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-indigo-900 rounded-full animate-ping"></span>}
                                        {pendingReview > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-indigo-900 rounded-full"></span>}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80 rounded-2xl shadow-2xl border-slate-100 p-0 text-left bg-white font-sans overflow-hidden z-[100]">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
                                        <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">Tasks & Deadlines</h3>
                                        <span className="bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2 py-1 rounded-lg">{pendingReview} Pending</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {pendingReview > 0 ? (
                                            <div className="p-4 text-sm text-slate-600 font-medium tracking-tight">
                                                You have <span className="font-bold text-rose-500">{pendingReview} document(s)</span> awaiting your review across your engagements. Please check the Master File.
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 font-bold text-xs tracking-tight">No pending tasks. You are all caught up!</div>
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 py-8">
                    <div className="max-w-7xl mx-auto">


                        {/* Core Operations (Only visible if engagements exist) */}
                        {engagements.length > 0 && (
                            <div className="mb-10">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <LayoutGrid className="w-4 h-4 text-indigo-500" />
                                    Core Operations
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <button className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left flex flex-col group">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <Database className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Master File View</h3>
                                        <p className="text-xs font-bold text-slate-400 leading-relaxed">A global, searchable database of all documents uploaded across the entire system, indicating who uploaded them.</p>
                                    </button>

                                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
                                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-100 rounded-full opacity-50 pointer-events-none"></div>
                                        <h3 className="text-sm font-black text-indigo-800 uppercase tracking-widest mb-2 relative z-10">Workspace Active</h3>
                                        <p className="text-xs font-bold text-indigo-500 leading-relaxed relative z-10">To access engagement-specific Working Papers (Tools) and MOV Trackers, please click on its respective row in the Ongoing Audits table below.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Audit Engagements Summary */}
                        <div className="mb-8 mt-12">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                Edit Audit Engagements
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Box 1 */}
                                <div onClick={() => setFilter(filter === 'ongoing' ? 'all' : 'ongoing')} className={`bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${filter === 'ongoing' ? 'ring-2 ring-blue-500 bg-blue-50 border-transparent' : 'border border-slate-200'}`}>
                                    <div className="absolute top-6 right-6 p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                        <Clock className="h-8 w-8 text-blue-200" strokeWidth="2" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Master File</p>
                                    <div className="flex items-baseline gap-2 mb-6">
                                        <span className="text-5xl font-black text-blue-600 tracking-tight">{totalOngoing}</span>
                                        <span className="text-sm font-bold text-slate-400 ml-2">Audits</span>
                                    </div>
                                    <p className="text-xs font-bold text-blue-600 flex items-center gap-1">View Active <ChevronRight className="w-4 h-4" /></p>
                                </div>

                                {/* Box 2 */}
                                <div onClick={() => setFilter(filter === 'follow_up' ? 'all' : 'follow_up')} className={`bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${filter === 'follow_up' ? 'ring-2 ring-amber-500 bg-amber-50 border-transparent' : 'border border-slate-200'}`}>
                                    <div className="absolute top-6 right-6 p-3 bg-amber-50 rounded-full group-hover:bg-amber-100 transition-colors">
                                        <ArrowRightLeft className="h-8 w-8 text-amber-200" strokeWidth="2" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Ongoing Follow-up</p>
                                    <div className="flex items-baseline gap-2 mb-6">
                                        <span className="text-5xl font-black text-amber-500 tracking-tight">{totalFollowUp < 10 && totalFollowUp > 0 ? `0${totalFollowUp}` : totalFollowUp}</span>
                                        <span className="text-sm font-bold text-slate-400 ml-2">Audits</span>
                                    </div>
                                    <p className="text-xs font-bold text-amber-500 flex items-center gap-1">Check Deadlines <ChevronRight className="w-4 h-4" /></p>
                                </div>

                                {/* Box 3 */}
                                <div onClick={() => setFilter(filter === 'completed' ? 'all' : 'completed')} className={`bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${filter === 'completed' ? 'ring-2 ring-emerald-500 bg-emerald-50 border-transparent' : 'border border-slate-200'}`}>
                                    <div className="absolute top-6 right-6 p-3 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors">
                                        <CheckCircle className="h-8 w-8 text-emerald-200" strokeWidth="2" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Completed</p>
                                    <div className="flex items-baseline gap-2 mb-6">
                                        <span className="text-5xl font-black text-emerald-600 tracking-tight">{totalCompleted}</span>
                                        <span className="text-sm font-bold text-slate-400 ml-2">Archived</span>
                                    </div>
                                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">View Archives <ChevronRight className="w-4 h-4" /></p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content: Engagements */}
                        <div className="flex flex-col xl:flex-row gap-6 items-start">
                            {/* Engagements Table */}
                            <div className="flex-1 w-full min-w-0">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    Master File Directory
                                    {filter !== 'all' && (
                                        <span className="ml-3 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Filtered</span>
                                    )}
                                </h2>

                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    {loading ? (
                                        <div className="p-16 flex justify-center text-slate-400 font-bold">Loading engagements...</div>
                                    ) : filteredEngagements.length === 0 ? (
                                        <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                                            <FileText className="w-12 h-12 mb-4 opacity-50" />
                                            <p className="text-sm font-black uppercase tracking-widest">No Active Engagements</p>
                                            <p className="text-xs text-slate-400 mt-2">Click "+ Audit Engagement" to create your first engagement.</p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full text-left">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-indigo-100">
                                                            <th className="pb-4 pl-8 font-black">Engagement Title</th>
                                                            <th className="pb-4 font-black">Timeline</th>
                                                            <th className="pb-4 font-black">Status</th>
                                                            <th className="pb-4 font-black">Tasks & Deadlines</th>
                                                            <th className="pb-4 font-black">Compliance</th>
                                                            <th className="pb-4" colSpan="2"></th>
                                                        </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredEngagements.map(eng => {
                                                    const engMovs = eng.movs || [];
                                                    const total = engMovs.length;
                                                    const sub = engMovs.filter(m => m.status === 'submitted' || m.status === 'approved').length;
                                                    const isSelected = selectedEngagement?.id === eng.id;

                                                    return (
                                                        <tr key={eng.id} onClick={() => navigate('/auditor/workspace/' + eng.id)} className={`hover:bg-indigo-50/50 transition-colors cursor-pointer group`}>
                                                            <td className="p-5">
                                                                <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{eng.title}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 mt-1 truncate max-w-xs">{eng.description || 'No description'}</div>
                                                            </td>
                                                            <td className="p-5 text-xs font-bold text-slate-600 whitespace-nowrap">
                                                                {eng.start_date || 'TBD'} → {eng.end_date || 'TBD'}
                                                            </td>
                                                            <td className="p-5">
                                                                <select
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => handleEngagementStatusUpdate(eng.id, e.target.value)}
                                                                    value={eng.status || 'planning'}
                                                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border outline-none cursor-pointer ${
                                                                        eng.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                                        eng.status === 'follow_up' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                                        eng.status === 'reporting' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                                                        eng.status === 'execution' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                        'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                                    }`}
                                                                >
                                                                    <option value="planning">Planning</option>
                                                                    <option value="execution">Execution</option>
                                                                    <option value="reporting">Reporting</option>
                                                                    <option value="follow_up">Follow Up</option>
                                                                    <option value="completed">Completed</option>
                                                                </select>
                                                            </td>
                                                            <td className="p-5">
                                                                {engMovs.filter(m => m.status === 'submitted').length > 0 ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                                        <Bell className="w-3.5 h-3.5" /> {engMovs.filter(m => m.status === 'submitted').length} Docs to Review
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                                        All clear
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-5 text-xs font-black text-slate-700 tracking-widest">
                                                                {engMovs.length === 0 ? (
                                                                    <span className="text-slate-400 italic font-bold">No MOVs</span>
                                                                ) : (
                                                                    <><span className="text-emerald-600">{sub}</span> / {total} MOVs</>
                                                                )}
                                                            </td>
                                                            <td className="w-10">
                                                                <button onClick={(e) => handleDeleteEngagement(e, eng.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2" title="Delete Audit">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                            
                            {/* Quick Overview Card */}
                            <div className="w-full xl:w-80 shrink-0">
                                 <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2 opacity-0 select-none">
                                     Spacer
                                 </h2>
                                 <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl">
                                     <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-6">Quick Overview</h3>
                                     
                                     <div className="space-y-4">
                                         <div className="flex justify-between items-center border-b border-indigo-800/50 pb-4">
                                             <span className="text-sm font-medium text-indigo-200">Last Audit:</span>
                                             <span className="text-sm font-bold text-white">{engagements.length > 0 ? engagements[0].start_date : 'N/A'}</span>
                                         </div>
                                         
                                         <div className="flex justify-between items-center border-b border-indigo-800/50 pb-4">
                                             <span className="text-sm font-medium text-indigo-200">Compliance Rate:</span>
                                             <span className="text-sm font-black text-emerald-400">{overallCompliance}%</span>
                                         </div>
                                     </div>

                                     <button onClick={() => engagements.length > 0 ? navigate(`/auditor/workspace/${engagements[0].id}`) : alert('Register an audit engagement first.')} className="w-full mt-6 py-3 px-4 border border-indigo-500 hover:bg-indigo-800 text-indigo-100 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-colors">
                                         View Full History
                                     </button>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area Ends Here */}
            </main>
        </div>
    );
}
