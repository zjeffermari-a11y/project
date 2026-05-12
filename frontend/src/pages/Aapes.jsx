import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, BarChart2, CheckCircle, Clock, ArrowRightCircle, AlertCircle, XCircle, FileText, Users, TrendingUp } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboardActions } from '../hooks/useDashboardActions';

const STATUS_CONFIG = {
    completed:  { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    in_review:  { label: 'In Review',   color: 'bg-blue-100 text-blue-700',       icon: <ArrowRightCircle className="w-3.5 h-3.5" /> },
    returned:   { label: 'Returned',    color: 'bg-rose-100 text-rose-700',       icon: <XCircle className="w-3.5 h-3.5" /> },
    followup:   { label: 'Follow-up',   color: 'bg-purple-100 text-purple-700',   icon: <ArrowRightCircle className="w-3.5 h-3.5" /> },
    reporting:  { label: 'Reporting',   color: 'bg-indigo-100 text-indigo-700',   icon: <FileText className="w-3.5 h-3.5" /> },
    execution:  { label: 'Execution',   color: 'bg-amber-100 text-amber-700',     icon: <ArrowRightCircle className="w-3.5 h-3.5" /> },
    planning:   { label: 'Planning',    color: 'bg-slate-100 text-slate-600',     icon: <Clock className="w-3.5 h-3.5" /> },
};

function getStatusConfig(status) {
    return STATUS_CONFIG[status] ?? { label: (status || 'Unknown').replace(/_/g, ' ').toUpperCase(), color: 'bg-slate-100 text-slate-600', icon: null };
}

export default function Aapes() {
    const navigate = useNavigate();
    const { engagements, loading, initialLoad, refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { isLoggingOut, handleLogout } = useDashboardActions(refreshData);

    useEffect(() => {
        document.title = 'AAPIS | Internal Audit Management';
    }, []);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => navigate('/') },
        { icon: <BarChart2 className="h-5 w-5" />, title: 'AAPIS', active: true, onClick: () => {} }
    ];

    const { rows, totals } = useMemo(() => {
        const rows = engagements.map(eng => {
            const movs = eng.movs || [];
            const total     = movs.length;
            const approved  = movs.filter(m => m.status === 'approved').length;
            const submitted = movs.filter(m => m.status === 'submitted').length;
            const returned  = movs.filter(m => m.status === 'returned').length;
            const pending   = movs.filter(m => m.status === 'pending').length;
            const progress  = total > 0 ? Math.round((approved / total) * 100) : 0;

            // Collect unique auditee names from MOVs
            const auditeeNames = [
                ...new Set(
                    movs
                        .map(m => m.auditee?.name)
                        .filter(Boolean)
                )
            ];

            return {
                id: eng.id,
                aeNumber: eng.ae_number,
                title: eng.title,
                status: eng.status,
                total,
                approved,
                submitted,
                returned,
                pending,
                progress,
                auditeeNames,
            };
        });

        const totals = {
            engagements: rows.length,
            completed:   rows.filter(r => r.status === 'completed').length,
            inProgress:  rows.filter(r => !['completed', 'planning'].includes(r.status)).length,
        };

        return { rows, totals };
    }, [engagements]);

    return (
        <DashboardLayout
            isLoggingOut={isLoggingOut}
            userName={user?.name}
            sidebar={<DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />}
            header={
                <DashboardHeader
                    user={user}
                    roleLabel="AAPIS"
                    title="AAPIS Monitoring Dashboard"
                    subtitle="Annual Audit Program Implementation Status — track progress across all audit engagements"
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
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{totals.engagements}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Total Engagements</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-700">{totals.completed}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Completed</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-amber-700">{totals.inProgress}</p>
                        <p className="text-xs text-slate-500 mt-0.5">In Progress</p>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold text-slate-800">Engagement Progress Overview</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Engagement</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Auditee(s)</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Phase / Status</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">MOV Breakdown</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Compliance Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.length > 0 ? (
                                rows.map(row => {
                                    const sc = getStatusConfig(row.status);
                                    const barClass = row.progress === 100
                                        ? 'bg-emerald-500'
                                        : row.progress >= 75 ? 'bg-blue-500'
                                        : row.progress >= 50 ? 'bg-amber-500'
                                        : 'bg-indigo-500';

                                    return (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            {/* Engagement */}
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                <div className="flex flex-col gap-0.5">
                                                    <span>{row.title}</span>
                                                    <span className="text-xs text-slate-400 font-mono">{row.aeNumber}</span>
                                                </div>
                                            </td>

                                            {/* Auditees */}
                                            <td className="px-6 py-4 text-slate-600">
                                                {row.auditeeNames.length > 0 ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        {row.auditeeNames.slice(0, 3).map((name, i) => (
                                                            <span key={i} className="text-xs">{name}</span>
                                                        ))}
                                                        {row.auditeeNames.length > 3 && (
                                                            <span className="text-xs text-slate-400">+{row.auditeeNames.length - 3} more</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Not assigned</span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.color}`}>
                                                    {sc.icon}
                                                    {sc.label}
                                                </span>
                                            </td>

                                            {/* MOV Breakdown */}
                                            <td className="px-6 py-4">
                                                {row.total > 0 ? (
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        <span className="text-emerald-600 font-medium">✓ {row.approved} approved</span>
                                                        {row.submitted > 0 && <span className="text-blue-600">↑ {row.submitted} submitted</span>}
                                                        {row.returned  > 0 && <span className="text-rose-600">↩ {row.returned} returned</span>}
                                                        {row.pending   > 0 && <span className="text-slate-400">⏳ {row.pending} pending</span>}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No MOVs</span>
                                                )}
                                            </td>

                                            {/* Progress Bar */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-slate-700 w-12 text-sm">
                                                        {row.approved}/{row.total}
                                                    </span>
                                                    <div className="w-28 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                                                            style={{ width: `${row.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500">{row.progress}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                                        {loading ? 'Loading engagements…' : 'No engagements found.'}
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
