import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Heart, Filter, RefreshCw } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { useDashboardActions } from '../hooks/useDashboardActions';
import api from '../api';

function getBarColor(pct) {
    if (pct >= 80) return '#10b981';
    if (pct >= 50) return '#3b82f6';
    return '#f59e0b';
}

function getTextColor(pct) {
    if (pct >= 80) return '#059669';
    if (pct >= 50) return '#2563eb';
    return '#d97706';
}

export default function IasCares() {
    const navigate = useNavigate();
    const { engagements, loading: ctxLoading, refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { handleLogout } = useDashboardActions(refreshData);

    const [toolData, setToolData] = useState([]);   // [{engTitle, auditee, complied, total}]
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        document.title = 'IAsCARes Dashboard | IAMS';
    }, []);

    // Fetch iascares tool data for every engagement
    const fetchAll = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled(
                engagements.map(eng =>
                    api.get(`/engagements/${eng.id}/tools/iascares`)
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
                const totalNo   = parseInt(fd.totalNo)  || 0;
                const fcNo      = parseInt(fd.fcNo)     || 0;
                const bpNo      = parseInt(fd.bpNo)     || 0;
                rows.push({
                    id: eng.id,
                    engTitle: eng.title || `Engagement #${eng.id}`,
                    complied: fcNo + bpNo,    // FC + BP = fully/best-practice compliant
                    total: totalNo,
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
        { icon: <Heart className="h-5 w-5" />, title: 'IAsCARes', active: true, onClick: () => {} }
    ];

    const sorted = useMemo(() =>
        [...toolData].sort((a, b) => a.engTitle.localeCompare(b.engTitle)),
        [toolData]
    );

    return (
        <div className="bg-slate-50 font-sans h-screen flex overflow-hidden">
            <DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-10 py-5 shrink-0 z-10 flex justify-between items-center shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">IAsCARes Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Audit Compliance Tracking &amp; Resolution System &mdash; as of{' '}
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
                    <div className="max-w-5xl mx-auto">
                        <div style={{
                            width: '100%', borderCollapse: 'collapse', backgroundColor: 'white',
                            borderRadius: '8px', overflow: 'hidden',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                                <thead>
                                    <tr>
                                        {['Audit Engagement', 'Fully Complied (FC + BP)', 'Compliance Rate'].map((h, i) => (
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
                                    {loading ? (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                <p style={{ marginTop: '12px' }}>Loading IAsCARes data…</p>
                                            </td>
                                        </tr>
                                    ) : sorted.length > 0 ? sorted.map(row => {
                                        const pct = row.total > 0 ? Math.round((row.complied / row.total) * 100) : 0;
                                        return (
                                            <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                                                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                                    <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{row.engTitle}</p>
                                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0' }}>Updated: {row.lastUpdated}</p>
                                                </td>
                                                <td style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '1.125rem' }}>
                                                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{row.complied}</span>
                                                        <span style={{ color: '#94a3b8' }}>/</span>
                                                        <span style={{ color: '#475569', fontWeight: 500 }}>{row.total}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ flex: 1, backgroundColor: '#e2e8f0', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: getBarColor(pct), transition: 'width 0.5s ease-in-out' }} />
                                                        </div>
                                                        <span style={{ fontWeight: 700, color: getTextColor(pct), minWidth: '48px', textAlign: 'right' }}>{pct}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                No IAsCARes records found. Forms must be saved in the audit tool workspace first.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginTop: '20px', fontSize: '0.8rem', color: '#64748b' }}>
                            <span><strong style={{ color: '#10b981' }}>■</strong> ≥80% Fully Compliant</span>
                            <span><strong style={{ color: '#3b82f6' }}>■</strong> 50–79% Partial</span>
                            <span><strong style={{ color: '#f59e0b' }}>■</strong> &lt;50% Needs Attention</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
