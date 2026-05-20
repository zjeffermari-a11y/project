import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, BarChart2, Filter, Download, RefreshCw } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { useDashboardActions } from '../hooks/useDashboardActions';
import api from '../api';

function getBarBg(pct) {
    if (pct >= 80) return '#10b981'; // emerald-500
    if (pct >= 50) return '#fbbf24'; // amber-400
    return '#f87171';                // red-400
}
function getTextColor(pct) {
    if (pct >= 80) return '#059669'; // emerald-600
    if (pct >= 50) return '#d97706'; // amber-500
    return '#ef4444';                // red-500
}

function initials(name = '') {
    return name
        .split(' ')
        .map(w => w[0] ?? '')
        .join('')
        .slice(0, 4)
        .toUpperCase();
}

export default function Aapes() {
    const navigate = useNavigate();
    const { engagements, loading: ctxLoading, refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { handleLogout } = useDashboardActions(refreshData);

    const [toolData, setToolData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'AAPIS Dashboard | IAMS';
    }, []);

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
                const total      = parseInt(fd.totalRecs)   || 0;
                const fully      = parseInt(fd.fullyImpl)   || 0;
                const partial    = parseInt(fd.partialImpl) || 0;
                const notImpl    = parseInt(fd.notImpl)     || 0;

                rows.push({
                    id: eng.id,
                    name: eng.title || `Engagement #${eng.id}`,
                    implemented: fully,
                    partiallyImpl: partial,
                    notImpl: notImpl,
                    total: total,
                });
            });
            setToolData(rows.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (_) {}
        setLoading(false);
    };

    useEffect(() => {
        if (!ctxLoading && engagements.length > 0) fetchAll();
        if (!ctxLoading && engagements.length === 0) setLoading(false);
    }, [engagements, ctxLoading]);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => navigate('/') },
        { icon: <BarChart2 className="h-5 w-5" />, title: 'AAPIS', active: true, onClick: () => {} }
    ];

    return (
        <div className="bg-slate-100 font-sans h-screen flex overflow-hidden">
            <DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <header className="bg-white border-b border-slate-200 px-10 py-5 shrink-0 z-10 flex justify-between items-center shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">AAPIS Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">Audit Action Plan and Implementation Status Overview</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchAll} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export Report
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                    <div className="max-w-6xl mx-auto">
                        <div style={{
                            width: '100%',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Audit Engagement', 'No. of Recommendations with Status', 'Progress'].map((h, i) => (
                                            <th key={h} style={{
                                                backgroundColor: '#f8fafc',
                                                color: '#475569',
                                                fontWeight: 600,
                                                textAlign: i === 1 ? 'center' : 'left',
                                                padding: '16px 24px',
                                                borderBottom: '2px solid #e2e8f0',
                                                textTransform: 'uppercase',
                                                fontSize: '0.75rem',
                                                letterSpacing: '0.05em',
                                                width: '33%',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {toolData.length > 0 ? toolData.map(row => {
                                        const pct = row.total > 0 ? Math.round((row.implemented / row.total) * 100) : 0;
                                        const barBg = getBarBg(pct);
                                        const textColor = getTextColor(pct);
                                        const acr = initials(row.name);
                                        return (
                                            <tr key={row.id}
                                                style={{ borderBottom: '1px solid #e2e8f0' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>

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
                                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>AAPIS Record</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                                                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{row.implemented}</span>
                                                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', marginBottom: '3px' }}>/ {row.total}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', marginTop: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                                                                <span style={{ color: '#475569' }}>FC: {row.implemented}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24', display: 'inline-block' }} />
                                                                <span style={{ color: '#475569' }}>PC: {row.partiallyImpl}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f87171', display: 'inline-block' }} />
                                                                <span style={{ color: '#475569' }}>NC: {row.notImpl}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', fontWeight: 500 }}>
                                                            <span style={{ color: textColor, fontWeight: 700 }}>{pct}%</span>
                                                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Completion Rate</span>
                                                        </div>
                                                        <div style={{
                                                            width: '100%', backgroundColor: '#e2e8f0',
                                                            borderRadius: '9999px', height: '8px', overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${pct}%`, height: '100%',
                                                                backgroundColor: barBg,
                                                                transition: 'width 0.5s ease-in-out'
                                                            }} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                {loading ? 'Loading AAPIS data...' : 'No AAPIS data available.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginTop: '24px', fontSize: '0.875rem', color: '#475569' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: 700 }}>FC:</span> Fully Complied</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: 700 }}>PC:</span> Partially Complied</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontWeight: 700 }}>NC:</span> Non Compliance</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
