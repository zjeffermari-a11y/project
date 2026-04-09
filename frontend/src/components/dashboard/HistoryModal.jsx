import React from 'react';
import { X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HistoryModal({ 
    isOpen, 
    onClose, 
    activities = [] 
}) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden my-8 border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="px-10 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <nav className="flex text-xs text-slate-400 font-bold uppercase tracking-widest mb-2 gap-2">
                            <span>Dashboards</span> <span>/</span>
                            <span className="text-indigo-600">Audit Trail</span>
                        </nav>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Full Activity Log</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-0 max-h-[60vh] overflow-y-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                            <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                                <th className="px-10 py-4">Event Type</th>
                                <th className="px-10 py-4">Action Details</th>
                                <th className="px-10 py-4">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {activities.map((act, idx) => (
                                <tr 
                                    key={act.id || idx} 
                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        if (act.engagementId) {
                                            navigate('/auditor/workspace/' + act.engagementId);
                                            onClose();
                                        }
                                    }}
                                >
                                    <td className="px-10 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${
                                                act.type === 'engagement' ? 'bg-indigo-50 text-indigo-600' :
                                                act.type === 'mov' ? 'bg-amber-50 text-amber-600' :
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{act.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-5">
                                        <div className="text-sm font-black text-slate-800">{act.title}</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">{act.user} {act.action.toLowerCase()} this resource</div>
                                    </td>
                                    <td className="px-10 py-5 text-xs text-slate-500 font-bold">
                                        {act.date.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {activities.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                        No activity logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg">
                        Close Audit Trail
                    </button>
                </div>
            </div>
        </div>
    );
}
