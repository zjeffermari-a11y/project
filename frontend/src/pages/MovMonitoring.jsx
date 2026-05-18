import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutGrid, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import { useDataContext } from '../context/DataContext';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import { useDashboardActions } from '../hooks/useDashboardActions';
import api from '../api';

const MOV_CATEGORIES = [
    { key: 'control_environment',       label: 'Control Environment' },
    { key: 'risk_assessment',           label: 'Risk Assessment' },
    { key: 'control_activities',        label: 'Control Activities' },
    { key: 'initial_samples',           label: 'Initial samples based on PMR/APP' },
    { key: 'information_communication', label: 'Information and Communication' },
    { key: 'monitoring',                label: 'Monitoring' },
    { key: 'total_docs',                label: 'Total Documents Submitted Prior the discussion' },
    { key: 'additional_movs',           label: 'Additional MOVs' },
];

export default function MovMonitoring() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { refreshData } = useDataContext();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { handleLogout } = useDashboardActions(refreshData);

    const [categories, setCategories] = useState(null);
    const [engagementName, setEngagementName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = 'MOV Monitoring Dashboard | IAMS';
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [engRes, toolRes] = await Promise.allSettled([
                api.get(`/engagements/${id}`),
                api.get(`/engagements/${id}/tools/inventory`),
            ]);

            if (engRes.status === 'fulfilled') {
                setEngagementName(engRes.value.data?.title || `Engagement #${id}`);
            }

            if (toolRes.status === 'fulfilled' && toolRes.value.data?.form_data) {
                const fd = toolRes.value.data.form_data;
                setCategories({
                    control_environment:       parseInt(fd.controlEnvPct)    || 0,
                    risk_assessment:           parseInt(fd.riskAssessPct)    || 0,
                    control_activities:        parseInt(fd.controlActPct)    || 0,
                    initial_samples:           parseInt(fd.initialSamplePct) || 0,
                    information_communication: parseInt(fd.infoCommPct)      || 0,
                    monitoring:                parseInt(fd.monitoringPct)    || 0,
                    total_docs:                parseInt(fd.totalDocsPct)     || 0,
                    additional_movs:           parseInt(fd.additionalMovsPct)|| 0,
                });
            } else {
                setCategories(null);
            }
        } catch (_) {}
        setLoading(false);
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const navItems = [
        { icon: <LayoutGrid className="h-5 w-5" />, title: 'Dashboard', active: false, onClick: () => navigate('/') },
        { icon: <FileText className="h-5 w-5" />, title: 'MOV Monitor', active: true, onClick: () => {} }
    ];

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
                        <h1 className="text-xl font-bold text-slate-800">STATUS OF SUBMITTED MOVs PROCUREMENT</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Engagement Progress Overview — <span className="font-semibold text-slate-700">{engagementName}</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium text-sm rounded-lg hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 lg:p-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                    <div className="w-full">
                        {loading ? (
                            <div className="text-center py-10">
                                <p className="text-slate-500">Loading MOV data...</p>
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
                                        <th style={{
                                            width: '192px', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 10,
                                            boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)', color: '#475569', fontWeight: 600,
                                            textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0',
                                            textTransform: 'uppercase', fontSize: '0.70rem', letterSpacing: '0.05em', lineHeight: 1.2,
                                        }}>Audit Engagement</th>

                                        {MOV_CATEGORIES.map(cat => (
                                            <th key={cat.key} style={{
                                                backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600,
                                                textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0',
                                                textTransform: 'uppercase', fontSize: '0.70rem', letterSpacing: '0.05em', lineHeight: 1.2,
                                            }}>{cat.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories ? (
                                        <tr
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                                            style={{ borderBottom: '1px solid #e2e8f0' }}>

                                            <td style={{
                                                padding: '12px 16px', position: 'sticky', left: 0, backgroundColor: 'inherit',
                                                zIndex: 10, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)', fontWeight: 500,
                                                color: '#1e293b', whiteSpace: 'nowrap', verticalAlign: 'middle',
                                            }}>{engagementName}</td>

                                            {MOV_CATEGORIES.map(cat => {
                                                const pct = categories[cat.key];
                                                return (
                                                    <td key={cat.key} style={{
                                                        padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#1e293b',
                                                    }}>
                                                        {pct == null ? (
                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>N/A</span>
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{
                                                                    flex: 1, minWidth: '50px', backgroundColor: '#e2e8f0',
                                                                    borderRadius: '9999px', height: '10px', overflow: 'hidden',
                                                                }}>
                                                                    <div style={{
                                                                        width: `${pct}%`, height: '100%', backgroundColor: '#1f2937',
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
                                    ) : (
                                        <tr>
                                            <td colSpan={MOV_CATEGORIES.length + 1}
                                                style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                                                No MOV data available for this engagement.
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
