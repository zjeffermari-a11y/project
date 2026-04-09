import React from 'react';
import PageTransition from '../ui/PageTransition';
import LogoutOverlay from '../ui/LogoutOverlay';

export default function DashboardLayout({ 
    children, 
    sidebar, 
    header, 
    isLoggingOut, 
    userName 
}) {
    return (
        <PageTransition className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans relative">
            <LogoutOverlay isOpen={isLoggingOut} userName={userName} />
            
            {/* Sidebar slot */}
            {sidebar}

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
                {/* Header slot */}
                {header}

                <div className="flex-1 overflow-y-auto px-10 py-8">
                    <div className="max-w-7xl mx-auto space-y-8 pb-10">
                        {children}
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}
