import React, { useEffect } from 'react';
import { LayoutGrid, Heart, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboardActions } from '../hooks/useDashboardActions';

export default function IasCares() {
    const { engagements, loading, initialLoad, refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { isLoggingOut, handleLogout } = useDashboardActions(refreshData);

    useEffect(() => {
        document.title = 'IAS Cares | Internal Audit Management';
    }, []);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => window.location.href = '/' },
        { icon: <Heart className="h-5 w-5" />, title: 'IAS Cares', active: true, onClick: () => {} }
    ];

    // Compute metrics per auditee
    // Auditee ID -> { name, totalRecommendations, compliedRecommendations }
    const auditeeStats = {};

    engagements.forEach(eng => {
        const movs = eng.movs || [];
        movs.forEach(mov => {
            const auditeeId = mov.auditee?.id || mov.auditee_id;
            const auditeeName = mov.auditee?.name || `Auditee #${auditeeId}`;
            
            if (!auditeeStats[auditeeId]) {
                auditeeStats[auditeeId] = {
                    id: auditeeId,
                    name: auditeeName,
                    total: 0,
                    complied: 0
                };
            }
            auditeeStats[auditeeId].total += 1;
            if (mov.status === 'approved') {
                auditeeStats[auditeeId].complied += 1;
            }
        });
    });

    const auditeeData = Object.values(auditeeStats).sort((a, b) => b.total - a.total);

    return (
        <DashboardLayout
            isLoggingOut={isLoggingOut}
            userName={user?.name}
            sidebar={<DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />}
            header={
                <DashboardHeader 
                    user={user} 
                    roleLabel="IAS Cares" 
                    title="Audit Recommendation Tracking"
                    subtitle="Monitor auditee compliance with audit recommendations"
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
                        <Heart className="w-5 h-5 text-rose-500" /> Compliance Overview
                    </h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Auditee</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Total Recommendations</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Fully Complied</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Pending / Ongoing</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Compliance Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditeeData.length > 0 ? (
                                auditeeData.map(data => {
                                    const rate = data.total > 0 ? Math.round((data.complied / data.total) * 100) : 0;
                                    const pending = data.total - data.complied;
                                    return (
                                        <tr key={data.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                                                    {data.name.charAt(0)}
                                                </div>
                                                {data.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <FileText className="w-4 h-4" />
                                                    {data.total}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                                    <CheckCircle className="w-4 h-4" />
                                                    {data.complied}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-amber-600 font-medium">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {pending}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-slate-700 w-10">{rate}%</span>
                                                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${rate === 100 ? 'bg-emerald-500' : rate > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${rate}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                        No auditee data available.
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
