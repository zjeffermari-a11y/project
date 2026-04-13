import React, { useState, useEffect } from 'react';
import { LayoutGrid, FileText, AlertCircle, CheckCircle, Clock, RotateCcw, Folder, Bell, RefreshCw, ChevronRight } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Shared Components & Hooks
import { useAuditeeData } from '../hooks/useAuditeeData';
import { useDashboardActions } from '../hooks/useDashboardActions';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import StatCard from '../components/dashboard/StatCard';
import UploadMovModal from '../components/dashboard/UploadMovModal';

export default function AuditeeDashboard() {
    const { 
        engagements, 
        loading,
        initialLoad, 
        refreshData,
        updateMovStatusOptimistic
    } = useDataContext();

    const [activeTab, setActiveTab] = useState('overview'); // overview, ongoing, follow-up
    const [uploadConfig, setUploadConfig] = useState(null); // { id, engId, name }
    const [uploading, setUploading] = useState(false);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const auditeeData = useAuditeeData(engagements, user);
    const { isLoggingOut, handleLogout } = useDashboardActions(refreshData);

    const { 
        complianceRate, 
        ongoingAudits, 
        followUpAudits, 
        pendingTasks, 
        recentSubmissions 
    } = auditeeData;

    useEffect(() => {
        document.title = 'Internal Audit Management | Auditee Portal';
    }, []);

    // Set smart default tab
    useEffect(() => {
        if (!initialLoad && activeTab === 'overview' && pendingTasks.length > 0) {
            setActiveTab('ongoing');
        }
    }, [initialLoad, pendingTasks.length]);

    const handleUploadSubmit = async ({ movId, engId, movName, formData }) => {
        try {
            setUploading(true);
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            await updateMovStatusOptimistic(movId, 'submitted');
            setUploadConfig(null);
            refreshData();
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: true, onClick: () => {} }
    ];

    const getMovStatusStyle = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'submitted': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'returned': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (initialLoad && engagements.length === 0) {
        return (
            <div className="h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="flex flex-col items-center">
                        <h2 className="text-white font-black uppercase tracking-[0.4em] text-sm mb-2">Synchronizing Portal</h2>
                        <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Initializing Auditee Compliance Hub...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            isLoggingOut={isLoggingOut}
            userName={user?.name}
            sidebar={<DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />}
            header={
                <DashboardHeader 
                    user={user} 
                    roleLabel="Auditee Portal" 
                    title={`Welcome back, ${user?.name || ''}`}
                    subtitle={ongoingAudits.length > 0 ? `Engagement: ${ongoingAudits[0].eng.title}` : 'No Active Engagement'}
                    isInitialLoad={initialLoad}
                    isLoading={loading}
                    onRefresh={refreshData}
                    pendingTasksCount={pendingTasks.length}
                    actions={
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                            {['overview', 'ongoing', 'follow-up'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab.replace('-', ' ')} {tab !== 'overview' && `(${tab === 'ongoing' ? ongoingAudits.length : followUpAudits.length})`}
                                </button>
                            ))}
                        </div>
                    }
                />
            }
        >
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    label="MOV Compliance" 
                    value={`${complianceRate}%`} 
                    color="emerald"
                    progress={{ label: 'Submitted Items', value: `${auditeeData.submittedMovsCount} / ${auditeeData.totalMovs}` }}
                />
                <StatCard label="Ongoing Audits" value={ongoingAudits.length} color="indigo" />
                <StatCard label="Actions Required" value={pendingTasks.length} color="rose" />
                <StatCard label="Follow-up Monitoring" value={followUpAudits.length} color="amber" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Tab: Ongoing Audits */}
                    {activeTab === 'ongoing' && (
                        ongoingAudits.length > 0 ? (
                            <section className="space-y-6">
                                {ongoingAudits.map(({ eng, myMovs, approved, submitted, returned, pending }) => (
                                    <div key={eng.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-amber-200">Active Monitoring</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{eng.start_date || 'TBD'}</span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{eng.title}</h3>
                                            </div>
                                            <div className="flex gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
                                                <div className="text-center px-3 border-r border-slate-100"><p className="text-xs font-black text-emerald-600">{approved}</p><p className="text-[8px] font-black uppercase text-slate-400">Approved</p></div>
                                                <div className="text-center px-3 border-r border-slate-100"><p className="text-xs font-black text-amber-500">{submitted}</p><p className="text-[8px] font-black uppercase text-slate-400">Reviewing</p></div>
                                                <div className="text-center px-3"><p className="text-xs font-black text-rose-500">{returned}</p><p className="text-[8px] font-black uppercase text-slate-400">Returned</p></div>
                                            </div>
                                        </div>
                                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {myMovs.map(mov => (
                                                <div key={mov.id} className="group p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between gap-4">
                                                    <span className="text-xs font-bold text-slate-700 truncate">{mov.requirement_name}</span>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getMovStatusStyle(mov.status)}`}>
                                                            {mov.status === 'approved' ? 'Approved' : mov.status === 'submitted' ? 'Reviewing' : mov.status === 'returned' ? 'Action Required' : 'Pending'}
                                                        </span>
                                                        {(!mov.status || mov.status === 'pending' || mov.status === 'returned') && (
                                                            <button 
                                                                onClick={() => setUploadConfig({ id: mov.id, engId: eng.id, name: mov.requirement_name })}
                                                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all"
                                                            >
                                                                <Clock className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </section>
                        ) : (
                            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-slate-800 font-black uppercase">No Active Audits</h3>
                                <p className="text-sm font-medium text-slate-400 mt-2">Your office is currently clear of any ongoing audit requirements.</p>
                            </div>
                        )
                    )}

                    {/* Tab: Follow-up */}
                    {activeTab === 'follow-up' && (
                        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 bg-rose-50/50 border-b border-rose-100">
                                <h2 className="text-sm font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-rose-500" /> Historical Performance
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {followUpAudits.length === 0 ? (
                                    <div className="p-20 text-center text-slate-400 italic">No historical data available yet.</div>
                                ) : followUpAudits.map(({ eng, compRate, approved, total }) => (
                                    <div key={eng.id} className="p-8 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 tracking-tight">{eng.title}</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Concluded Phase: {eng.status.replace('_', ' ')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-emerald-600">{compRate}%</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{approved} / {total} Items</p>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${compRate}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Tab: Overview (Action Required & Recent activity grouped) */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Priority Checklist */}
                            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-indigo-500" /> Action Required
                                    </h2>
                                    <span className="bg-rose-100 text-rose-600 text-[9px] font-black px-2 py-1 rounded-lg">{pendingTasks.length} Pending</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {pendingTasks.length === 0 ? (
                                        <div className="p-20 text-center text-slate-400 italic">No pending actions. You're all caught up!</div>
                                    ) : pendingTasks.map((task, idx) => (
                                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-10 rounded-full ${task.urgent ? 'bg-rose-500 shadow-lg shadow-rose-200' : 'bg-slate-200'}`}></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{task.type} • Due: {task.due}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setUploadConfig({ id: task.id, engId: task.engId, name: task.title })}
                                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md"
                                            >
                                                Upload Now
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Recent Activity */}
                            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100">
                                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Recent Activity</h2>
                                </div>
                                <div className="divide-y divide-slate-100 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50">
                                            <tr className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                <th className="px-8 py-4">Requirement</th>
                                                <th className="px-8 py-4">Date</th>
                                                <th className="px-8 py-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentSubmissions.slice(0, 5).map((sub, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-4 text-xs font-bold text-slate-700">{sub.name}</td>
                                                    <td className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">{sub.date}</td>
                                                    <td className="px-8 py-4 text-right">
                                                        <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getMovStatusStyle(sub.status)}`}>
                                                            {sub.statusLabel}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Engagement Metadata</h4>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <Folder className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Office</p>
                                    <p className="text-xs font-black text-slate-800">{user.agency_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compliance Status</p>
                                    <p className="text-xs font-black text-emerald-600 uppercase">On Track</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <button 
                                onClick={() => navigate('/auditor/workspace/all')}
                                className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">View Masterfile</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-900 p-8 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <Bell className="w-8 h-8 text-indigo-300 mb-4" />
                            <h4 className="font-black text-lg tracking-tight mb-2">Need Assistance?</h4>
                            <p className="text-xs font-medium text-indigo-200 leading-relaxed mb-6">Contact the Technical Audit Division for clarification on requirement items or submission deadlines.</p>
                            <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all">
                                Open Help Desk
                            </button>
                        </div>
                        <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-indigo-800 rounded-full opacity-50"></div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <UploadMovModal 
                isOpen={!!uploadConfig}
                onClose={() => setUploadConfig(null)}
                movId={uploadConfig?.id}
                engId={uploadConfig?.engId}
                movName={uploadConfig?.name}
                loading={uploading}
                onUpload={handleUploadSubmit}
            />
        </DashboardLayout>
    );
}
