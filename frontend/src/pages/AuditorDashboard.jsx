import React, { useState, useEffect } from 'react';
import { LayoutGrid, Database, Clock, ArrowRightLeft, CheckCircle, FileText, Plus } from 'lucide-react';
import { useDataContext } from '../context/DataContext';

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

export default function AuditorDashboard() {
    const { 
        engagements, 
        loading,
        initialLoad, 
        refreshData,
        deleteEngagementOptimistic,
        createEngagementOptimistic,
        auditees,
        availableAuditors
    } = useDataContext();

    const [isNewAuditModalOpen, setIsNewAuditModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isActiveAuditsModalOpen, setIsActiveAuditsModalOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { stats, recentActivities, getFilteredEngagements, allActivities } = useDashboardData(engagements, user);
    const { isLoggingOut, handleLogout, handleNavigateToWorkspace } = useDashboardActions(refreshData);

    useEffect(() => {
        document.title = 'Internal Audit Management | Auditor Portal';
    }, []);

    const handleDeleteEngagement = async (id) => {
        if (window.confirm("Are you sure you want to completely delete this audit engagement? This will permanently delete all related MOVs and Documents.")) {
            try {
                await deleteEngagementOptimistic(id);
            } catch (err) {
                alert('Deletion failed: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    // Nav Items for Sidebar
    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: true, onClick: () => {} },
        { icon: <Plus className="h-5 w-5 text-indigo-500" />, title: 'New Audit Engagements', onClick: () => setIsNewAuditModalOpen(true) }
    ];

    if (initialLoad && engagements.length === 0) {
        return (
            <div className="h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="flex flex-col items-center text-center">
                        <h2 className="text-white font-black uppercase tracking-[0.4em] text-sm mb-2">Synchronizing IAMS</h2>
                        <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Initializing Auditor Workspace...</p>
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
                    roleLabel="Lead Auditor" 
                    title={`Welcome back, ${user?.name || ''}`}
                    subtitle="Auditor Operations Center"
                    isInitialLoad={initialLoad}
                    isLoading={loading}
                    onRefresh={refreshData}
                    pendingTasksCount={engagements.reduce((acc, eng) => acc + (eng.movs?.filter(m => m.status === 'submitted').length || 0), 0)}
                    actions={
                        <button
                            onClick={() => setIsNewAuditModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            New Audit Engagements
                        </button>
                    }
                />
            }
        >

            {/* KPI Cards */}
            <section>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Audit Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        label="Active Audits" 
                        value={stats.totalEngagements} 
                        subValue="Engagements"
                        icon={Clock} 
                        color="indigo"
                        onClick={() => setIsActiveAuditsModalOpen(true)}
                    />
                    <StatCard 
                        label="Ongoing Follow-up" 
                        value={engagements.filter(e => e.status === 'follow_up').length} 
                        subValue="Audits"
                        icon={ArrowRightLeft} 
                        color="amber"
                        onClick={() => setFilter(filter === 'follow_up' ? 'all' : 'follow_up')}
                    />
                    <StatCard 
                        label="Total Completed" 
                        value={stats.totalCompleted} 
                        subValue="Archived"
                        icon={CheckCircle} 
                        color="emerald"
                        onClick={() => setFilter(filter === 'completed' ? 'all' : 'completed')}
                    />
                </div>
            </section>

            {/* Table & Activity */}
            <div className="flex flex-col xl:flex-row gap-6 items-start">
                <div className="flex-1 w-full min-w-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-200 pb-2">
                        <Database className="w-4 h-4 text-indigo-500" /> Masterfile Directory
                        {filter !== 'all' && (
                            <span className="ml-3 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Filtered</span>
                        )}
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
                    <div className="h-full">
                        <ActivityFeed 
                            activities={recentActivities} 
                            onViewHistory={() => setIsHistoryModalOpen(true)}
                            onActivityClick={(act) => act.engagementId && handleNavigateToWorkspace(act.engagementId)}
                        />
                    </div>
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
                onSubmit={async (data) => {
                    try {
                        await createEngagementOptimistic(data);
                        setIsNewAuditModalOpen(false);
                    } catch (err) {
                        alert('Initialization failed: ' + err.message);
                    }
                }}
                auditees={auditees}
                availableAuditors={availableAuditors}
                engagements={engagements}
            />
        </DashboardLayout>
    );
}
