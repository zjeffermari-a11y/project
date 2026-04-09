import React from 'react';
import { LogOut } from 'lucide-react';
import iamsLogo from '../../assets/IAMS logo.png';

export default function DashboardSidebar({ 
    user, 
    navItems = [], 
    onLogout 
}) {
    return (
        <aside className="w-20 bg-slate-900 flex flex-col items-center py-8 shadow-xl z-20 shrink-0">
            <div className="mb-8">
                <img src={iamsLogo} className="w-12 h-12 object-contain drop-shadow-sm" alt="IAMS Logo" />
            </div>
            
            <img 
                src={`https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} 
                className="w-10 h-10 rounded-xl mb-4 border border-slate-700" 
                title={user.name} 
                alt="Profile" 
            />

            <nav className="flex-1 flex flex-col gap-4 mt-4">
                {navItems.map((item, idx) => (
                    <div 
                        key={idx}
                        onClick={item.onClick}
                        className={`p-3 rounded-xl transition-all relative group cursor-pointer ${
                            item.active ? 'text-white bg-slate-800' : 'text-slate-500 hover:text-white hover:bg-slate-800'
                        }`} 
                        title={item.title}
                    >
                        {item.icon}
                    </div>
                ))}
            </nav>

            <button 
                onClick={onLogout} 
                className="p-3 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all" 
                title="Logout"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </aside>
    );
}
