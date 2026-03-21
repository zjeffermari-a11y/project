import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { X } from 'lucide-react';

export default function AuditeeDashboard() {
    const [engagements, setEngagements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [uploadMovId, setUploadMovId] = useState(null);
    const [uploadEngId, setUploadEngId] = useState(null);
    const [uploadMovName, setUploadMovName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/engagements');
            setEngagements(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try { await api.post('/logout'); } catch (e) { }
        localStorage.clear();
        navigate('/login');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert('Please select a file');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('engagement_id', uploadEngId);
        formData.append('document_type', uploadMovName || 'MOV Submission');
        formData.append('phase', 'execution');

        try {
            setUploading(true);
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await api.patch(`/movs/${uploadMovId}/status`, { status: 'submitted' });

            setUploadMovId(null);
            setUploadEngId(null);
            setUploadMovName('');
            setSelectedFile(null);
            fetchData();
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    const [uploading, setUploading] = useState(false);

    // Calculate dynamic data
    let totalMovs = 0;
    let submittedMovsCount = 0;
    const pendingTasks = [];
    const recentSubmissions = [];
    let currentEngagement = 'No Active Engagement';

    let currentEngagementStatus = 'planning';

    engagements.forEach(eng => {
        const myMovs = eng.movs?.filter(m => m.auditee_id === user.id) || [];
        if (myMovs.length > 0) {
            currentEngagement = `${eng.title} (${eng.start_date || 'TBD'})`;
            currentEngagementStatus = eng.status || 'planning';
        }

        myMovs.forEach(mov => {
            totalMovs++;
            if (mov.status === 'submitted' || mov.status === 'approved') {
                submittedMovsCount++;
                recentSubmissions.push({
                    name: mov.requirement_name,
                    date: new Date(mov.updated_at).toLocaleDateString(),
                    status: mov.status === 'approved' ? 'Approved' : 'Pending Review'
                });
            } else {
                pendingTasks.push({
                    id: mov.id,
                    engId: eng.id,
                    title: mov.requirement_name,
                    type: mov.status === 'returned' ? 'Returned for Revision' : 'Initial MOV',
                    due: eng.end_date || 'TBD',
                    urgent: mov.status === 'returned'
                });
            }
        });
    });

    const complianceRate = totalMovs === 0 ? 0 : Math.round((submittedMovsCount / totalMovs) * 100);

    const PHASES = {
        planning: { index: 0, label: 'Audit Planning', text: 'ANM, MOVs generated.', activeText: 'Auditors are currently planning the audit schedule and requirements.',
            badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-200', badgeText: 'text-emerald-700', ping: 'bg-emerald-400', dot: 'bg-emerald-500', ring: 'ring-emerald-100', title: 'text-emerald-600', boxBg: 'bg-emerald-50', boxText: 'text-emerald-800', boxBorder: 'border-emerald-100'
        },
        execution: { index: 1, label: 'Audit Execution', text: 'Walkthroughs, Testing.', activeText: 'Auditors are currently reviewing requested MOVs and scheduling testing.',
            badgeBg: 'bg-amber-50', badgeBorder: 'border-amber-200', badgeText: 'text-amber-700', ping: 'bg-amber-400', dot: 'bg-amber-500', ring: 'ring-amber-100', title: 'text-amber-600', boxBg: 'bg-amber-50', boxText: 'text-amber-800', boxBorder: 'border-amber-100'
        },
        reporting: { index: 2, label: 'Audit Reporting', text: 'Drafting of IAR.', activeText: 'Auditors are drafting the internal audit report based on findings.',
            badgeBg: 'bg-indigo-50', badgeBorder: 'border-indigo-200', badgeText: 'text-indigo-700', ping: 'bg-indigo-400', dot: 'bg-indigo-500', ring: 'ring-indigo-100', title: 'text-indigo-600', boxBg: 'bg-indigo-50', boxText: 'text-indigo-800', boxBorder: 'border-indigo-100'
        },
        follow_up: { index: 3, label: 'Audit Follow Up', text: 'Action Plan Status.', activeText: 'Monitoring compliance to recommendations.',
            badgeBg: 'bg-rose-50', badgeBorder: 'border-rose-200', badgeText: 'text-rose-700', ping: 'bg-rose-400', dot: 'bg-rose-500', ring: 'ring-rose-100', title: 'text-rose-600', boxBg: 'bg-rose-50', boxText: 'text-rose-800', boxBorder: 'border-rose-100'
        },
        completed: { index: 4, label: 'Completed', text: 'Audit Finished.', activeText: 'This engagement has been officially concluded.',
            badgeBg: 'bg-slate-100', badgeBorder: 'border-slate-300', badgeText: 'text-slate-700', ping: 'bg-slate-400', dot: 'bg-emerald-500', ring: 'ring-emerald-100', title: 'text-emerald-600', boxBg: 'bg-emerald-50', boxText: 'text-emerald-800', boxBorder: 'border-emerald-100'
        },
    };

    // Normalize from specific edge cases and grab the config
    const normalizedStatus = currentEngagementStatus === 'in_review' ? 'execution' : currentEngagementStatus;
    const currentPhaseConfig = PHASES[normalizedStatus] || PHASES.planning;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
            <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 shadow-xl z-20 shrink-0">
                <div className="mb-8">
                    <img src="/IAMS logo.png" className="w-12 h-12 object-contain drop-shadow-sm" alt="IAMS Logo" />
                </div>
                <img src={`https://ui-avatars.com/api/?name=${user.agency_name}&background=10b981&color=fff`} className="w-10 h-10 rounded-xl mb-4 border border-slate-700" title={user.agency_name} alt="Profile" />
                <nav className="flex-1 flex flex-col gap-4 mt-4">
                    <a href="#" className="p-3 text-white bg-slate-800 rounded-xl transition-all relative group" title="Dashboard">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    </a>
                </nav>
                <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all" title="Logout">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
                <header className="bg-white border-b border-slate-200 px-10 py-8 shrink-0 z-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-200">Auditee Portal</span>
                                <span className="text-xs font-bold text-slate-400">{user.agency_name}</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Welcome, {user.name}</h1>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Office Compliance Dashboard</h2>
                            <p className="text-sm font-semibold text-slate-500 mt-2">Current Engagement: <span className="text-emerald-600">{currentEngagement}</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Phase</p>
                            <div className={`flex items-center gap-2 ${currentPhaseConfig.badgeBg} border ${currentPhaseConfig.badgeBorder} px-4 py-2 rounded-xl ${currentPhaseConfig.badgeText}`}>
                                {currentEngagementStatus !== 'completed' && (
                                    <span className="relative flex h-3 w-3">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentPhaseConfig.ping} opacity-75`}></span>
                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${currentPhaseConfig.dot}`}></span>
                                    </span>
                                )}
                                <span className="text-sm font-bold">{currentPhaseConfig.label}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 py-8">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-slate-400 font-bold">Loading dashboard...</div>
                    ) : (
                        <div className="max-w-7xl mx-auto space-y-8 pb-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">MOV Compliance</p>
                                        <p className="text-3xl font-black text-emerald-600">{complianceRate}%</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-full border-4 border-emerald-100 flex items-center justify-center relative ml-auto z-10">
                                        <svg className="w-full h-full text-emerald-500 absolute top-0 left-0 transform -rotate-90" viewBox="0 0 36 36">
                                            <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            <path className="text-emerald-500" strokeDasharray={`${complianceRate}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        </svg>
                                    </div>
                                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-50 rounded-full opacity-50"></div>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                    <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Actions</p>
                                    <p className="text-2xl font-black text-slate-800">{pendingTasks.length}</p>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted MOVs</p>
                                    <p className="text-2xl font-black text-slate-800">{submittedMovsCount} <span className="text-xs font-bold text-slate-400 ml-1">/ {totalMovs} Required</span></p>
                                </div>

                                <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Next Deadline</p>
                                        <p className="text-2xl font-black mb-1">Approaching</p>
                                        <p className="text-xs text-slate-300 font-bold">Please check tasks</p>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 absolute -right-4 -bottom-4 text-white opacity-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" /></svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                                Action Required
                                            </h2>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {pendingTasks.length === 0 ? (
                                                <div className="p-10 text-center text-slate-400 font-semibold italic">No actions currently required.</div>
                                            ) : pendingTasks.map((task, idx) => (
                                                <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="mt-1 w-5 h-5 rounded border-2 border-slate-300 flex-shrink-0"></div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-slate-800">{task.title}</h3>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{task.type}</span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                <span className={`text-xs font-bold ${task.urgent ? 'text-rose-600' : 'text-slate-500'}`}>
                                                                    Due: <span>{task.due}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => { setUploadMovId(task.id); setUploadEngId(task.engId); setUploadMovName(task.title); }} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm whitespace-nowrap">
                                                        Take Action
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                                            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Recent Submissions Status</h2>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requirement Name</th>
                                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted</th>
                                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {recentSubmissions.length === 0 ? (
                                                        <tr><td colSpan="3" className="p-6 text-center text-slate-400 text-sm">No recent submissions.</td></tr>
                                                    ) : recentSubmissions.map((sub, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-4 text-xs font-bold text-slate-700">{sub.name}</td>
                                                            <td className="p-4 text-xs text-slate-500 font-medium">{sub.date}</td>
                                                            <td className="p-4">
                                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${sub.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                                        sub.status === 'Pending Review' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                            'bg-rose-50 text-rose-600 border-rose-200'
                                                                    }`}>{sub.status}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                                        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-6">Audit Lifecycle</h2>
                                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                                            {Object.entries(PHASES).map(([key, config]) => {
                                                const isActive = normalizedStatus === key;
                                                const isPast = config.index < currentPhaseConfig.index;
                                                const isFuture = config.index > currentPhaseConfig.index;
                                                
                                                let dotClass = 'bg-slate-200 border-white';
                                                let titleClass = 'text-slate-400';
                                                if (isActive) {
                                                    dotClass = `${config.dot} border-white ring-2 ${config.ring} shadow-sm`;
                                                    titleClass = config.title;
                                                } else if (isPast) {
                                                    dotClass = `bg-emerald-500 border-white ring-2 ring-emerald-100 shadow-sm`;
                                                    titleClass = 'text-emerald-600';
                                                }

                                                return (
                                                    <div key={key} className="relative pl-6">
                                                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${dotClass}`}>
                                                            {isActive && currentEngagementStatus !== 'completed' && (
                                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.ping} opacity-75`}></span>
                                                            )}
                                                        </div>
                                                        <h3 className={`text-xs font-black uppercase tracking-widest ${titleClass}`}>
                                                            {config.label.replace('Audit ', '')}
                                                        </h3>
                                                        {!isFuture && (
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1">{config.text}</p>
                                                        )}
                                                        {isActive && (
                                                            <div className={`mt-3 p-3 ${config.boxBg} border ${config.boxBorder} rounded-xl text-xs ${config.boxText} font-medium leading-relaxed`}>
                                                                {config.activeText}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {uploadMovId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800">Upload Requirement (MOV)</h3>
                                <button onClick={() => { setUploadMovId(null); setSelectedFile(null); setUploadMovName(''); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUpload} className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Select Document</label>
                                    <input type="file" required onChange={e => setSelectedFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl focus:outline-none" />
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setUploadMovId(null); setSelectedFile(null); setUploadMovName(''); }} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" disabled={uploading} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-colors">
                                        {uploading ? 'Uploading...' : 'Submit Requirement'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
