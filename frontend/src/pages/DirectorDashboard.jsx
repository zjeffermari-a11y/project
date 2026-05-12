import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Database, Clock, ArrowRightLeft, CheckCircle, FileText, Users, Plus, TrendingUp, ChevronRight, Shield, Heart, BarChart2 } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import api from '../api';

// Shared Components & Hooks
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardActions } from '../hooks/useDashboardActions';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import StatCard from '../components/dashboard/StatCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import EngagementTable from '../components/dashboard/EngagementTable';
import ActiveAuditsModal from '../components/dashboard/ActiveAuditsModal';
import HistoryModal from '../components/dashboard/HistoryModal';
import NewAuditModal from '../components/dashboard/NewAuditModal';
import SecuritySettingsModal from '../components/dashboard/SecuritySettingsModal';

export default function DirectorDashboard() {
    const navigate = useNavigate();
    const { 
        engagements, 
        auditees,
        availableAuditors,
        pendingUsers,
        loading,
        initialLoad, 
        refreshData,
        deleteEngagementOptimistic,
        approveUserOptimistic
    } = useDataContext();

    const [filter, setFilter] = useState('all');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isActiveAuditsModalOpen, setIsActiveAuditsModalOpen] = useState(false);
    const [isNewAuditModalOpen, setIsNewAuditModalOpen] = useState(false);
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { stats, recentActivities, getFilteredEngagements, allActivities } = useDashboardData(engagements, user);
    const { isLoggingOut, handleLogout, handleNavigateToWorkspace } = useDashboardActions(refreshData);

    useEffect(() => {
        document.title = 'Internal Audit Management | Director Portal';
    }, []);

    const handleApproval = async (id, status) => {
        try {
            await approveUserOptimistic(id, status);
        } catch (err) {
            alert('Failed to update user status: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCreateAudit = async (data) => {
        try {
            await api.post('/engagements', data);
            setIsNewAuditModalOpen(false);
            refreshData();
        } catch (err) {
            alert('Failed to register audit: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteEngagement = async (id) => {
        if (window.confirm("Are you sure you want to completely delete this audit engagement? This will permanently delete all related MOVs and Documents.")) {
            try {
                await deleteEngagementOptimistic(id);
            } catch (err) {
                alert('Deletion failed: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: true, onClick: () => {} },
        { icon: <Heart className="h-5 w-5" />, title: 'IAsCARes', active: false, onClick: () => navigate('/ias-cares') },
        { icon: <BarChart2 className="h-5 w-5" />, title: 'AAPIS', active: false, onClick: () => navigate('/aapes') },
        { icon: <FileText className="h-5 w-5" />, title: 'MOV Monitor', active: false, onClick: () => navigate('/mov-monitoring') },
        { icon: <Shield className="h-5 w-5" />, title: 'Security', active: false, onClick: () => setIsSecurityModalOpen(true) }
    ];

    if (initialLoad && engagements.length === 0) {
        return (
            <div className="h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="flex flex-col items-center">
                        <h2 className="text-white font-black uppercase tracking-[0.4em] text-sm mb-2">Synchronizing IAMS</h2>
                        <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Initializing Executive Dashboard...</p>
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
                    roleLabel="Director Portal" 
                    title={`Welcome back, ${user?.name || ''}`}
                    subtitle="System Performance & KPIs"
                    isInitialLoad={initialLoad}
                    isLoading={loading}
                    onRefresh={refreshData}
                    pendingTasksCount={engagements.reduce((acc, eng) => acc + (eng.movs?.filter(m => m.status === 'submitted').length || 0), 0)}
                    actions={
                        <button onClick={() => setIsNewAuditModalOpen(true)} className="bg-indigo-600 hover:bg-slate-900 text-white px-5 py-3 rounded-2xl transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-md">
                            <Plus className="w-4 h-4" /> New Audit Engagement
                        </button>
                    }
                />
            }
        >
            {/* KPI Cards */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Active Audits" 
                    value={stats.totalEngagements} 
                    color="indigo"
                    onClick={() => setIsActiveAuditsModalOpen(true)}
                />
                <StatCard 
                    label="System Compliance" 
                    value={`${stats.complianceRate}%`} 
                    color="emerald"
                    progress={{ label: 'Completed Audits', value: `${stats.totalCompleted} / ${stats.totalCount}` }}
                />
                <StatCard 
                    label="Tracked MOVs" 
                    value={stats.totalMovs} 
                    color="amber"
                    progress={{ label: 'Engagement Count', value: stats.totalCount }}
                />
                <StatCard 
                    label="Audit Trail" 
                    value={allActivities.length} 
                    color="dark"
                    onClick={() => setIsHistoryModalOpen(true)}
                />
            </section>

            {/* Registration Approvals (Executive Role Permission) */}
            <section>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Registration Approvals
                </h2>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    {pendingUsers.length === 0 ? (
                        <div className="p-10 flex flex-col items-center justify-center text-slate-400">
                            <CheckCircle className="w-10 h-10 mb-4 text-emerald-400 opacity-50" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500">All Registration requests cleared</p>
                        </div>
                    ) : (
                        <table className="min-w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-[9px] uppercase tracking-widest text-slate-400 font-black">
                                    <th className="pb-4 pt-4 pl-8">User / Email</th>
                                    <th className="pb-4 pt-4">Designation</th>
                                    <th className="pb-4 pt-4">Agency</th>
                                    <th className="pb-4 pt-4 text-right pr-8">Management</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 pl-8">
                                            <p className="text-sm font-black text-slate-800">{u.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                                        </td>
                                        <td className="p-5">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                                {u.designation.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{u.agency_name}</td>
                                        <td className="p-5 pr-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleApproval(u.id, 'rejected')} className="px-3 py-1.5 text-[9px] font-black uppercase text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors">Reject</button>
                                                <button onClick={() => handleApproval(u.id, 'approved')} className="px-3 py-1.5 text-[9px] font-black uppercase text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors">Approve</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* Audit Status Boxes */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    label="Ongoing Audits" 
                    value={stats.totalEngagements} 
                    color={filter === 'ongoing' ? 'indigo' : 'white'}
                    onClick={() => setFilter(filter === 'ongoing' ? 'all' : 'ongoing')}
                />
                <StatCard 
                    label="Follow-up Required" 
                    value={engagements.filter(e => e.status === 'follow_up').length} 
                    color={filter === 'follow_up' ? 'amber' : 'white'}
                    onClick={() => setFilter(filter === 'follow_up' ? 'all' : 'follow_up')}
                />
                <StatCard 
                    label="Concluded Audits" 
                    value={stats.totalCompleted} 
                    color={filter === 'completed' ? 'emerald' : 'white'}
                    onClick={() => setFilter(filter === 'completed' ? 'all' : 'completed')}
                />
            </section>

            {/* Masterfile Table & Activity Feed */}
            <div className="flex flex-col xl:flex-row gap-6 items-start">
                <div className="flex-1 w-full min-w-0">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-indigo-500" /> System Masterfile
                    </h2>
                    <EngagementTable 
                        engagements={getFilteredEngagements(filter)} 
                        isLoading={initialLoad}
                        onRowClick={handleNavigateToWorkspace}
                        onDelete={handleDeleteEngagement}
                        filterActive={filter !== 'all'}
                    />
                </div>
                
                <div className="w-full xl:w-80 shrink-0 self-stretch">
                    <ActivityFeed 
                        activities={recentActivities} 
                        onViewHistory={() => setIsHistoryModalOpen(true)}
                        onActivityClick={(act) => act.engagementId && handleNavigateToWorkspace(act.engagementId)}
                    />
                </div>
            </div>

            {/* Modals */}
            <ActiveAuditsModal 
                isOpen={isActiveAuditsModalOpen} 
                onClose={() => setIsActiveAuditsModalOpen(false)} 
                engagements={engagements}
                initialLoad={initialLoad}
            />
            <HistoryModal 
                isOpen={isHistoryModalOpen} 
                onClose={() => setIsHistoryModalOpen(false)} 
                activities={allActivities}
            />
            <NewAuditModal 
                isOpen={isNewAuditModalOpen}
                onClose={() => setIsNewAuditModalOpen(false)}
                auditees={auditees}
                availableAuditors={availableAuditors}
                engagements={engagements}
                onSubmit={handleCreateAudit}
            />
            <SecuritySettingsModal 
                isOpen={isSecurityModalOpen}
                onClose={() => setIsSecurityModalOpen(false)}
                user={user}
            />
        </DashboardLayout>
    );
}
