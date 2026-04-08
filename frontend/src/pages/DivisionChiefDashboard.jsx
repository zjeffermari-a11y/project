import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Plus, X, FileText, CheckCircle, RotateCcw, LayoutGrid, Database, Users, ShieldCheck, XCircle, Trash2, Bell, AlertCircle, Clock, ArrowRightLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import iamsLogo from '../assets/IAMS logo.png';
import PageTransition from '../components/ui/PageTransition';
import LogoutOverlay from '../components/ui/LogoutOverlay';

export default function DivisionChiefDashboard() {
    const [engagements, setEngagements] = useState([]);
    const [auditees, setAuditees] = useState([]);
    const [availableAuditors, setAvailableAuditors] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Form State for new audit
    const [formData, setFormData] = useState({ title: '', description: '', start_date: '', end_date: '', requirement_name: '', auditee_id: '' });
    const [doNumber, setDoNumber] = useState('');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isActiveAuditsModalOpen, setIsActiveAuditsModalOpen] = useState(false);
    const [activeAuditSearch, setActiveAuditSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [newOffice, setNewOffice] = useState('');
    const [offices, setOffices] = useState([]);
    const [newLeadAuditor, setNewLeadAuditor] = useState('');
    const [leadAuditors, setLeadAuditors] = useState([]);
    const [newMember, setNewMember] = useState('');
    const [members, setMembers] = useState([]);
    const [isAssignLeadModalOpen, setIsAssignLeadModalOpen] = useState(false);
    const [targetEngagement, setTargetEngagement] = useState(null);
    const [selectedLeadsForAssign, setSelectedLeadsForAssign] = useState([]);

    const navigate = useNavigate();
    const masterfileRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user')) || {};

    useEffect(() => {
        document.title = user?.designation === 'assistant_division_chief' ? 'Internal Audit Management | Assistant Division Chief Portal' : 'Internal Audit Management | Division Chief Portal';
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [engRes, audRes, pendingRes, auditorsRes] = await Promise.all([
                api.get('/engagements'),
                api.get('/auditees'),
                api.get('/users/pending'),
                api.get('/users/auditors')
            ]);
            setEngagements(engRes.data);
            setAuditees(audRes.data);
            setPendingUsers(pendingRes.data);
            setAvailableAuditors(auditorsRes.data);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try { await api.post('/logout'); } catch (e) { }
        setTimeout(() => {
            localStorage.clear();
            navigate('/login');
        }, 1200);
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
            const combinedDescription = doNumber ? `DO Number: DO-${doNumber}\n${formData.description}` : formData.description;
            await api.post('/engagements', {
                title: formData.title,
                description: combinedDescription,
                start_date: formData.start_date,
                end_date: formData.end_date,
                offices: offices.map(o => o.id),
                leadAuditors: leadAuditors.map(l => l.id),
                members: members.map(m => m.id)
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

    const handleOpenAssignLead = (eng) => {
        setTargetEngagement(eng);
        // Pre-fill with current leads if any
        const currentLeads = (eng.users || []).filter(u => u.pivot.role_in_engagement === 'lead_auditor');
        setSelectedLeadsForAssign(currentLeads);
        setIsAssignLeadModalOpen(true);
    };

    const handleSaveLeadAssignment = async () => {
        if (!targetEngagement) return;
        try {
            await api.put(`/engagements/${targetEngagement.id}`, {
                leadAuditors: selectedLeadsForAssign.map(l => l.id)
            });
            setIsAssignLeadModalOpen(false);
            setTargetEngagement(null);
            setSelectedLeadsForAssign([]);
            fetchData();
        } catch (err) {
            alert('Failed to assign lead: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleOpenModal = () => {
        const currentYear = new Date().getFullYear();
        let maxSequence = 0;
        engagements.forEach(eng => {
            if (eng.description) {
                const match = eng.description.match(new RegExp(`DO-${currentYear}-(\\d+)`));
                if (match) {
                    const seq = parseInt(match[1], 10);
                    if (seq > maxSequence) maxSequence = seq;
                }
            }
        });
        const nextSequence = String(maxSequence + 1).padStart(3, '0');
        setDoNumber(`${currentYear}-${nextSequence}`);
        setIsModalOpen(true);
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
    const overallCompliance = totalEngagements === 0 ? 0 : Math.round((totalCompleted / totalEngagements) * 100);

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


    const filteredEngagements = engagements.filter(eng => {
        if (filter === 'ongoing') return eng.status !== 'completed' && eng.status !== 'follow_up';
        if (filter === 'follow_up') return eng.status === 'follow_up';
        if (filter === 'completed') return eng.status === 'completed';
        return true;
    });

    return (
        <PageTransition className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans relative">
            <LogoutOverlay isOpen={isLoggingOut} userName={user?.name} />
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
                                <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-blue-200">
                                    {user.designation === 'assistant_division_chief' ? 'Assistant ' : ''}Division Chief Operations
                                </span>
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
                                                You have <span className="font-bold text-rose-500">{pendingReview} document(s)</span> awaiting your review across your engagements. Please check the Masterfile.
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 font-bold text-xs tracking-tight">No pending tasks. You are all caught up!</div>
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <button onClick={handleOpenModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-xs shadow-md">
                                + Audit Engagement
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 py-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div
                                onClick={() => setIsActiveAuditsModalOpen(true)}
                                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden cursor-pointer hover:border-blue-300 transition-all group"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Total Active Audits</p>
                                <p className="text-4xl font-black text-slate-800 tracking-tight relative z-10">{totalOngoing}</p>
                                <div className="mt-4 flex items-center gap-1 text-blue-600 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                    View Active Engagements <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>

                            <div
                                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden transition-all group"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">System Compliance</p>
                                <div className="flex items-end gap-2 relative z-10">
                                    <p className="text-4xl font-black text-emerald-500 tracking-tight">{overallCompliance}%</p>
                                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Rate</p>
                                </div>
                                <div className="mt-4 flex items-center justify-between relative z-10">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Completed Audits</span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{totalCompleted} / {totalEngagements}</span>
                                </div>
                            </div>

                            <div
                                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden transition-all group"
                            >
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Tracked MOVs</p>
                                <div className="flex items-end gap-2 relative z-10">
                                    <p className="text-4xl font-black text-amber-500 tracking-tight">{totalMovs}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Files</p>
                                </div>
                                <div className="mt-4 flex items-center justify-between relative z-10">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">System Activity</span>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-amber-500" />
                                        <span className="text-[10px] font-bold text-amber-600">Dynamic Count</span>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setIsHistoryModalOpen(true)}
                                className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden cursor-pointer hover:bg-black transition-all group"
                            >
                                <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Audit Trail</p>
                                <p className="text-4xl font-black text-white tracking-tight relative z-10">{allActivities.length}</p>
                                <div className="mt-4 flex items-center gap-1 text-slate-300 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Logs <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </div>



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
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Active Audits</p>
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
                                <h2 ref={masterfileRef} className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2 scroll-mt-8">
                                    <Database className="w-5 h-5 text-indigo-500" />
                                    Masterfile Directory
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
                                                                <div className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${eng.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                                        eng.status === 'follow_up' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                                            eng.status === 'reporting' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                                                                eng.status === 'execution' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                                    'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                                    }`}>
                                                                    {(eng.status || 'planning').replace('_', ' ')}
                                                                </div>
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

                {/* Active Audits Focus View (Refined Modal) */}
                {isActiveAuditsModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/50 animate-in zoom-in-95 duration-300">
                            {/* Modal Header */}
                            <div className="px-12 py-8 border-b border-slate-100 bg-white shrink-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <nav className="flex text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 gap-2">
                                            <span>Division Chief Portal</span> <span className="text-slate-300">/</span>
                                            <span className="text-blue-600">Active Status</span>
                                        </nav>
                                        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                                            Ongoing Audits
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
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
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search by title, AE number, or lead..."
                                            value={activeAuditSearch}
                                            onChange={(e) => setActiveAuditSearch(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-blue-50/50 focus:border-blue-400 outline-none transition-all shadow-sm"
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
                                                                <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-blue-600 transition-colors uppercase italic">{eng.title}</h3>
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
                                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-100`}>
                                                                    {eng.status || 'PLANNING'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-8">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
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
                                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                                                    {Math.min(100, Math.round(((currentStageIndex + 1) / 4) * 100))}% — {(eng.status || 'Planning').replace('_', ' ')} phase
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-1.5">
                                                                {stages.map((stage, idx) => (
                                                                    <div key={stage} className="flex-1 flex flex-col gap-3">
                                                                        <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                                                            idx <= currentStageIndex ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : 'bg-slate-100'
                                                                        }`}></div>
                                                                        <p className={`text-[9px] font-black uppercase tracking-widest ${
                                                                            idx <= currentStageIndex ? 'text-blue-600' : 'text-slate-300'
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
                                                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-200"
                                                                >
                                                                    Open audit <Plus className="w-3 h-3" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleOpenAssignLead(eng)}
                                                                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all"
                                                                >
                                                                    Assign lead
                                                                </button>
                                                                <button 
                                                                    onClick={() => navigate('/auditor/workspace/' + eng.id)}
                                                                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all"
                                                                >
                                                                    Upload MOVs
                                                                </button>
                                                            </div>
                                                            <button className="p-2.5 text-slate-300 hover:text-slate-600 transition-colors">
                                                                <Plus className="w-5 h-5" />
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
                                        <span>{user?.designation === 'assistant_division_chief' ? 'Assistant Division Chief Portal' : 'Division Chief Portal'}</span> <span>/</span>
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
                                                {act.type === 'document' ? <FileText className="w-5 h-5" /> : act.type === 'mov' ? <CheckCircle className="w-5 h-5" /> : <Database className="w-5 h-5" />}
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


                {/* Registration Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden my-8 border border-slate-200">
                            <div className="px-10 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <nav className="flex text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 gap-2">
                                        <span>Division Chief Operations</span> <span>/</span>
                                        <span className="text-blue-600">New Registration</span>
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
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                                        General Information
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">DO Number <span className="text-red-500">*</span></label>
                                            <div className="relative flex items-center">
                                                <span className="absolute left-4 font-bold text-slate-500">DO-</span>
                                                <input required type="text" value={doNumber} readOnly className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-bold rounded-xl pl-12 pr-4 py-3 cursor-not-allowed outline-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">AE Number</label>
                                            <div className="relative flex items-center">
                                                <span className="absolute left-4 font-bold text-slate-500">AE-</span>
                                                <input type="text" value={doNumber} readOnly className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl pl-12 pr-4 py-3 cursor-not-allowed" />
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">DO Title <span className="text-red-500">*</span></label>
                                            <input required type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Enter Directive Order Title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Engagement Title <span className="text-red-500">*</span></label>
                                            <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Enter Engagement Title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Auditee Offices <span className="text-red-500">*</span></label>
                                            <div className="flex gap-2 mb-3">
                                                <select
                                                    value={newOffice}
                                                    onChange={e => setNewOffice(e.target.value)}
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
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
                                                }} className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-all">+</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {offices.map((office, index) => (
                                                    <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-bold">
                                                        <span>{office.name}</span>
                                                        <button type="button" onClick={() => setOffices(offices.filter((_, i) => i !== index))} className="text-blue-400 hover:text-blue-600 font-bold">&times;</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Lead Auditor <span className="text-red-500">*</span></label>
                                            <div className="flex gap-2 mb-3">
                                                <select
                                                    value={newLeadAuditor}
                                                    onChange={e => setNewLeadAuditor(e.target.value)}
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="">Select Lead Auditor...</option>
                                                    {availableAuditors.map(a => (
                                                        <option key={a.id} value={a.id}>{a.name} ({a.agency_name})</option>
                                                    ))}
                                                </select>
                                                <button type="button" onClick={() => {
                                                    if (newLeadAuditor && !leadAuditors.some(l => l.id === parseInt(newLeadAuditor))) {
                                                        const user = availableAuditors.find(a => a.id === parseInt(newLeadAuditor));
                                                        setLeadAuditors([...leadAuditors, { id: user.id, name: user.name }]);
                                                        setNewLeadAuditor('');
                                                    }
                                                }} className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition-all">+ Add</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {leadAuditors.map((lead, index) => (
                                                    <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-bold">
                                                        <span>{lead.name}</span>
                                                        <button type="button" onClick={() => setLeadAuditors(leadAuditors.filter((_, i) => i !== index))} className="text-blue-400 hover:text-blue-600 font-bold">&times;</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Audit Team Members</label>
                                            <div className="flex gap-2 mb-3">
                                                <select
                                                    value={newMember}
                                                    onChange={e => setNewMember(e.target.value)}
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="">Select Audit Team Member...</option>
                                                    {availableAuditors.map(a => (
                                                        <option key={a.id} value={a.id}>{a.name} ({a.agency_name})</option>
                                                    ))}
                                                </select>
                                                <button type="button" onClick={() => {
                                                    if (newMember && !members.some(m => m.id === parseInt(newMember))) {
                                                        const user = availableAuditors.find(a => a.id === parseInt(newMember));
                                                        setMembers([...members, { id: user.id, name: user.name }]);
                                                        setNewMember('');
                                                    }
                                                }} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-slate-900 transition-all">+ Add</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {members.map((member, index) => (
                                                    <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-bold">
                                                        <span>{member.name}</span>
                                                        <button type="button" onClick={() => setMembers(members.filter((_, i) => i !== index))} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-b border-slate-100 space-y-6">
                                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                                        Dates &amp; Timeline
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">DO Date <span className="text-red-500">*</span></label>
                                            <input required type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="flex items-end">
                                            <p className="text-xs text-slate-400 font-medium leading-relaxed">This date corresponds to the Directive Order issuance date. The engagement will become active immediately upon registration.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-white flex items-center justify-end gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-sm text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                                    <button type="submit" className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95">Register Audit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {isAssignLeadModalOpen && targetEngagement && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Assign Lead Auditor</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Audit: {targetEngagement.ae_number}</p>
                                </div>
                                <button onClick={() => setIsAssignLeadModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Select Lead Auditors</label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {availableAuditors.map(auditor => {
                                            const isSelected = selectedLeadsForAssign.some(l => l.id === auditor.id);
                                            return (
                                                <button
                                                    key={auditor.id}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedLeadsForAssign(selectedLeadsForAssign.filter(l => l.id !== auditor.id));
                                                        } else {
                                                            setSelectedLeadsForAssign([...selectedLeadsForAssign, auditor]);
                                                        }
                                                    }}
                                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                        isSelected 
                                                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10' 
                                                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <div className="text-left">
                                                        <p className={`text-sm font-black ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{auditor.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{auditor.agency_name}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-4">
                                <button 
                                    onClick={() => setIsAssignLeadModalOpen(false)}
                                    className="px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveLeadAssignment}
                                    className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-100"
                                >
                                    Save Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </PageTransition>
    );
}
