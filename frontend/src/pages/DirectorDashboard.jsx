import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Users, CheckCircle, XCircle, TrendingUp, Filter, Trash2, Plus, X, BarChart3, Database, FileText, ChevronRight, Clock, ArrowRightLeft } from 'lucide-react';
import iamsLogo from '../assets/IAMS logo.png';

export default function DirectorDashboard() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [stats, setStats] = useState({ totalEngagements: 0, totalMovs: 0, complianceRate: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, engRes, audRes] = await Promise.all([
                api.get('/users/pending'),
                api.get('/engagements'),
                api.get('/auditees')
            ]);
            
            setPendingUsers(usersRes.data);
            setEngagements(engRes.data);
            setAuditees(audRes.data);

            const engagementsData = engRes.data;
            let mCount = 0;
            let mSub = 0;
            engagementsData.forEach(eng => {
                if (eng.movs) {
                    eng.movs.forEach(m => {
                        mCount++;
                        if (m.status === 'approved' || m.status === 'submitted') mSub++;
                    });
                }
            });

            setStats({
                totalEngagements: engagements.length,
                totalMovs: mCount,
                complianceRate: mCount === 0 ? 0 : Math.round((mSub / mCount) * 100)
            });

        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (id, status) => {
        try {
            await api.patch(`/users/${id}/approve`, { status });
            fetchData();
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const handleLogout = async () => {
        try { await api.post('/logout'); } catch (e) { }
        localStorage.clear();
        navigate('/login');
    };

    const handleSubmitAudit = async (e) => {
        e.preventDefault();
        try {
            const combinedDescription = doNumber ? `DO Number: ${doNumber}\n${formData.description}` : formData.description;
            await api.post('/engagements', {
                title: formData.title,
                description: combinedDescription,
                start_date: formData.start_date,
                end_date: formData.end_date,
                offices: offices.map(o => o.id)
            });

            setIsModalOpen(false);
            setFormData({ title: '', description: '', start_date: '', end_date: '', requirement_name: '', auditee_id: '' });
            setDoNumber(''); setOffices([]); setLeadAuditors([]); setMembers([]);
            fetchData();
        } catch (err) {
            alert('Failed to register audit: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteEngagement = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to completely delete this audit engagement? This will permanently delete all related MOVs and Documents.")) {
            try {
                await api.delete(`/engagements/${id}`);
                fetchData();
            } catch (err) {
                alert('Deletion failed: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleEngagementStatusUpdate = async (id, status) => {
        try {
            await api.put(`/engagements/${id}`, { status });
            fetchData();
        } catch (err) {
            alert('Failed to update engagement status');
        }
    };

    const totalOngoing = engagements.filter(e => e.status !== 'completed' && e.status !== 'follow_up').length;
    const totalFollowUp = engagements.filter(e => e.status === 'follow_up').length;
    const totalCompleted = engagements.filter(e => e.status === 'completed').length;

    const filteredEngagements = engagements.filter(eng => {
        if (filter === 'ongoing') return eng.status !== 'completed' && eng.status !== 'follow_up';
        if (filter === 'follow_up') return eng.status === 'follow_up';
        if (filter === 'completed') return eng.status === 'completed';
        return true;
    });

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
            <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 shadow-xl z-20 shrink-0">
                <div className="mb-8">
                    <img src={iamsLogo} className="w-12 h-12 object-contain drop-shadow-sm" alt="IAMS Logo" />
                </div>
                <img src={`https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} className="w-10 h-10 rounded-xl mb-4 border border-slate-700" title="Profile" alt="Profile" />
                <nav className="flex-1 flex flex-col gap-4 mt-4">
                    <div className="p-3 text-white bg-slate-800 rounded-xl transition-all relative group cursor-pointer" title="KPI Overview">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </nav>
                <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all" title="Logout">
                    <LogOut className="w-5 h-5" />
                </button>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
                <header className="bg-white border-b border-slate-200 px-10 py-8 shrink-0 z-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-indigo-200">Director Portal</span>
                                <span className="text-xs font-bold text-slate-400">Executive Overview</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Welcome, {user.name}</h1>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">System Performance & KPIs</h2>
                        </div>
                        <div className="text-right flex items-center justify-end gap-4">
                            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-xs shadow-md">
                                + Audit Engagement
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 py-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-50 rounded-full opacity-50 pointer-events-none"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Total Active Audits</p>
                                <p className="text-5xl font-black text-slate-800 tracking-tight relative z-10">{stats.totalEngagements}</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 rounded-full opacity-50 pointer-events-none"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">System-Wide Compliance</p>
                                <p className="text-5xl font-black text-emerald-500 tracking-tight relative z-10">{stats.complianceRate}%</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-50 rounded-full opacity-50 pointer-events-none"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Tracked MOVs</p>
                                <p className="text-5xl font-black text-amber-500 tracking-tight relative z-10">{stats.totalMovs}</p>
                            </div>
                        </div>

                        {/* Approvals Queue */}
                        <div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                Pending Account Approvals
                            </h2>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                {loading ? (
                                    <div className="p-16 flex justify-center text-slate-400 font-bold">Loading...</div>
                                ) : pendingUsers.length === 0 ? (
                                    <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                                        <CheckCircle className="w-12 h-12 mb-4 text-emerald-400 opacity-50" />
                                        <p className="text-sm font-black uppercase tracking-widest text-slate-500">All caught up</p>
                                        <p className="text-xs mt-2">There are no pending account registrations requiring your approval.</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full text-left">
                                        <thead className="bg-slate-50">
                                            <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-200">
                                                <th className="pb-4 pt-4 pl-8 font-black">User Details</th>
                                                <th className="pb-4 pt-4 font-black">Designation</th>
                                                <th className="pb-4 pt-4 font-black">Agency / Office</th>
                                                <th className="pb-4 pt-4 font-black text-right pr-8">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {pendingUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-5 pl-8">
                                                        <div className="text-sm font-black text-slate-800">{u.name}</div>
                                                        <div className="text-xs font-bold text-slate-500 mt-0.5">{u.email}</div>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-200">
                                                            {u.designation.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-xs font-bold text-slate-600">
                                                        {u.agency_name}
                                                    </td>
                                                    <td className="p-5 pr-8 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleApproval(u.id, 'rejected')} className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200">
                                                                <XCircle className="w-4 h-4" /> Reject
                                                            </button>
                                                            <button onClick={() => handleApproval(u.id, 'approved')} className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-white bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 rounded-xl transition-colors shadow-sm shadow-emerald-200">
                                                                <CheckCircle className="w-4 h-4" /> Approve
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Ongoing Audits */}
                        <div className="mb-8 mt-12">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                Edit Audit Engagements
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div onClick={() => setFilter(filter === 'ongoing' ? 'all' : 'ongoing')} className={`bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${filter === 'ongoing' ? 'ring-2 ring-indigo-500 bg-indigo-50 border-transparent' : 'border border-slate-200'}`}>
                                    <div className="absolute top-6 right-6 p-3 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                                        <Clock className="h-8 w-8 text-indigo-200" strokeWidth="2" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Master File</p>
                                    <div className="flex items-baseline gap-2 mb-6">
                                        <span className="text-5xl font-black text-indigo-600 tracking-tight">{totalOngoing}</span>
                                        <span className="text-sm font-bold text-slate-400 ml-2">Audits</span>
                                    </div>
                                    <p className="text-xs font-bold text-indigo-600 flex items-center gap-1">View Active <ChevronRight className="w-4 h-4" /></p>
                                </div>

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

                        {/* Master File Directory */}
                        <div className="flex flex-col xl:flex-row gap-6 items-start">
                            <div className="flex-1 w-full min-w-0">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <Database className="w-5 h-5 text-indigo-500" />
                                    Ongoing Master File Directory
                                    {filter !== 'all' && (
                                        <span className="ml-3 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Filtered</span>
                                    )}
                                </h2>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                {loading && engagements.length === 0 ? (
                                    <div className="p-16 flex justify-center text-slate-400 font-bold">Loading engagements...</div>
                                ) : filteredEngagements.length === 0 ? (
                                    <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                                        <FileText className="w-12 h-12 mb-4 opacity-50" />
                                        <p className="text-sm font-black uppercase tracking-widest">No Active Engagements</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                                                <th className="pb-4 pt-4 pl-8 font-black">Engagement Title</th>
                                                <th className="pb-4 pt-4 font-black">Timeline</th>
                                                <th className="pb-4 pt-4 font-black">Status</th>
                                                <th className="pb-4 pt-4 font-black">Compliance</th>
                                                <th className="pb-4 pt-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredEngagements.map(eng => {
                                                const engMovs = eng.movs || [];
                                                const total = engMovs.length;
                                                const sub = engMovs.filter(m => m.status === 'submitted' || m.status === 'approved').length;

                                                return (
                                                    <tr key={eng.id} onClick={() => navigate('/auditor/workspace/' + eng.id)} className="hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                                                        <td className="p-5 pl-8">
                                                            <div className="text-sm font-black text-slate-800 tracking-tight">{eng.title}</div>
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
                                                        <td className="py-5 text-xs font-black text-slate-700 tracking-widest">
                                                            {total === 0 ? <span className="text-slate-400 italic">0 MOVs</span> : <><span className="text-emerald-600">{sub}</span> / {total}</>}
                                                        </td>
                                                        <td className="w-10 pr-6">
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
                                             <span className="text-sm font-black text-emerald-400">{stats.complianceRate}%</span>
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

                {/* Registration Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden my-8 border border-slate-200">
                            <div className="px-10 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <nav className="flex text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 gap-2">
                                        <span>Director Portal</span> <span>/</span>
                                        <span className="text-indigo-600">New Registration</span>
                                    </nav>
                                    <h1 className="text-2xl font-black text-slate-800">+ Audit Engagement</h1>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitAudit} className="bg-white rounded-3xl overflow-hidden border border-slate-200">
                                <div className="p-8 border-b border-slate-100 space-y-6">
                                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">1</span>
                                        General Information
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">DO Number <span className="text-red-500">*</span></label>
                                            <input required type="text" value={doNumber} onChange={e => setDoNumber(e.target.value)} placeholder="e.g. DO-2026-001" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">AE Number</label>
                                            <input type="text" value={doNumber ? doNumber.replace('DO', 'AE') : ''} readOnly className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">DO Title <span className="text-red-500">*</span></label>
                                            <input required type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Enter Directive Order Title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Engagement Title <span className="text-red-500">*</span></label>
                                            <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Enter Engagement Title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Auditee Offices <span className="text-red-500">*</span></label>
                                            <div className="flex gap-2 mb-3">
                                                <select 
                                                    value={newOffice} 
                                                    onChange={e => setNewOffice(e.target.value)} 
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="">Select office...</option>
                                                    {auditees.map(a => (
                                                        <option key={a.id} value={a.id}>{a.agency_name} ({a.name})</option>
                                                    ))}
                                                </select>
                                                <button type="button" onClick={() => { 
                                                    if (newOffice && !offices.some(o => o.id === parseInt(newOffice))) { 
                                                        const auditee = auditees.find(a => a.id === parseInt(newOffice));
                                                        setOffices([...offices, { id: auditee.id, name: auditee.agency_name }]); 
                                                        setNewOffice(''); 
                                                    } 
                                                }} className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition-all">+</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {offices.map((office, index) => (
                                                    <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-bold">
                                                        <span>{office.name}</span>
                                                        <button type="button" onClick={() => setOffices(offices.filter((_, i) => i !== index))} className="text-indigo-400 hover:text-indigo-600 font-bold">&times;</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Lead Auditor <span className="text-red-500">*</span></label>
                                            <div className="flex gap-2 mb-3">
                                                <input type="text" value={newLeadAuditor} onChange={e => setNewLeadAuditor(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newLeadAuditor) { setLeadAuditors([...leadAuditors, newLeadAuditor]); setNewLeadAuditor(''); } } }} placeholder="Add Lead Auditor..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                <button type="button" onClick={() => { if (newLeadAuditor) { setLeadAuditors([...leadAuditors, newLeadAuditor]); setNewLeadAuditor(''); } }} className="bg-indigo-600 text-white px-4 rounded-xl font-bold hover:bg-indigo-700 transition-all">+</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {leadAuditors.map((lead, index) => (
                                                    <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-bold">
                                                        <span>{lead}</span>
                                                        <button type="button" onClick={() => setLeadAuditors(leadAuditors.filter((_, i) => i !== index))} className="text-indigo-400 hover:text-indigo-600 font-bold">&times;</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Audit Team Members</label>
                                            <div className="flex gap-2 mb-3">
                                                <input type="text" value={newMember} onChange={e => setNewMember(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newMember) { setMembers([...members, newMember]); setNewMember(''); } } }} placeholder="Add member..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                <button type="button" onClick={() => { if (newMember) { setMembers([...members, newMember]); setNewMember(''); } }} className="bg-slate-800 text-white px-4 rounded-xl font-bold hover:bg-slate-900 transition-all">+</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {members.map((member, index) => (
                                                    <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold">
                                                        <span>{member}</span>
                                                        <button type="button" onClick={() => setMembers(members.filter((_, i) => i !== index))} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-b border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">DO Date <span className="text-red-500">*</span></label>
                                            <input required type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Planned Start Date</label>
                                            <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-white flex items-center justify-end gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-sm text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                                    <button type="submit" className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95">Register Audit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
