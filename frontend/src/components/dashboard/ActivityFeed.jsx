import React from 'react';
import { Clock } from 'lucide-react';

export default function ActivityFeed({ activities = [], onViewHistory, onActivityClick }) {
    return (
        <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col h-full h-min-80">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent Activity
            </h3>

            <div className="space-y-4 flex-1">
                {activities.map((act, idx) => (
                    <div 
                        key={act.id || idx} 
                        onClick={() => onActivityClick && onActivityClick(act)} 
                        className="border-b border-indigo-800/50 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-white/5 transition-colors group"
                    >
                        <p className="text-[10px] text-indigo-200 mb-1 group-hover:text-white transition-colors">
                            <span className="font-bold text-white">{act.user}</span> {act.action.toLowerCase()}
                        </p>
                        <p className="text-sm font-bold text-white truncate" title={act.title}>
                            {act.title}
                        </p>
                        <p className="text-[9px] text-indigo-400 font-medium mt-1 uppercase tracking-widest">
                            {act.date.toLocaleString()}
                        </p>
                    </div>
                ))}
                
                {activities.length === 0 && (
                    <div className="text-center text-indigo-300 text-xs py-10 italic">
                        No recent activity recorded.
                    </div>
                )}
            </div>

            <button 
                onClick={onViewHistory} 
                className="w-full mt-6 py-3 px-4 border border-indigo-500 hover:bg-indigo-800 text-indigo-100 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-colors shrink-0"
            >
                View Full History
            </button>
        </div>
    );
}
