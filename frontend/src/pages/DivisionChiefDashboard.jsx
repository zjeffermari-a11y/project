import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Plus, X, FileText, CheckCircle, RotateCcw, LayoutGrid, Database, Users, ShieldCheck, XCircle, Trash2, Bell, AlertCircle, Clock, ArrowRightLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import iamsLogo from '../assets/IAMS logo.png';

export default function DivisionChiefDashboard() {
    const [engagements, setEngagements] = useState([]);
    const [auditees, setAuditees] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    
    // Form State for new audit
    const [formData, setFormData] = useState({ title: '', description: '', start_date: '', end_date: '', requirement_name: '', auditee_id: '' });
    const [doNumber, setDoNumber] = useState('');
    const [newOffice, setNewOffice] = useState('');
    const [offices, setOffices] = useState([]);
    const [newLeadAuditor, setNewLeadAuditor] = useState('');
    const [leadAuditors, setLeadAuditors] = useState([]);
    const [newMember, setNewMember] = useState('');
    const [members, setMembers] = useState([]);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [engRes, audRes, pendingRes] = await Promise.all([
                api.get('/engagements'),
                api.get('/auditees'),
                api.get('/users/pending')
            ]);
            setEngagements(engRes.data);
            setAuditees(audRes.data);
            setPendingUsers(pendingRes.data);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try { await api.post('/logout'); } catch (e) { }
        localStorage.clear();
        navigate('/login');
    };

    const handleApproval = async (id, status) => {
        try {
            await api.patch(`/users/${id}/approve`, { status });
            fetchData();
        } catch (err) {
            alert('Failed to update user status');
        }
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

    // Computations
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

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
            <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 shadow-xl z-20 shrink-0">
                <div className="mb-8">
                    <img src={iamsLogo} className="w-12 h-12 object-contain drop-shadow-sm" alt="IAMS Logo" />
                </div>
                <img src={`https://ui-avatars.com/api/?name=${user.name}&background=3b82f6&color=fff`} className="w-10 h-10 rounded-xl mb-4 border border-slate-700" title={user.name} alt="Profile" />
                <nav className="flex-1 flex flex-col gap-4 mt-4 w-full px-4">
                    <a href="#" className="p-3 text-white bg-slate-800 rounded-xl flex justify-center relative group" title="Home">
                        <LayoutGrid className="w-5 h-5" />
                    </a>
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
                                <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-blue-200">Division Chief Operations</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Welcome, {user.name}</h1>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">System Administration & Audits</h2>
                        </div>
                        <div className="text-right flex items-center justify-end gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 outline-none rounded-full transition-colors relative border border-blue-100 cursor-pointer">
                                        <Bell className="w-5 h-5" />
                                        {pendingReview > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full animate-ping"></span>}
                                        {pendingReview > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80 rounded-2xl shadow-2xl border-slate-100 p-0 text-left bg-white font-sans overflow-hidden z-[100]">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
                                        <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">Tasks & Deadlines</h3>
                                        <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-1 rounded-lg">{pendingReview} Pending</span>
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
                            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-xs shadow-md">
                                + Audit Engagement
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 py-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        


                        {/* Approvals Table (DIRECTOR POWER) */}
                        <div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                Account Registration Approvals
                            </h2>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                {loading ? (
                                    <div className="p-10 flex justify-center text-slate-400 font-bold">Loading...</div>
                                ) : pendingUsers.length === 0 ? (
                                    <div className="p-10 flex flex-col items-center justify-center text-slate-400">
                                        <CheckCircle className="w-10 h-10 mb-4 text-emerald-400 opacity-50" />
                                        <p className="text-sm font-black uppercase tracking-widest text-slate-500">All caught up</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                                                <th className="pb-4 pt-4 pl-8 font-black">User Details</th>
                                                <th className="pb-4 pt-4 font-black">Designation</th>
                                                <th className="pb-4 pt-4 font-black">Agency / Office</th>
                                                <th className="pb-4 pt-4 font-black text-right pr-8">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {pendingUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-5 pl-8 text-sm font-black text-slate-800">
                                                        {u.name} <span className="block text-xs font-bold text-slate-500 mt-0.5">{u.email}</span>
                                                    </td>
                                                    <td className="p-5"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-200">{u.designation.replace('_', ' ')}</span></td>
                                                    <td className="p-5 text-xs font-bold text-slate-600">{u.agency_name}</td>
                                                    <td className="p-5 pr-8 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => handleApproval(u.id, 'rejected')} className="px-3 py-1 text-xs font-black uppercase text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200">Reject</button>
                                                            <button onClick={() => handleApproval(u.id, 'approved')} className="px-3 py-1 text-xs font-black uppercase text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm">Approve</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Ongoing Audits (AUDITOR POWER) */}
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
                                {loading ? (
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
                                                <th className="pb-4 pt-4 font-black">Tasks & Deadlines</th>
                                                <th className="pb-4 pt-4 font-black">Compliance</th>
                                                <th className="pb-4 pt-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredEngagements.map(eng => {
                                                const engMovs = eng.movs || [];
                                                const total = engMovs.length;
                                                const sub = engMovs.filter(m => m.status === 'submitted' || m.status === 'approved').length;
                                                const pendingTaskCount = engMovs.filter(m => m.status === 'submitted').length;

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
                                                        <td className="p-5">
                                                            {pendingTaskCount > 0 ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                                    <Bell className="w-3.5 h-3.5" /> {pendingTaskCount} Docs to Review
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                                    All clear
                                                                </span>
                                                            )}
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

                {/* Registration Modal Copy Setup (Inherited from Auditor powers) */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden my-8 border border-slate-200">
                            {/* Same Modal contents as Auditor Dashboard */}
                            <div className="px-10 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div><h1 className="text-2xl font-black text-slate-800">+ Audit Engagement</h1></div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 border border-slate-200 rounded-xl"><X className="w-5 h-5"/></button>
                            </div>
                            <form onSubmit={handleSubmitAudit} className="bg-white">
                                <div className="p-8 border-b border-slate-100 flex flex-col gap-4">
                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Engagement Title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" />
                                    <textarea required rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Directive Objective/Description..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 resize-none"></textarea>
                                    <div className="flex gap-4">
                                        <input required type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" />
                                        <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" />
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-sm text-slate-500">Cancel</button>
                                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700">Register</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
