import React from 'react';
import { Database, FileText, Trash2 } from 'lucide-react';

export default function EngagementTable({ 
    engagements = [], 
    onRowClick, 
    onDelete, 
    isLoading, 
    filterActive = false 
}) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading && engagements.length === 0 ? (
                <div className="p-16 flex justify-center text-slate-400 font-bold animate-pulse">
                    Synchronizing audit directory...
                </div>
            ) : engagements.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm font-black uppercase tracking-widest">
                        {filterActive ? 'No matching engagements' : 'No active engagements'}
                    </p>
                </div>
            ) : (
                <table className="min-w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                            <th className="pb-4 pt-4 pl-8 font-black">Engagement Title</th>
                            <th className="pb-4 pt-4 font-black">Timeline</th>
                            <th className="pb-4 pt-4 font-black">Status</th>
                            <th className="pb-4 pt-4 font-black">Compliance</th>
                            <th className="pb-4 pt-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {engagements.map(eng => {
                            const movs = eng.movs || [];
                            const total = movs.length;
                            const sub = movs.filter(m => m.status === 'submitted' || m.status === 'approved').length;

                            return (
                                <tr 
                                    key={eng.id} 
                                    onClick={() => onRowClick && onRowClick(eng.id)} 
                                    className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                                >
                                    <td className="p-5 pl-8">
                                        <div className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {eng.title}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1 truncate max-w-xs">
                                            {eng.ae_number || 'DO-2026-XXX'} • {eng.type_of_audit || 'Compliance Management'} • {eng.description || 'No description'}
                                        </div>
                                    </td>
                                    <td className="p-5 text-xs font-bold text-slate-600 whitespace-nowrap">
                                        {eng.start_date || 'TBD'} → {eng.end_date || 'TBD'}
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                            eng.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            eng.status === 'follow_up' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                            eng.status === 'reporting' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                            eng.status === 'execution' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                            'bg-indigo-50 text-indigo-600 border-indigo-200'
                                        }`}>
                                            {eng.status === 'follow_up' ? 'Concluded Phase' : (eng.status || 'planning').replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="py-5 text-xs font-black text-slate-700 tracking-widest">
                                        {total === 0 ? (
                                            <span className="text-slate-400 italic">0 MOVs</span>
                                        ) : (
                                            <><span className="text-emerald-600">{sub}</span> / {total}</>
                                        )}
                                    </td>
                                    <td className="w-10 pr-6">
                                        {onDelete && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDelete(eng.id); }} 
                                                className="text-slate-300 hover:text-rose-500 transition-colors p-2" 
                                                title="Delete Audit"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}
