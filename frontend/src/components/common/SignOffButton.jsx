import { useState } from 'react';
import { CheckCircle, AlertCircle, PenTool, Loader2 } from 'lucide-react';
import api from '../../api';

/**
 * Premium Digital Sign-off Button
 * Features:
 * - "Click to sign" state
 * - Loading and success feedback
 * - Automatic backend synchronization if documentId is provided
 * - Flexible callback for local state updates
 */
export default function SignOffButton({ 
    documentId, 
    stage, 
    label, 
    user, 
    onSuccess, 
    history = [], 
    className = "",
    disabled = false 
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Look for existing signature in history
    // backend uses: prepared_by, reviewed_by, approved_by
    // frontend might use: Prepared, Reviewed, Noted, Approved
    const normalizedStage = stage?.toLowerCase()?.replace(' ', '_');
    const existingEntry = history.find(h => 
        h.stage === normalizedStage || 
        h.stage === stage || 
        h.step === stage
    );

    const handleSign = async () => {
        if (disabled || existingEntry || loading) return;

        if (!documentId && !onSuccess) {
            alert("This document must be saved as a draft first before signing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (documentId) {
                // If we have a documentId, save to backend immediately
                const res = await api.post(`/documents/${documentId}/sign-off`, { 
                    stage: normalizedStage.includes('by') ? normalizedStage : `${normalizedStage}_by`
                });
                
                if (onSuccess) {
                    onSuccess(res.data);
                }
            } else if (onSuccess) {
                // Otherwise just trigger the callback
                await onSuccess(stage);
            }
        } catch (e) {
            console.error('Sign-off error:', e);
            setError(e.response?.data?.message || 'Failed to record signature');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    if (existingEntry) {
        return (
            <div className={`flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm ${className}`}>
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                    <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-emerald-800 uppercase tracking-tighter">
                        Signed by {existingEntry.signer_name || existingEntry.user}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600/70 uppercase">
                        {new Date(existingEntry.created_at || existingEntry.timestamp).toLocaleString()}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group">
            <button
                onClick={handleSign}
                disabled={disabled || loading}
                className={`
                    relative overflow-hidden
                    flex items-center gap-3 px-5 py-2.5 
                    bg-white border-2 border-slate-200 
                    text-slate-600 rounded-2xl 
                    transition-all duration-300
                    hover:border-indigo-500 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-500/10
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${className}
                `}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <PenTool className="w-5 h-5 transition-transform group-hover:rotate-12" />
                )}
                
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                        {label || stage}
                    </span>
                    <span className="text-xs font-black uppercase tracking-tight">
                        {loading ? 'Signing...' : 'Click to sign'}
                    </span>
                </div>

                {/* Subtle pulse effect on hover */}
                <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors pointer-events-none" />
            </button>

            {error && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-xl animate-bounce flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                </div>
            )}
        </div>
    );
}
