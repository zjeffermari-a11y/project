import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, RefreshCw } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboardActions } from '../hooks/useDashboardActions';

// MOV categories mapped from requirement_name keywords
const MOV_CATEGORIES = [
    { key: 'control_environment',       label: 'Control Environment',                      match: 'control environment' },
    { key: 'risk_assessment',           label: 'Risk Assessment',                           match: 'risk assessment' },
    { key: 'control_activities',        label: 'Control Activities',                        match: 'control activities' },
    { key: 'initial_samples',           label: 'Initial Samples (PMR/APP)',                 match: 'initial sample' },
    { key: 'information_communication', label: 'Information & Communication',               match: 'information' },
    { key: 'monitoring',                label: 'Monitoring',                                match: 'monitoring' },
    { key: 'total_docs',                label: 'Total Docs Submitted',                      match: 'total' },
    { key: 'additional_movs',           label: 'Additional MOVs',                           match: 'additional' },
];

/** Match a MOV's requirement_name to a category key */
function getCategoryKey(requirementName) {
    const lower = (requirementName || '').toLowerCase();
    for (const cat of MOV_CATEGORIES) {
        if (lower.includes(cat.match)) return cat.key;
    }
    // If no category matches, count it in "additional_movs"
    return 'additional_movs';
}

/** Calculate % of approved MOVs for a given category */
function categoryProgress(movs, categoryKey) {
    const filtered = movs.filter(m => getCategoryKey(m.requirement_name) === categoryKey);
    if (filtered.length === 0) return null; // null = no data
    const approved = filtered.filter(m => m.status === 'approved').length;
    return Math.round((approved / filtered.length) * 100);
}

/** Color for progress bar based on value */
function barColor(pct) {
    if (pct === null) return 'bg-slate-300';
    if (pct === 100) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
}

export default function MovMonitoring() {
    const navigate = useNavigate();
    const { engagements, loading, initialLoad, refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { isLoggingOut, handleLogout } = useDashboardActions(refreshData);

    useEffect(() => {
        document.title = 'MOV Monitoring | Internal Audit Management';
    }, []);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => navigate('/') },
        { icon: <FileText className="h-5 w-5" />, title: 'MOV Monitoring', active: true, onClick: () => {} }
    ];

    /**
     * Build per-auditee rows: group all MOVs across all engagements by auditee.
     * Each row = { id, name, movs: [...], categories: { key: pct|null } }
     */
    const auditeeRows = useMemo(() => {
        const map = {};

        engagements.forEach(eng => {
            (eng.movs || []).forEach(mov => {
                const aid = mov.auditee?.id ?? mov.auditee_id;
                if (!aid) return;
                if (!map[aid]) {
                    map[aid] = {
                        id: aid,
                        name: mov.auditee?.name ?? `Auditee #${aid}`,
                        movs: [],
                    };
                }
                map[aid].movs.push(mov);
            });
        });

        return Object.values(map)
            .map(row => ({
                ...row,
                categories: Object.fromEntries(
                    MOV_CATEGORIES.map(cat => [cat.key, categoryProgress(row.movs, cat.key)])
                ),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [engagements]);

    return (
        <DashboardLayout
            isLoggingOut={isLoggingOut}
            userName={user?.name}
            sidebar={<DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />}
            header={
                <DashboardHeader
                    user={user}
                    roleLabel="MOV Monitoring"
                    title="Status of Submitted MOVs"
                    subtitle="Track MOV submission compliance per auditee across all audit categories"
                    isInitialLoad={initialLoad}
                    isLoading={loading}
                    onRefresh={refreshData}
                    actions={null}
                />
            }
        >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Card Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-600" />
                        MOV Submission Progress by Auditee
                    </h2>
                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Refreshing…
                        </div>
                    )}
                </div>

                {/* Scrollable Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm" style={{ minWidth: '1100px' }}>
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                                    Auditee / Region
                                </th>
                                {MOV_CATEGORIES.map(cat => (
                                    <th key={cat.key} className="px-4 py-4 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">
                                        {cat.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditeeRows.length > 0 ? (
                                auditeeRows.map(row => (
                                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                        {/* Sticky name column */}
                                        <td className="px-6 py-4 font-medium text-slate-800 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {row.name.charAt(0).toUpperCase()}
                                                </div>
                                                {row.name}
                                            </div>
                                        </td>

                                        {/* Category progress bars */}
                                        {MOV_CATEGORIES.map(cat => {
                                            const pct = row.categories[cat.key];
                                            return (
                                                <td key={cat.key} className="px-4 py-4 whitespace-nowrap">
                                                    {pct === null ? (
                                                        <span className="text-xs text-slate-400 italic">N/A</span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden" style={{ minWidth: '60px' }}>
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700 w-9 text-right">
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={MOV_CATEGORIES.length + 1} className="px-6 py-10 text-center text-slate-500">
                                        {loading ? 'Loading MOV data…' : 'No MOV data available.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> 100% — Fully Complied</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> 75–99% — Mostly Complied</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> 50–74% — In Progress</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Below 50% — Needs Attention</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300 inline-block"></span> N/A — No MOVs in this category</span>
                </div>
            </div>
        </DashboardLayout>
    );
}
