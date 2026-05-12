import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, BarChart2, Filter, Download, RefreshCw } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { useDashboardActions } from '../hooks/useDashboardActions';
import api from '../api';

function getBarBg(pct) {
    if (pct >= 80) return '#10b981';
    if (pct >= 50) return '#fbbf24';
    return '#f87171';
}
function getTextColor(pct) {
    if (pct >= 80) return '#059669';
    if (pct >= 50) return '#d97706';
    return '#ef4444';
}
function initials(name = '') {
    return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 4).toUpperCase();
}

export default function Aapes() {
    const navigate = useNavigate();
    const { engagements, loading: ctxLoading, refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { handleLogout } = useDashboardActions(refreshData);

    const [toolData, setToolData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        document.title = 'AAPIS Dashboard | IAMS';
    }, []);

    // Fetch aapis tool data for every engagement
    const fetchAll = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled(
                engagements.map(eng =>
                    api.get(`/engagements/${eng.id}/tools/aapis`)
                        .then(r => ({ eng, data: r.data }))
                        .catch(() => null)
                )
            );

            const rows = [];
            results.forEach(r => {
                if (r.status !== 'fulfilled' || !r.value) return;
                const { eng, data } = r.value;
                if (!data?.form_data) return;
                const fd = data.form_data;

                // Count rows from the aapis rows array by implStatus field
                const recRows = Array.isArray(fd.rows) ? fd.rows : [];
                const total          = recRows.filter(row => row.recommendation?.trim()).length;
                const fullyComplied  = recRows.filter(row => (row.implStatus || '').toUpperCase().includes('FI') || (row.implStatus || '').toUpperCase() === 'BP').length;
                const partiallyImpl  = recRows.filter(row => (row.implStatus || '').toUpperCase().includes('PI')).length;
                const notImpl        = recRows.filter(row => (row.implStatus || '').toUpperCase().includes('NI')).length;

                if (total === 0) return; // skip empty forms

                rows.push({
                    id: eng.id,
                    name: eng.title || `Engagement #${eng.id}`,
                    implemented: fullyComplied,
                    partiallyImpl,
                    notImpl,
                    total,
                    lastUpdated: data.updated_at
                        ? new Date(data.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—',
                });
            });
            setToolData(rows);
        } catch (_) {}
        setLoading(false);
        setLastRefresh(new Date());
    };

    useEffect(() => {
        if (!ctxLoading && engagements.length > 0) fetchAll();
    }, [engagements, ctxLoading]);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => navigate('/') },
        { icon: <BarChart2 className="h-5 w-5" />, title: 'AAPIS', active: true, onClick: () => {} }
    ];

    const sorted = useMemo(() =>
        [...toolData].sort((a, b) => a.name.localeCompare(b.name)),
        [toolData]
    );

    return (
        <div className="bg-slate-100 font-sans h-screen flex overflow-hidden">
            <DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <header className="bg-white border-b border-slate-200 px-10 py-5 shrink-0 z-10 flex justify-between items-center shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">AAPIS Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Auditee Action Plan and Implementation Status Overview &mdash; as of{' '}
                            {lastRefresh.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchAll}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" /> Refresh
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                    <div className="max-w-6xl mx-auto">
                        <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Audit Engagement', 'Recommendations Status', 'Progress'].map((h, i) => (
                                            <th key={h} style={{
                                                backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600,
                                                textAlign: i === 1 ? 'center' : 'left',
                                                padding: '16px 24px', borderBottom: '2px solid #e2e8f0',
                                                textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em',
                                                width: '33%'
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                <p style={{ marginTop: '12px' }}>Loading AAPIS data…</p>
                                            </td>
                                        </tr>
                                    ) : sorted.length > 0 ? sorted.map(row => {
                                        const pct = row.total > 0 ? Math.round((row.implemented / row.total) * 100) : 0;
                                        const barBg = getBarBg(pct);
                                        const textColor = getTextColor(pct);
                                        const acr = initials(row.name);
                                        return (
                                            <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>

                                                {/* Col 1: Avatar + Name */}
                                                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '40px', height: '40px', borderRadius: '50%',
                                                            backgroundColor: '#e0e7ff', color: '#4338ca',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                                                        }}>{acr}</div>
                                                        <div>
                                                            <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{row.name}</p>
                                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0' }}>Updated: {row.lastUpdated}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Col 2: FC / Total + status dots */}
                                                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                                                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{row.implemented}</span>
                                                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', marginBottom: '3px' }}>/ {row.total}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', marginTop: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                                                                <span style={{ color: '#475569' }}>FI/BP: {row.implemented}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24', display: 'inline-block' }} />
                                                                <span style={{ color: '#475569' }}>PI: {row.partiallyImpl}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f87171', display: 'inline-block' }} />
                                                                <span style={{ color: '#475569' }}>NI: {row.notImpl}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Col 3: % + bar */}
                                                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', fontWeight: 500 }}>
                                                            <span style={{ color: textColor, fontWeight: 700 }}>{pct}%</span>
                                                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Implementation Rate</span>
                                                        </div>
                                                        <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barBg, transition: 'width 0.5s ease-in-out' }} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                No AAPIS records found. Forms must be saved in the audit tool workspace first.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginTop: '20px', fontSize: '0.875rem', color: '#475569' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: 700 }}>FI/BP:</span> Fully Implemented / Best Practice</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: 700 }}>PI:</span> Partially Implemented</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: 700 }}>NI:</span> Not Implemented</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
