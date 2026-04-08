import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Plus, X, FileText, CheckCircle, RotateCcw, ChevronRight, LayoutGrid, Folder, Database, BarChart3, Trash2, Bell, Clock, ArrowRightLeft, Search, ChevronDown, Check, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import iamsLogo from '../assets/IAMS logo.png';
import PageTransition from '../components/ui/PageTransition';
import LogoutOverlay from '../components/ui/LogoutOverlay';
import { motion } from 'framer-motion';
import { useDataContext } from '../context/DataContext';

export default function AuditorDashboard() {
    const { 
        engagements, 
        auditees, 
        availableAuditors, 
        initialLoad, 
        refreshData 
    } = useDataContext();

    const [filter, setFilter] = useState('all');
    const [selectedEngagement, setSelectedEngagement] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isActiveAuditsModalOpen, setIsActiveAuditsModalOpen] = useState(false);
    const [activeAuditSearch, setActiveAuditSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};

    useEffect(() => {
        document.title = 'Internal Audit Management | Auditor Portal';
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try { await api.post('/logout'); } catch (e) { }
        
        // Premium artificial delay for animation
        setTimeout(() => {
            localStorage.clear();
            navigate('/login');
        }, 1200);
    };

    const handleMovAction = async (movId, status) => {
        try {
            await api.patch(`/movs/${movId}/status`, { status });
            refreshData();
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
                refreshData();
            } catch (err) {
                alert('Deletion failed: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleEngagementStatusUpdate = async (id, status) => {
        try {
            await api.put(`/engagements/${id}`, { status });
            refreshData();
        } catch (err) {
            alert('Failed to update engagement status: ' + (err.response?.data?.message || err.message));
        }
    };

    // Computations based on data
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

    const allActivities = [];
    engagements.forEach(eng => {
        if (eng.created_at) {
            allActivities.push({ id: `eng-${eng.id}`, type: 'engagement', title: eng.title, action: 'Created', user: 'System', date: new Date(eng.created_at) });
        }
        if (eng.movs) {
            eng.movs.forEach(mov => {
                if (mov.updated_at && mov.status !== 'pending') {
                    allActivities.push({ id: `mov-${mov.id}`, type: 'mov', title: `MOV: ${mov.requirement_name}`, action: mov.status === 'approved' ? 'Approved' : mov.status === 'returned' ? 'Returned' : 'Updated', user: mov.auditee?.name || 'User', date: new Date(mov.updated_at) });
                }
            });
        }
        if (eng.documents) {
            eng.documents.forEach(doc => {
                if (doc.created_at) {
                    allActivities.push({ id: `doc-${doc.id}`, type: 'document', title: doc.name, action: 'Uploaded', user: doc.uploader?.name || 'Unknown', date: new Date(doc.created_at) });
                }
            });
        }
    });

    allActivities.sort((a, b) => b.date - a.date);
    const recentActivities = allActivities.slice(0, 5);

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
        <PageTransition className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans relative">
            <LogoutOverlay isOpen={isLoggingOut} userName={user?.name} />
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
                                                You have <span className="font-bold text-rose-500">{pendingReview} document(s)</span> awaiting your review across your engagements. Please check the Masterfile.
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
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Masterfile View</h3>
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
                                <div onClick={() => setIsActiveAuditsModalOpen(true)} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group border border-slate-200">
                                    <div className="absolute top-6 right-6 p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                        <Clock className="h-8 w-8 text-blue-200" strokeWidth="2" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Active Audits</p>
                                    <div className="flex items-baseline gap-2 mb-6">
                                        <span className="text-5xl font-black text-blue-600 tracking-tight">{totalOngoing}</span>
                                        <span className="text-sm font-bold text-slate-400 ml-2">Audits</span>
                                    </div>
                                    <p className="text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">View Active <ChevronRight className="w-4 h-4" /></p>
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
                                    Masterfile Directory
                                    {filter !== 'all' && (
                                        <span className="ml-3 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Filtered</span>
                                    )}
                                </h2>

                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    {initialLoad ? (
                                        <div className="p-16 flex justify-center text-slate-400 font-bold italic animate-pulse uppercase tracking-[0.2em] text-xs">Syncing workspace...</div>
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
                                                                <div className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                                                        eng.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                                        eng.status === 'follow_up' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                                        eng.status === 'reporting' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                                                        eng.status === 'execution' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                        'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                                    }`}>
                                                                    {(eng.status || 'planning').replace('_', ' ')}
                                                                </div>
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
                            
                            {/* Recent Activity Card */}
                            <div className="w-full xl:w-80 shrink-0">
                                 <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2 opacity-0 select-none">
                                     Spacer
                                 </h2>
                                 <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col h-full">
                                     <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-6 flex items-center gap-2 shrink-0">
                                         <Clock className="w-4 h-4" /> Recent Activity
                                     </h3>
                                     
                                     <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                         {recentActivities.map(act => (
                                             <div key={act.id} className="border-b border-indigo-800/50 pb-3 last:border-0 last:pb-0">
                                                 <p className="text-[10px] text-indigo-200 mb-1"><span className="font-bold text-white">{act.user}</span> {act.action.toLowerCase()}</p>
                                                 <p className="text-sm font-bold text-white truncate" title={act.title}>{act.title}</p>
                                                 <p className="text-[9px] text-indigo-400 font-medium mt-1 uppercase tracking-widest">{act.date.toLocaleString()}</p>
                                             </div>
                                         ))}
                                         {recentActivities.length === 0 && (
                                             <div className="text-center text-indigo-300 text-xs py-4">No recent activity</div>
                                         )}
                                     </div>

                                     <button onClick={() => setIsHistoryModalOpen(true)} className="w-full mt-6 py-3 px-4 border border-indigo-500 hover:bg-indigo-800 text-indigo-100 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-colors shrink-0">
                                         View Full History
                                     </button>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Active Audits Focus View (High-Fidelity Modal) */}
                {isActiveAuditsModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/50 animate-in zoom-in-95 duration-300">
                            {/* Modal Header */}
                            <div className="px-12 py-8 border-b border-slate-100 bg-white shrink-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <nav className="flex text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 gap-2">
                                            <span>Auditor Operations</span> <span className="text-slate-300">/</span>
                                            <span className="text-indigo-600">Active Status</span>
                                        </nav>
                                        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                                            Ongoing Audits
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                                                {engagements.filter(e => e.status !== 'completed' && e.status !== 'follow_up').length} Active
                                            </span>
                                        </h1>
                                    </div>
                                    <button
                                        onClick={() => { setIsActiveAuditsModalOpen(false); setActiveAuditSearch(''); setActiveTab('all'); }}
                                        className="text-slate-400 hover:text-rose-500 transition-all bg-white hover:bg-rose-50 p-2.5 rounded-2xl border border-slate-200"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Tabs Row */}
                                <div className="flex gap-2 mb-8">
                                    {['all', 'planning', 'execution', 'reporting', 'follow_up'].map(tab => {
                                        const count = tab === 'all' 
                                            ? engagements.filter(e => e.status !== 'completed' && e.status !== 'follow_up').length
                                            : engagements.filter(e => e.status === tab).length;
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                    activeTab === tab 
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                {tab.replace('_', '-')} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Search Bar & Actions */}
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search by title, AE number, or lead..."
                                            value={activeAuditSearch}
                                            onChange={(e) => setActiveAuditSearch(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-400 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                    <button className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                                        Sort: Newest <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <button className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                                        Filter <ChevronDown className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-slate-50/50 p-12">
                                <div className="max-w-6xl mx-auto space-y-8">
                                    {engagements.filter(e => {
                                        const ongoingOnly = e.status !== 'completed' && e.status !== 'follow_up';
                                        if (!ongoingOnly) return false;
                                        if (activeTab !== 'all' && e.status !== activeTab) return false;
                                        
                                        if (!activeAuditSearch) return true;
                                        const term = activeAuditSearch.toLowerCase();
                                        return (
                                            e.title?.toLowerCase().includes(term) ||
                                            e.description?.toLowerCase().includes(term) ||
                                            e.ae_number?.toLowerCase().includes(term) ||
                                            e.auditee?.agency_name?.toLowerCase().includes(term) ||
                                            e.lead_auditor?.name?.toLowerCase().includes(term)
                                        );
                                    }).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                <Database className="w-10 h-10 opacity-20" />
                                            </div>
                                            <p className="font-black uppercase tracking-widest text-[11px] mb-2">No Matching Engagements</p>
                                            <p className="text-xs font-medium text-slate-400">Try adjusting your filters or search term</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-6">
                                            {engagements.filter(e => {
                                                const ongoingOnly = e.status !== 'completed' && e.status !== 'follow_up';
                                                if (!ongoingOnly) return false;
                                                if (activeTab !== 'all' && e.status !== activeTab) return false;
                                                
                                                if (!activeAuditSearch) return true;
                                                const term = activeAuditSearch.toLowerCase();
                                                return (
                                                    e.title?.toLowerCase().includes(term) ||
                                                    e.description?.toLowerCase().includes(term) ||
                                                    e.ae_number?.toLowerCase().includes(term) ||
                                                    e.auditee?.agency_name?.toLowerCase().includes(term) ||
                                                    e.lead_auditor?.name?.toLowerCase().includes(term)
                                                );
                                            }).map(eng => {
                                                const engMovs = eng.movs || [];
                                                const endDate = eng.end_date ? new Date(eng.end_date) : null;
                                                const diffTime = endDate ? endDate - new Date() : 0;
                                                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                
                                                // Urgency Logic
                                                let urgencyColor = 'bg-slate-100 text-slate-600';
                                                let urgencyText = 'Low urgency';
                                                if (daysRemaining < 3) {
                                                    urgencyColor = 'bg-rose-50 text-rose-600 border border-rose-100';
                                                    urgencyText = 'Critical urgency';
                                                } else if (daysRemaining < 7) {
                                                    urgencyColor = 'bg-amber-50 text-amber-600 border border-amber-100';
                                                    urgencyText = 'High urgency';
                                                }

                                                const stages = ['planning', 'execution', 'reporting', 'follow_up'];
                                                const currentStageIndex = stages.indexOf(eng.status || 'planning');

                                                return (
                                                    <div
                                                        key={eng.id}
                                                        className="bg-white rounded-[2rem] p-8 border border-slate-200 transition-all shadow-sm hover:shadow-xl group relative overflow-hidden"
                                                    >
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="space-y-1">
                                                                <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">{eng.title}</h3>
                                                                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                    <span>{eng.ae_number || 'DO-2026-XXX'}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                    <span>{eng.auditee?.agency_name || 'xxx'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${urgencyColor}`}>
                                                                    {urgencyText}
                                                                </span>
                                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-100`}>
                                                                    {eng.status || 'PLANNING'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-8">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                                {eng.start_date} - {eng.end_date}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 lowercase">
                                                                • {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Timeline ended'}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-12 mb-10">
                                                            <div className="space-y-2">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Engagement Lead</p>
                                                                <p className="text-xs font-black text-slate-700 italic">{eng.lead_auditor?.name || 'Unassigned'}</p>
                                                            </div>
                                                            <div className="space-y-2 border-l border-slate-100 pl-12">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Uploaded MOVs</p>
                                                                <p className="text-xs font-black text-slate-700">{engMovs.length} Files</p>
                                                            </div>
                                                            <div className="space-y-2 border-l border-slate-100 pl-12">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Created</p>
                                                                <p className="text-xs font-black text-slate-700">{new Date(eng.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>

                                                        <div className="mb-10">
                                                            <div className="flex justify-between items-end mb-4">
                                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Audit cycle progress</p>
                                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                                    {Math.min(100, Math.round(((currentStageIndex + 1) / 4) * 100))}% — {(eng.status || 'Planning').replace('_', ' ')} phase
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-1.5">
                                                                {stages.map((stage, idx) => (
                                                                    <div key={stage} className="flex-1 flex flex-col gap-3">
                                                                        <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                                                            idx <= currentStageIndex ? 'bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-slate-100'
                                                                        }`}></div>
                                                                        <p className={`text-[9px] font-black uppercase tracking-widest ${
                                                                            idx <= currentStageIndex ? 'text-indigo-600' : 'text-slate-300'
                                                                        }`}>
                                                                            {stage.replace('_', '-')}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                                                            <div className="flex gap-3">
                                                                <button 
                                                                    onClick={() => navigate('/auditor/workspace/' + eng.id)}
                                                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-200"
                                                                >
                                                                    Open audit <ArrowUpRight className="w-3 h-3" />
                                                                </button>
                                                                <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:cursor-not-allowed opacity-50">
                                                                    Assign lead
                                                                </button>
                                                                <button 
                                                                    onClick={() => navigate('/auditor/workspace/' + eng.id)}
                                                                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all"
                                                                >
                                                                    Upload MOVs
                                                                </button>
                                                            </div>
                                                            <button className="p-2.5 text-slate-300 hover:text-slate-600 transition-colors">
                                                                <MoreHorizontal className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full History Modal */}
                {isHistoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden my-8 border border-slate-200">
                            <div className="px-10 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <nav className="flex text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 gap-2">
                                        <span>Auditor Portal</span> <span>/</span>
                                        <span className="text-indigo-600">System Logs</span>
                                    </nav>
                                    <h1 className="text-2xl font-black text-slate-800">System Audit Trail</h1>
                                </div>
                                <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-10 max-h-[60vh] overflow-y-auto w-full">
                                <div className="space-y-6">
                                    {allActivities.map(act => (
                                        <div key={act.id} className="flex gap-4 items-start border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${act.type === 'document' ? 'bg-indigo-100 text-indigo-600' : act.type === 'mov' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {act.type === 'document' ? <FileText className="w-5 h-5" /> : act.type === 'mov' ? <CheckCircle className="w-5 h-5"/> : <Database className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-500"><span className="font-bold text-slate-800">{act.user}</span> {act.action.toLowerCase()} {act.type === 'document' ? 'file' : act.type === 'mov' ? 'MOV' : 'engagement'}</p>
                                                <p className="text-base font-black text-slate-800 mt-1">{act.title}</p>
                                                <p className="text-xs font-bold text-slate-400 mt-2">{act.date.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {allActivities.length === 0 && (
                                        <div className="text-center text-slate-400 p-8 font-bold">No activity recorded yet in the system.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Area Ends Here */}
            </main>
        </PageTransition>
    );
}
