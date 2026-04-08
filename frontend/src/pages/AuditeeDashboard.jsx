import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { X, CheckCircle, Clock, RotateCcw, FileText, AlertCircle, Folder, Bell, RefreshCw } from 'lucide-react';
import iamsLogo from '../assets/IAMS logo.png';
import LogoutOverlay from '../components/ui/LogoutOverlay';
import PageTransition from '../components/ui/PageTransition';
import { useDataContext } from '../context/DataContext';

export default function AuditeeDashboard() {
    const { 
        engagements, 
        loading,
        initialLoad, 
        refreshData,
        updateMovStatusOptimistic
    } = useDataContext();

    // Modal & Tab State
    const [uploadMovId, setUploadMovId] = useState(null);
    const [uploadEngId, setUploadEngId] = useState(null);
    const [uploadMovName, setUploadMovName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [managementComment, setManagementComment] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const hasCheckedSmartDefault = useRef(false);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};

    // Calculate dynamic data
    let totalMovs = 0;
    let submittedMovsCount = 0;
    const pendingTasks = [];
    const recentSubmissions = [];
    let currentEngagement = 'No Active Engagement';
    let currentEngagementStatus = 'planning';

    // Ongoing audit: all engagements with my MOVs grouped
    const ongoingAudits = [];
    // Follow-up: completed/follow_up engagements with compliance rate
    const followUpAudits = [];

    engagements.forEach(eng => {
        const myMovs = eng.movs?.filter(m => m.auditee_id === user.id) || [];
        if (myMovs.length > 0) {
            currentEngagement = `${eng.title} (${eng.start_date || 'TBD'})`;
            currentEngagementStatus = eng.status || 'planning';

            // Build per-engagement MOV status list
            const total = myMovs.length;
            const approved = myMovs.filter(m => m.status === 'approved').length;
            const submitted = myMovs.filter(m => m.status === 'submitted').length;
            const returned = myMovs.filter(m => m.status === 'returned').length;
            const pending = myMovs.filter(m => m.status === 'pending').length;
            const compRate = total === 0 ? 0 : Math.round((approved / total) * 100);

            if (['completed', 'follow_up'].includes(eng.status)) {
                followUpAudits.push({ eng, myMovs, total, approved, compRate });
            } else {
                ongoingAudits.push({ eng, myMovs, total, approved, submitted, returned, pending });
            }
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

    useEffect(() => {
        document.title = 'Internal Audit Management | Auditee Portal';
    }, []);

    // Smart Default: If pending actions exist, prioritizes Ongoing Audits
    useEffect(() => {
        if (!initialLoad && !hasCheckedSmartDefault.current) {
            if (pendingTasks.length > 0) {
                setActiveTab('ongoing');
            }
            hasCheckedSmartDefault.current = true;
        }
    }, [initialLoad, pendingTasks.length]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try { await api.post('/logout'); } catch (e) { }
        setTimeout(() => {
            localStorage.clear();
            navigate('/login');
        }, 1200);
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
            
            // Optimistically update the status to 'submitted'
            await updateMovStatusOptimistic(uploadMovId, 'submitted');

            setUploadMovId(null);
            setUploadEngId(null);
            setUploadMovName('');
            setSelectedFile(null);
            setManagementComment('');
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };


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

    const normalizedStatus = currentEngagementStatus === 'in_review' ? 'execution' : currentEngagementStatus;
    const currentPhaseConfig = PHASES[normalizedStatus] || PHASES.planning;

    const getMovStatusConfig = (status) => {
        switch (status) {
            case 'approved': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle className="w-3 h-3" />, label: 'Approved' };
            case 'submitted': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock className="w-3 h-3" />, label: 'Pending Review' };
            case 'returned': return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: <RotateCcw className="w-3 h-3" />, label: 'Returned' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: <AlertCircle className="w-3 h-3" />, label: 'Pending' };
        }
    };

    return (
        <PageTransition className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans relative">
            <LogoutOverlay isOpen={isLoggingOut} userName={user?.name} />
            <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 shadow-xl z-20 shrink-0">
                <div className="mb-8">
                    <img src={iamsLogo} className="w-12 h-12 object-contain drop-shadow-sm" alt="IAMS Logo" />
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
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-emerald-50 text-emerald-700 font-black uppercase tracking-widest text-[10px] px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    Auditee Portal
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Compliance Hub</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Hi, {user.name}</h1>
                                <button 
                                    onClick={refreshData}
                                    disabled={loading}
                                    className={`p-2 rounded-xl transition-all ${loading ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                    title="Force Synchronize"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mt-2">Current Engagement: <span className="text-emerald-600">{currentEngagement}</span></p>
                        </div>
                        <div className="flex flex-col items-end gap-4">
                            <div className="flex items-center gap-6">
                                {initialLoad && (
                                    <div className="flex items-center gap-3 bg-emerald-900 border border-emerald-700 px-4 py-2 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                        <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Synchronizing</span>
                                    </div>
                                )}
                                <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                    <Bell className="w-6 h-6" />
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">3</span>
                                </button>
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

                            {/* Tab Navigation */}
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button 
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Overview
                                </button>
                                <button 
                                    onClick={() => setActiveTab('ongoing')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ongoing' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Ongoing Audits ({ongoingAudits.length})
                                </button>
                                <button 
                                    onClick={() => setActiveTab('follow-up')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'follow-up' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Follow-up ({followUpAudits.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 py-8">
                    {initialLoad ? (
                        <div className="flex justify-center items-center h-full text-slate-400 font-bold">Loading dashboard...</div>
                    ) : (
                        <div className="max-w-7xl mx-auto space-y-8 pb-10">
                            {/* KPI Cards */}
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
                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ongoing Audits</p>
                                    <p className="text-2xl font-black text-slate-800">{ongoingAudits.length}</p>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                    <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-4">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Actions Required</p>
                                    <p className="text-2xl font-black text-slate-800">{pendingTasks.length}</p>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                                        <CheckCircle className="h-5 w-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Follow-up Phase</p>
                                    <p className="text-2xl font-black text-slate-800">{followUpAudits.length}</p>
                                </div>
                            </div>

                            <div className="space-y-8 pb-10">
                                {/* Tab: Overview */}
                                {(activeTab === 'overview' || activeTab === 'ongoing') && (
                                    <>
                                        {/* Action Required */}
                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                                    <AlertCircle className="h-5 w-5 text-indigo-500" />
                                                    Actions & Submissions Required
                                                </h2>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority Checklist</span>
                                            </div>
                                            <div className="divide-y divide-slate-100">
                                                {pendingTasks.length === 0 ? (
                                                    <div className="p-10 text-center text-slate-400 font-semibold italic">No actions currently required. All caught up!</div>
                                                ) : pendingTasks.map((task, idx) => (
                                                    <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className={`mt-1 w-5 h-5 rounded border-2 border-slate-300 flex-shrink-0 ${task.urgent ? 'border-rose-300 bg-rose-50' : ''}`}></div>
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
                                                            Upload MOV
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Tab: Ongoing Audits */}
                                {activeTab === 'ongoing' && (
                                    ongoingAudits.length > 0 ? (
                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="px-6 py-5 border-b border-slate-100 bg-emerald-50/50">
                                                <h2 className="text-sm font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-emerald-500" />
                                                    Active Monitoring – Ongoing Audits
                                                </h2>
                                                <p className="text-xs text-emerald-600 font-bold mt-1">Live status of your MOV submissions per engagement.</p>
                                            </div>
                                            {ongoingAudits.map(({ eng, myMovs, total, approved, submitted, returned, pending }) => (
                                                <div key={eng.id} className="px-6 py-8 border-b border-slate-100 last:border-b-0">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-amber-200">Active engagement</span>
                                                                <span className="text-xs font-bold text-slate-400">{eng.start_date || 'TBD'}</span>
                                                            </div>
                                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{eng.title}</h3>
                                                            <div className="mt-4 flex gap-2">
                                                                <button onClick={() => navigate(`/auditor/workspace/${eng.id}`)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2">
                                                                    <Folder className="w-4 h-4" /> Open Masterfile
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                            <div className="flex flex-col items-center"><span className="text-xl font-black text-emerald-600">{approved}</span><span className="text-[9px] text-slate-400 font-black uppercase">Approved</span></div>
                                                            <div className="flex flex-col items-center"><span className="text-xl font-black text-amber-500">{submitted}</span><span className="text-[9px] text-slate-400 font-black uppercase">Reviewing</span></div>
                                                            <div className="flex flex-col items-center"><span className="text-xl font-black text-rose-500">{returned}</span><span className="text-[9px] text-slate-400 font-black uppercase">Returned</span></div>
                                                            <div className="flex flex-col items-center"><span className="text-xl font-black text-slate-400">{pending}</span><span className="text-[9px] text-slate-400 font-black uppercase">Pending Sub.</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {myMovs.map(mov => {
                                                            const cfg = getMovStatusConfig(mov.status);
                                                            return (
                                                                <div key={mov.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white border border-slate-100 hover:border-emerald-200 transition-colors shadow-sm">
                                                                    <span className="text-xs font-bold text-slate-700 truncate pr-4">{mov.requirement_name}</span>
                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border} shrink-0`}>
                                                                        {cfg.icon}{cfg.label}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-20 text-center">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-slate-800 font-black uppercase tracking-tight">No Ongoing Audits</h3>
                                            <p className="text-slate-400 text-sm font-medium mt-1">You currently have no active audit engagements in progress.</p>
                                        </div>
                                    )
                                )}

                                {/* Tab: Follow-up */}
                                {activeTab === 'follow-up' && (
                                    followUpAudits.length > 0 ? (
                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="px-6 py-5 border-b border-slate-100 bg-rose-50/50">
                                                <h2 className="text-sm font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
                                                    <CheckCircle className="h-5 w-5 text-rose-500" />
                                                    Historical & Follow-up Phased Audits
                                                </h2>
                                                <p className="text-xs text-rose-600 font-bold mt-1">Summary of past performance and ongoing follow-up monitoring.</p>
                                            </div>
                                            <div className="divide-y divide-slate-100">
                                                {followUpAudits.map(({ eng, total, approved, compRate }) => (
                                                    <div key={eng.id} className="px-6 py-8 hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h3 className="text-lg font-black text-slate-800 tracking-tight">{eng.title}</h3>
                                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                                    <span>{approved} / {total} MOVs Cleared</span>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                    <span className={`${eng.status === 'completed' ? 'text-emerald-600' : 'text-rose-600'}`}>{eng.status === 'completed' ? 'Completed' : 'Follow-up Monitoring'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`text-3xl font-black ${compRate === 100 ? 'text-emerald-600' : compRate >= 75 ? 'text-amber-500' : 'text-rose-600'}`}>{compRate}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-3">
                                                            <div
                                                                className={`h-3 rounded-full transition-all duration-1000 ${compRate === 100 ? 'bg-emerald-500' : compRate >= 75 ? 'bg-amber-400' : 'bg-rose-400'} shadow-sm`}
                                                                style={{ width: `${compRate}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-20 text-center">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-slate-800 font-black uppercase tracking-tight">No Follow-up History</h3>
                                            <p className="text-slate-400 text-sm font-medium mt-1">There are no completed or follow-up phase audits for your office yet.</p>
                                        </div>
                                    )
                                )}

                                {/* Tab: Overview Sub-sections */}
                                {activeTab === 'overview' && (
                                    <>
                                        {/* Recent Submissions */}
                                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">Recent Activity Status</h2>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requirement Item</th>
                                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Submitted</th>
                                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {recentSubmissions.length === 0 ? (
                                                            <tr><td colSpan="3" className="p-10 text-center text-slate-400 text-sm font-medium italic">No recent submission activity.</td></tr>
                                                        ) : recentSubmissions.map((sub, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                                <td className="p-4 text-xs font-bold text-slate-700">{sub.name}</td>
                                                                <td className="p-4 text-xs text-slate-500 font-medium text-center">{sub.date}</td>
                                                                <td className="p-4 text-right">
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
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Upload / Take Action Modal */}
                {uploadMovId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800">Upload Requirement (MOV)</h3>
                                <button onClick={() => { setUploadMovId(null); setSelectedFile(null); setUploadMovName(''); setManagementComment(''); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUpload} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Select Document</label>
                                    <input type="file" required onChange={e => setSelectedFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Management Comment <span className="text-slate-400 font-bold text-xs normal-case tracking-normal">(optional)</span></label>
                                    <textarea
                                        value={managementComment}
                                        onChange={e => setManagementComment(e.target.value)}
                                        placeholder="Enter your office's management response or comment regarding this requirement..."
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                    />
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setUploadMovId(null); setSelectedFile(null); setUploadMovName(''); setManagementComment(''); }} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" disabled={uploading} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-colors">
                                        {uploading ? 'Uploading...' : 'Submit Requirement'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </PageTransition>
    );
}
