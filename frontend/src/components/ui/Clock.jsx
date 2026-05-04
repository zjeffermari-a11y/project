import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

const Clock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString([], { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    return (
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-slate-800 font-black tracking-tighter">
                <ClockIcon className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span className="text-xl tabular-nums uppercase">
                    {formatTime(time)}
                </span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {formatDate(time)}
            </div>
        </div>
    );
};

export default Clock;
