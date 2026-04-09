import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function StatCard({ 
    label, 
    value, 
    icon: Icon, 
    color = 'indigo', 
    onClick, 
    subValue, 
    progress 
}) {
    const colorClasses = {
        indigo: {
            bg: 'bg-indigo-50',
            text: 'text-indigo-600',
            border: 'border-indigo-300',
            iconBg: 'bg-indigo-100',
            progressBg: 'bg-indigo-50'
        },
        emerald: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-500',
            border: 'border-emerald-300',
            iconBg: 'bg-emerald-100',
            progressBg: 'bg-emerald-50'
        },
        amber: {
            bg: 'bg-amber-50',
            text: 'text-amber-500',
            border: 'border-amber-300',
            iconBg: 'bg-amber-100',
            progressBg: 'bg-amber-50'
        },
        rose: {
            bg: 'bg-rose-50',
            text: 'text-rose-500',
            border: 'border-rose-300',
            iconBg: 'bg-rose-100',
            progressBg: 'bg-rose-50'
        },
        dark: {
            bg: 'bg-slate-900',
            text: 'text-white',
            border: 'border-indigo-800',
            iconBg: 'bg-indigo-900',
            progressBg: 'bg-white/5'
        }
    };

    const colors = colorClasses[color] || colorClasses.indigo;

    return (
        <div
            onClick={onClick}
            className={`p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden transition-all group ${onClick ? 'cursor-pointer hover:border-indigo-300' : ''} ${color === 'dark' ? 'bg-indigo-900 border-indigo-800 shadow-lg hover:bg-slate-900' : 'bg-white'}`}
        >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform ${colors.progressBg}`}></div>
            
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 relative z-10 ${color === 'dark' ? 'text-indigo-300' : 'text-slate-400'}`}>
                {label}
            </p>
            
            <div className="flex items-end gap-2 relative z-10">
                <p className={`text-4xl font-black tracking-tight ${color === 'dark' ? 'text-white' : colors.text}`}>
                    {value}
                </p>
                {subValue && (
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">{subValue}</p>
                )}
            </div>

            {progress && (
                <div className="mt-4 flex items-center justify-between relative z-10">
                    <span className="text-[9px] font-black text-slate-400 uppercase">{progress.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${colors.iconBg} ${colors.text} ${colors.border}`}>
                        {progress.value}
                    </span>
                </div>
            )}

            {onClick && (
                <div className={`mt-4 flex items-center gap-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest ${color === 'dark' ? 'text-indigo-200' : 'text-indigo-600'}`}>
                    View Details <ChevronRight className="w-3 h-3" />
                </div>
            )}
        </div>
    );
}
