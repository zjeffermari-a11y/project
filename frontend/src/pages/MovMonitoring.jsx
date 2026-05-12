import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, ClipboardList, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { useDashboardActions } from '../hooks/useDashboardActions';
import api from '../api';

// MOV category labels (same as in inventory tool)
const MOV_CATEGORIES = [
    'Policies & Procedures',
    'Plans',
    'Reports',
    'Financial Documents',
    'Contracts',
    'Permits & Licenses',
    'Official Correspondence',
    'Logbooks & Records',
    'Databases & Systems',
    'Others',
];

function StatusBadge({ submitted, total }) {
    const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
    let bg = '#dcfce7'; let fg = '#15803d';
    if (pct < 80) { bg = '#fef9c3'; fg = '#a16207'; }
    if (pct < 50) { bg = '#fee2e2'; fg = '#b91c1c'; }
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', backgroundColor: bg, color: fg, fontWeight: 600, fontSize: '0.75rem' }}>
            {submitted}/{total} — {pct}%
        </span>
    );
}

function ExpandableRow({ eng }) {
    const [open, setOpen] = useState(false);
    const [toolData, setToolData] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        if (toolData !== null) return;
        setLoading(true);
        try {
            const r = await api.get(`/engagements/${eng.id}/tools/inventory`);
            setToolData(r.data?.form_data || {});
        } catch {
            setToolData({});
        }
        setLoading(false);
    };

    const handleToggle = () => {
        if (!open) loadData();
        setOpen(p => !p);
    };

    // Compute per-category submitted/required from movItems
    const categories = useMemo(() => {
        if (!toolData) return [];
        const movItems = Array.isArray(toolData.movItems) ? toolData.movItems : [];
        return MOV_CATEGORIES.map(cat => {
            const items = movItems.filter(item => item.category === cat);
            const required  = items.length;
            const submitted = items.filter(i => i.submitted || i.status === 'submitted').length;
            return { cat, required, submitted };
        }).filter(c => c.required > 0);
    }, [toolData]);

    const total     = categories.reduce((s, c) => s + c.required, 0);
    const submitted = categories.reduce((s, c) => s + c.submitted, 0);

    return (
        <>
            <tr onClick={handleToggle} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: open ? '#f1f5f9' : 'white' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = open ? '#f1f5f9' : 'white'}>
                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {open ? <ChevronDown size={16} color="#6366f1" /> : <ChevronRight size={16} color="#94a3b8" />}
                        <div>
                            <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{eng.title || `Engagement #${eng.id}`}</p>
                            {eng.auditee && <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0' }}>Auditee: {eng.auditee}</p>}
                        </div>
                    </div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    {total > 0
                        ? <StatusBadge submitted={submitted} total={total} />
                        : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No MOVs recorded</span>}
                </td>
                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                    {total > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', transition: 'width 0.4s ease',
                                    width: `${total > 0 ? Math.round((submitted / total) * 100) : 0}%`,
                                    backgroundColor: submitted === total ? '#10b981' : submitted > 0 ? '#fbbf24' : '#f87171'
                                }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', minWidth: '40px' }}>
                                {total > 0 ? Math.round((submitted / total) * 100) : 0}%
                            </span>
                        </div>
                    ) : '—'}
                </td>
            </tr>

            {open && (
                <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td colSpan="3" style={{ padding: '0 24px 16px 48px' }}>
                        {loading ? (
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '12px 0' }}>Loading category breakdown…</p>
                        ) : categories.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', paddingTop: '10px' }}>
                                {categories.map(c => {
                                    const pct = c.required > 0 ? Math.round((c.submitted / c.required) * 100) : 0;
                                    const barColor = c.submitted === c.required ? '#10b981' : c.submitted > 0 ? '#fbbf24' : '#f87171';
                                    return (
                                        <div key={c.cat} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
                                            <p style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem', margin: '0 0 6px' }}>{c.cat}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, transition: 'width 0.4s ease' }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.submitted}/{c.required}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '12px 0' }}>No MOV categories available for this engagement.</p>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

export default function MovMonitoring() {
    const navigate = useNavigate();
    const { engagements, loading: ctxLoading, refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { handleLogout } = useDashboardActions(refreshData);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        document.title = 'MOV Monitoring | IAMS';
    }, []);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => navigate('/') },
        { icon: <ClipboardList className="h-5 w-5" />, title: 'MOV Monitoring', active: true, onClick: () => {} }
    ];

    return (
        <div className="bg-slate-50 font-sans h-screen flex overflow-hidden">
            <DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-10 py-5 shrink-0 z-10 flex justify-between items-center shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">MOV Monitoring Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Means of Verification submission status per engagement &mdash; as of{' '}
                            {lastRefresh.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setLastRefresh(new Date())}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" /> Refresh
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                    <div className="max-w-5xl mx-auto">
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                            Click on an engagement row to expand and see category breakdown.
                        </p>

                        <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Audit Engagement', 'MOV Status', 'Progress'].map((h, i) => (
                                            <th key={h} style={{
                                                backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600,
                                                textAlign: i === 1 ? 'center' : 'left',
                                                padding: '16px 24px', borderBottom: '2px solid #e2e8f0',
                                                textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em',
                                                width: i === 0 ? '40%' : '30%'
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ctxLoading ? (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                <p style={{ marginTop: '12px' }}>Loading engagements…</p>
                                            </td>
                                        </tr>
                                    ) : engagements.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                No engagements found.
                                            </td>
                                        </tr>
                                    ) : (
                                        engagements.map(eng => <ExpandableRow key={eng.id} eng={eng} />)
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '20px', fontSize: '0.8rem', color: '#64748b' }}>
                            <span><strong style={{ color: '#10b981' }}>■</strong> All submitted</span>
                            <span><strong style={{ color: '#fbbf24' }}>■</strong> Partially submitted</span>
                            <span><strong style={{ color: '#f87171' }}>■</strong> Not yet submitted</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
