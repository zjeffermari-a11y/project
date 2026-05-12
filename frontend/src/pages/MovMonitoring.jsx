import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, Filter } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { useDashboardActions } from '../hooks/useDashboardActions';

// MOV categories mapped from requirement_name keywords — must match the backend data
const MOV_CATEGORIES = [
    { key: 'control_environment',       label: 'Control Environment',                       match: 'control environment' },
    { key: 'risk_assessment',           label: 'Risk Assessment',                            match: 'risk assessment' },
    { key: 'control_activities',        label: 'Control Activities',                         match: 'control activities' },
    { key: 'initial_samples',           label: 'Initial samples based on PMR/APP',           match: 'initial sample' },
    { key: 'information_communication', label: 'Information and Communication',               match: 'information' },
    { key: 'monitoring',                label: 'Monitoring',                                  match: 'monitoring' },
    { key: 'total_docs',                label: 'Total Documents Submitted Prior the discussion', match: 'total' },
    { key: 'additional_movs',           label: 'Additional MOVs',                            match: 'additional' },
];

function getCategoryKey(requirementName) {
    const lower = (requirementName || '').toLowerCase();
    for (const cat of MOV_CATEGORIES) {
        if (lower.includes(cat.match)) return cat.key;
    }
    return 'additional_movs';
}

function categoryProgress(movs, categoryKey) {
    const filtered = movs.filter(m => getCategoryKey(m.requirement_name) === categoryKey);
    if (filtered.length === 0) return null;
    const approved = filtered.filter(m => m.status === 'approved').length;
    return Math.round((approved / filtered.length) * 100);
}

function formatDatetime() {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

export default function MovMonitoring() {
    const navigate = useNavigate();
    const { engagements, loading, initialLoad, refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { isLoggingOut, handleLogout } = useDashboardActions(refreshData);
    const [currentTime, setCurrentTime] = useState(formatDatetime());

    useEffect(() => {
        document.title = 'MOV Monitoring Dashboard | IAMS';
        const interval = setInterval(() => setCurrentTime(formatDatetime()), 60000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => navigate('/') },
        { icon: <FileText className="h-5 w-5" />, title: 'MOV Monitor', active: true, onClick: () => {} }
    ];

    const auditeeRows = useMemo(() => {
        const map = {};
        engagements.forEach(eng => {
            (eng.movs || []).forEach(mov => {
                const aid = mov.auditee?.id ?? mov.auditee_id;
                if (!aid) return;
                if (!map[aid]) {
                    map[aid] = { id: aid, name: mov.auditee?.name ?? `Auditee #${aid}`, movs: [] };
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
        <div className="bg-slate-50 font-sans h-screen flex overflow-hidden">
            {/* Sidebar */}
            <DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />

            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-10 py-5 shrink-0 z-10 flex justify-between items-center shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">STATUS OF SUBMITTED MOVs PROCUREMENT</h1>
                        <p className="text-sm text-slate-500 mt-1">As of {currentTime}</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filter Data
                        </button>
                    </div>
                </header>

                {/* Scrollable content with horizontal scroll */}
                <div className="flex-1 overflow-auto p-6 lg:p-10"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                    <div className="w-full">
                        {loading && auditeeRows.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-slate-500">Loading data from backend...</p>
                            </div>
                        ) : (
                            <table style={{
                                width: '100%',
                                minWidth: '1200px',
                                borderCollapse: 'collapse',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                            }}>
                                <thead>
                                    <tr>
                                        {/* Sticky Regions header */}
                                        <th style={{
                                            width: '192px',
                                            position: 'sticky',
                                            left: 0,
                                            backgroundColor: '#f8fafc',
                                            zIndex: 10,
                                            boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)',
                                            color: '#475569',
                                            fontWeight: 600,
                                            textAlign: 'left',
                                            padding: '12px 16px',
                                            borderBottom: '2px solid #e2e8f0',
                                            textTransform: 'uppercase',
                                            fontSize: '0.70rem',
                                            letterSpacing: '0.05em',
                                            lineHeight: 1.2,
                                        }}>Regions</th>

                                        {/* Category headers */}
                                        {MOV_CATEGORIES.map(cat => (
                                            <th key={cat.key} style={{
                                                backgroundColor: '#f8fafc',
                                                color: '#475569',
                                                fontWeight: 600,
                                                textAlign: 'left',
                                                padding: '12px 16px',
                                                borderBottom: '2px solid #e2e8f0',
                                                textTransform: 'uppercase',
                                                fontSize: '0.70rem',
                                                letterSpacing: '0.05em',
                                                lineHeight: 1.2,
                                            }}>{cat.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditeeRows.length > 0 ? auditeeRows.map(row => (
                                        <tr key={row.id}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                                            style={{ borderBottom: '1px solid #e2e8f0' }}>

                                            {/* Sticky name cell */}
                                            <td style={{
                                                padding: '12px 16px',
                                                position: 'sticky',
                                                left: 0,
                                                backgroundColor: 'inherit',
                                                zIndex: 10,
                                                boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)',
                                                fontWeight: 500,
                                                color: '#1e293b',
                                                whiteSpace: 'nowrap',
                                                verticalAlign: 'middle',
                                            }}>{row.name}</td>

                                            {/* Category progress bar cells */}
                                            {MOV_CATEGORIES.map(cat => {
                                                const pct = row.categories[cat.key];
                                                return (
                                                    <td key={cat.key} style={{
                                                        padding: '12px 16px',
                                                        verticalAlign: 'middle',
                                                        whiteSpace: 'nowrap',
                                                        color: '#1e293b',
                                                    }}>
                                                        {pct === null ? (
                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>N/A</span>
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{
                                                                    flex: 1, minWidth: '50px',
                                                                    backgroundColor: '#e2e8f0',
                                                                    borderRadius: '9999px',
                                                                    height: '10px',
                                                                    overflow: 'hidden',
                                                                }}>
                                                                    <div style={{
                                                                        width: `${pct}%`,
                                                                        height: '100%',
                                                                        backgroundColor: '#1f2937', // dark fill matching the HTML mockup
                                                                        transition: 'width 0.5s ease-in-out',
                                                                    }} />
                                                                </div>
                                                                <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.75rem', minWidth: '32px', textAlign: 'right' }}>
                                                                    {pct}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={MOV_CATEGORIES.length + 1}
                                                style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                No MOV data available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
