import React from 'react';
import { RefreshCw, Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import Clock from '@/components/ui/Clock';

export default function DashboardHeader({ 
    user, 
    roleLabel, 
    title, 
    subtitle, 
    isInitialLoad, 
    isLoading, 
    onRefresh, 
    pendingTasksCount = 0,
    actions
}) {
    return (
        <header className="bg-white border-b border-slate-200 px-10 py-8 shrink-0 z-10">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                            {roleLabel}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{subtitle}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
                            {title}
                        </h1>
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className={`p-2 rounded-xl transition-all ${isLoading ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                            title="Force Synchronize"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="text-right flex items-center justify-end gap-4">
                    {isInitialLoad && (
                        <div className="flex items-center gap-3 bg-indigo-900 border border-indigo-700 px-4 py-2 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                            <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">
                                Synchronizing Workspace
                            </span>
                        </div>
                    )}
                    
                    <div className="mr-4 border-r border-slate-200 pr-6 hidden md:block">
                        <Clock />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 outline-none rounded-full transition-colors relative border border-indigo-100 cursor-pointer">
                                <Bell className="w-5 h-5" />
                                {pendingTasksCount > 0 && (
                                    <>
                                        <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full animate-ping"></span>
                                        <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>
                                    </>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 rounded-2xl shadow-2xl border-slate-100 p-0 text-left bg-white font-sans overflow-hidden z-[100]">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
                                <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">Tasks & Notifications</h3>
                                <span className="bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2 py-1 rounded-lg">
                                    {pendingTasksCount} Pending
                                </span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {pendingTasksCount > 0 ? (
                                    <div className="p-4 text-sm text-slate-600 font-medium tracking-tight">
                                        You have <span className="font-bold text-rose-500">{pendingTasksCount} item(s)</span> requiring attention.
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 font-bold text-xs tracking-tight">
                                        No pending tasks. Everything is clear!
                                    </div>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Action buttons (e.g. + Audit) */}
                    {actions}
                </div>
            </div>
        </header>
    );
}
