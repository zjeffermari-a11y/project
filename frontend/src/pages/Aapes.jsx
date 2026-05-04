import React, { useEffect } from 'react';
import { LayoutGrid, BarChart2, CheckCircle, Clock, ArrowRightCircle } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboardActions } from '../hooks/useDashboardActions';

export default function Aapes() {
    const { engagements, loading, initialLoad, refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { isLoggingOut, handleLogout } = useDashboardActions(refreshData);

    useEffect(() => {
        document.title = 'AAPES | Internal Audit Management';
    }, []);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => window.location.href = '/' },
        { icon: <BarChart2 className="h-5 w-5" />, title: 'AAPES', active: true, onClick: () => {} }
    ];

    return (
        <DashboardLayout
            isLoggingOut={isLoggingOut}
            userName={user?.name}
            sidebar={<DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />}
            header={
                <DashboardHeader 
                    user={user} 
                    roleLabel="AAPES" 
                    title="Audit Engagement Tracking"
                    subtitle="Monitor the overall progress of audit engagements per auditee"
                    isInitialLoad={initialLoad}
                    isLoading={loading}
                    onRefresh={refreshData}
                    actions={null}
                />
            }
        >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-500" /> AAPES Engagement Progress
                    </h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Engagement</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Primary Auditee</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Audit Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {engagements.length > 0 ? (
                                engagements.map(eng => {
                                    const movs = eng.movs || [];
                                    const totalItems = movs.length;
                                    const completedItems = movs.filter(m => m.status === 'approved').length;
                                    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                                    
                                    // Try to determine a primary auditee from MOVs
                                    let auditeeName = 'Multiple / TBD';
                                    if (movs.length > 0 && movs[0].auditee) {
                                        auditeeName = movs[0].auditee.name;
                                    }

                                    return (
                                        <tr key={eng.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                <div className="flex flex-col">
                                                    <span>{eng.title}</span>
                                                    <span className="text-xs text-slate-400 font-mono">{eng.ae_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {auditeeName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                                    ${eng.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                                    eng.status === 'in_review' ? 'bg-blue-100 text-blue-700' : 
                                                    eng.status === 'returned' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-slate-100 text-slate-700'}`}
                                                >
                                                    {eng.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                                                    {eng.status === 'in_review' && <ArrowRightCircle className="w-3.5 h-3.5" />}
                                                    {eng.status === 'returned' && <AlertCircle className="w-3.5 h-3.5" />}
                                                    {eng.status === 'planning' && <Clock className="w-3.5 h-3.5" />}
                                                    {eng.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-slate-700 w-12">{completedItems}/{totalItems}</span>
                                                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                        No engagements found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
