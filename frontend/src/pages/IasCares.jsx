import React, { useEffect, useMemo } from 'react';
import { LayoutGrid, Heart, CheckCircle, AlertCircle, FileText, Users, TrendingUp } from 'lucide-react';
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
        document.title = 'IAsCARes | Internal Audit Management';
    }, []);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => window.location.href = '/' },
        { icon: <Heart className="h-5 w-5" />, title: 'IAsCARes', active: true, onClick: () => {} }
    ];

    /**
     * Aggregate all MOVs across all engagements, grouped by auditee.
     * IAsCARes tracks audit recommendation compliance — "approved" MOV = complied.
     */
    const { auditeeData, totals } = useMemo(() => {
        const map = {};

        engagements.forEach(eng => {
            (eng.movs || []).forEach(mov => {
                const aid = mov.auditee?.id ?? mov.auditee_id;
                if (!aid) return;
                if (!map[aid]) {
                    map[aid] = {
                        id: aid,
                        name: mov.auditee?.name ?? `Auditee #${aid}`,
                        total: 0,
                        complied: 0,
                        pending: 0,
                        submitted: 0,
                        returned: 0,
                    };
                }
                map[aid].total += 1;
                if (mov.status === 'approved')   map[aid].complied   += 1;
                if (mov.status === 'pending')    map[aid].pending    += 1;
                if (mov.status === 'submitted')  map[aid].submitted  += 1;
                if (mov.status === 'returned')   map[aid].returned   += 1;
            });
        });

        const rows = Object.values(map).sort((a, b) => b.total - a.total);

        const totals = rows.reduce(
            (acc, r) => ({
                total:    acc.total    + r.total,
                complied: acc.complied + r.complied,
                pending:  acc.pending  + r.pending,
            }),
            { total: 0, complied: 0, pending: 0 }
        );

        return { auditeeData: rows, totals };
    }, [engagements]);

    const overallRate = totals.total > 0
        ? Math.round((totals.complied / totals.total) * 100)
        : 0;

    return (
        <DashboardLayout
            isLoggingOut={isLoggingOut}
            userName={user?.name}
            sidebar={<DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />}
            header={
                <DashboardHeader
                    user={user}
                    roleLabel="IAsCARes"
                    title="IAsCARes Compliance Monitoring"
                    subtitle="Track auditee compliance with Internal Audit recommendations"
                    isInitialLoad={initialLoad}
                    isLoading={loading}
                    onRefresh={refreshData}
                    actions={null}
                />
            }
        >
            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{totals.total}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Total Recommendations</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-700">{totals.complied}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Fully Complied</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-rose-600">{overallRate}%</p>
                        <p className="text-xs text-slate-500 mt-0.5">Overall Compliance Rate</p>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg font-bold text-slate-800">Compliance Overview per Auditee</h2>
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
                                auditeeData.map(row => {
                                    const rate = row.total > 0 ? Math.round((row.complied / row.total) * 100) : 0;
                                    const pending = row.total - row.complied;
                                    const barClass = rate === 100
                                        ? 'bg-emerald-500'
                                        : rate >= 75 ? 'bg-blue-500'
                                        : rate >= 50 ? 'bg-amber-500'
                                        : 'bg-rose-500';

                                    return (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {row.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {row.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <FileText className="w-4 h-4" />
                                                    {row.total}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                                    <CheckCircle className="w-4 h-4" />
                                                    {row.complied}
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
                                                    <div className="w-28 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                                                            style={{ width: `${rate}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                                        {loading ? 'Loading data…' : 'No auditee data available.'}
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
