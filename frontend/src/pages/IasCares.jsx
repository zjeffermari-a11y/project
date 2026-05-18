import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutGrid, Heart, ArrowLeft, RefreshCw } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { useDashboardActions } from '../hooks/useDashboardActions';
import api from '../api';

function getBarColor(pct) {
    if (pct >= 80) return '#10b981'; // emerald-500
    if (pct >= 50) return '#3b82f6'; // blue-500
    return '#f59e0b'; // amber-500
}

export default function IasCares() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { handleLogout } = useDashboardActions(refreshData);

    const [toolData, setToolData] = useState(null);
    const [engagementName, setEngagementName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'IAsCARes Dashboard | IAMS';
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [engRes, toolRes] = await Promise.allSettled([
                api.get(`/engagements/${id}`),
                api.get(`/engagements/${id}/tools/iascares`),
            ]);

            if (engRes.status === 'fulfilled') {
                setEngagementName(engRes.value.data?.title || `Engagement #${id}`);
            }

            if (toolRes.status === 'fulfilled' && toolRes.value.data?.form_data) {
                const fd = toolRes.value.data.form_data;
                const totalNo = parseInt(fd.totalNo) || 0;
                const fcNo    = parseInt(fd.fcNo)    || 0;
                const bpNo    = parseInt(fd.bpNo)    || 0;
                setToolData({ complied: fcNo + bpNo, total: totalNo });
            } else {
                setToolData(null);
            }
        } catch (_) {}
        setLoading(false);
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => navigate('/') },
        { icon: <Heart className="h-5 w-5" />, title: 'IAsCARes', active: true, onClick: () => {} }
    ];

    const pct = toolData && toolData.total > 0 ? Math.round((toolData.complied / toolData.total) * 100) : 0;
    const barColor = getBarColor(pct);

    return (
        <div className="bg-slate-50 font-sans h-screen flex overflow-hidden">
            <DashboardSidebar user={user} navItems={navItems} onLogout={handleLogout} />

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-10 py-5 shrink-0 z-10 flex justify-between items-center shadow-sm">
                    <div>
                        <button
                            onClick={() => navigate(`/auditor/workspace/${id}`)}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold mb-1 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Workspace
                        </button>
                        <h1 className="text-xl font-bold text-slate-800">IAsCARes Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Audit Compliance Tracking &amp; Resolution System — <span className="font-semibold text-slate-700">{engagementName}</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                    <div className="max-w-5xl mx-auto">
                        <div style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600,
                                            textAlign: 'left', padding: '16px 24px', borderBottom: '2px solid #e2e8f0',
                                            textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em',
                                            width: '33%'
                                        }}>Audit Engagement</th>
                                        <th style={{
                                            backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600,
                                            textAlign: 'center', padding: '16px 24px', borderBottom: '2px solid #e2e8f0',
                                            textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em',
                                            width: '33%'
                                        }}>Fully Complied Recommendations</th>
                                        <th style={{
                                            backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600,
                                            textAlign: 'left', padding: '16px 24px', borderBottom: '2px solid #e2e8f0',
                                            textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em',
                                            width: '33%'
                                        }}>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                Loading IAsCARes data...
                                            </td>
                                        </tr>
                                    ) : toolData ? (
                                        <tr style={{ borderBottom: '1px solid #e2e8f0', cursor: 'default' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                                            <td style={{ padding: '16px 24px', color: '#1e293b', verticalAlign: 'middle' }}>
                                                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{engagementName}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: '#1e293b', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '1.125rem' }}>
                                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{toolData.complied}</span>
                                                    <span style={{ color: '#94a3b8' }}>/</span>
                                                    <span style={{ color: '#475569', fontWeight: 500 }}>{toolData.total}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: '#1e293b', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{
                                                        flex: 1, backgroundColor: '#e2e8f0', borderRadius: '9999px',
                                                        height: '10px', overflow: 'hidden', display: 'flex'
                                                    }}>
                                                        <div style={{
                                                            width: `${pct}%`, height: '100%',
                                                            backgroundColor: barColor,
                                                            transition: 'width 0.5s ease-in-out'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontWeight: 700, color: '#334155', minWidth: '48px', textAlign: 'right' }}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                No IAsCARes data available for this engagement.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
