import React, { useState } from 'react';
import { X, Search, ChevronDown, Database, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ActiveAuditsModal({ 
    isOpen, 
    onClose, 
    engagements = [], 
    initialLoad 
}) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const navigate = useNavigate();

    if (!isOpen) return null;

    const filtered = engagements.filter(e => {
        const ongoingOnly = e.status !== 'completed' && e.status !== 'follow_up';
        if (!ongoingOnly) return false;
        if (activeTab !== 'all' && e.status !== activeTab) return false;

        if (!search) return true;
        const term = search.toLowerCase();
        return (
            e.title?.toLowerCase().includes(term) ||
            e.description?.toLowerCase().includes(term) ||
            e.ae_number?.toLowerCase().includes(term) ||
            e.auditee?.agency_name?.toLowerCase().includes(term) ||
            e.lead_auditor?.name?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/50 animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="px-12 py-8 border-b border-slate-100 bg-white shrink-0">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <nav className="flex text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 gap-2">
                                <span>Administrative Portal</span> <span className="text-slate-300">/</span>
                                <span className="text-indigo-600">Active Status</span>
                            </nav>
                            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                                Ongoing Audits
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                                    {engagements.filter(e => e.status !== 'completed' && e.status !== 'follow_up').length} Active
                                </span>
                            </h1>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-rose-500 transition-all bg-white hover:bg-rose-50 p-2.5 rounded-2xl border border-slate-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs Row */}
                    <div className="flex gap-2 mb-8">
                        {['all', 'planning', 'execution', 'reporting', 'follow_up'].map(tab => {
                            const count = tab === 'all'
                                ? engagements.filter(e => e.status !== 'completed' && e.status !== 'follow_up').length
                                : engagements.filter(e => e.status === tab).length;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === tab
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {tab.replace('_', '-')} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Bar */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by title, DO number, or lead..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-400 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-slate-50/50 p-12 relative">
                    {initialLoad && engagements.length === 0 ? (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-50/80 backdrop-blur-sm transition-opacity duration-500">
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                                <div className="flex flex-col items-center text-center">
                                    <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] animate-pulse">Synchronizing Workspace</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto space-y-8">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                    <Database className="w-10 h-10 opacity-20 mb-6" />
                                    <p className="font-black uppercase tracking-widest text-[11px]">No Matching Engagements</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {filtered.map(eng => {
                                        const engMovs = eng.movs || [];
                                        const endDate = eng.end_date ? new Date(eng.end_date) : null;
                                        const diffTime = endDate ? endDate - new Date() : 0;
                                        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                        const stages = ['planning', 'execution', 'reporting', 'follow_up'];
                                        const currentStageIndex = stages.indexOf(eng.status || 'planning');

                                        return (
                                            <div key={eng.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 transition-all shadow-sm hover:shadow-xl group relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="space-y-1">
                                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">{eng.title}</h3>
                                                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            <span>{eng.ae_number}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <span>{eng.auditee?.agency_name}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-100`}>
                                                        {eng.status || 'PLANNING'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 mb-8">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                        {eng.start_date} - {eng.end_date}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 lowercase">
                                                        • {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Timeline ended'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-12 mb-10">
                                                    <div className="space-y-2">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Engagement Lead</p>
                                                        <p className="text-xs font-black text-slate-700 italic">{eng.lead_auditor?.name || 'Unassigned'}</p>
                                                    </div>
                                                    <div className="space-y-2 border-l border-slate-100 pl-12">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Uploaded MOVs</p>
                                                        <p className="text-xs font-black text-slate-700">{engMovs.length} Files</p>
                                                    </div>
                                                    <div className="space-y-2 border-l border-slate-100 pl-12">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Created</p>
                                                        <p className="text-xs font-black text-slate-700">{new Date(eng.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                                                    <button
                                                        onClick={() => navigate('/auditor/workspace/' + eng.id)}
                                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-indigo-200"
                                                    >
                                                        Open audit <ArrowUpRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
