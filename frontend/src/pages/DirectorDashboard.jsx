import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Users, CheckCircle, XCircle, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

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
            const [usersRes, engRes] = await Promise.all([
                api.get('/users/pending'),
                api.get('/engagements')
            ]);
            
            setPendingUsers(usersRes.data);

            const engagements = engRes.data;
            let mCount = 0;
            let mSub = 0;
            engagements.forEach(eng => {
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

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
            <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 shadow-xl z-20 shrink-0">
                <div className="mb-8">
                    <img src="/IAMS logo.png" className="w-12 h-12 object-contain drop-shadow-sm" alt="IAMS Logo" />
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

                    </div>
                </div>
            </main>
        </div>
    );
}
