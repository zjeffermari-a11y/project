import React, { useState, useEffect } from 'react';
import { CheckCheck, Loader2, ShieldCheck, Clock, LockKeyhole, UserCheck } from 'lucide-react';
import api from '../../api';

/**
 * SignOffButton
 * 
 * A reusable component that records a formal AWP sign-off at a specific stage.
 * 
 * Props:
 *   documentId   - The backend Document ID to sign off on (required)
 *   stage        - 'prepared_by' | 'reviewed_by' | 'approved_by'
 *   label        - Display label, e.g. "Prepared by"
 *   user         - The currently authenticated user object
 *   onSuccess    - Callback fired after a successful sign-off (receives history entry)
 *   existingEntry - The existing DocumentHistory entry for this stage (if already signed)
 */
export default function SignOffButton({ documentId, stage, label, user, onSuccess, existingEntry }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [entry, setEntry] = useState(existingEntry || null);

    // Sync if parent re-passes the existing entry (e.g., after a re-fetch)
    useEffect(() => {
        if (existingEntry) setEntry(existingEntry);
    }, [existingEntry]);

    // Determine if the current user is permitted for this stage
    const stagePermissions = {
        prepared_by: ['auditor', 'lead_auditor', 'assistant_division_chief', 'division_chief', 'director'],
        reviewed_by: ['lead_auditor', 'assistant_division_chief', 'division_chief', 'director'],
        approved_by: ['division_chief', 'assistant_division_chief', 'director'],
    };

    const userIdentifier = user?.designation || user?.role;
    const canSign = stagePermissions[stage]?.includes(userIdentifier);
    const alreadySigned = !!entry;

    const handleSignOff = async () => {
        if (!documentId) {
            setError('Save the AWP before signing. No document ID found.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await api.post(`/documents/${documentId}/sign-off`, { stage });
            const newEntry = res.data.history;
            setEntry(newEntry);
            if (onSuccess) onSuccess(newEntry);
        } catch (err) {
            const msg = err.response?.data?.message || 'Sign-off failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // --- Renders ---

    if (alreadySigned) {
        return (
            <div className="flex flex-col items-center w-full">
                <div className="w-full border-b-2 border-emerald-600 relative mb-1">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 rounded-full p-1">
                        <CheckCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                </div>
                <p className="text-[11px] font-black text-emerald-700 uppercase tracking-wider text-center mt-2">
                    {entry.signer_name}
                </p>
                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest text-center">
                    {entry.designation?.replace(/_/g, ' ')}
                </p>
                <p className="text-[9px] text-slate-400 italic text-center mt-0.5">
                    {new Date(entry.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <div className="flex items-center gap-1 mt-1 text-emerald-600">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Signed</span>
                </div>
            </div>
        );
    }

    if (!canSign) {
        return (
            <div className="flex flex-col items-center w-full">
                <div className="w-full border-b border-dashed border-slate-300 mb-1 mt-1" />
                <p className="text-[10px] text-slate-400 italic mt-2 text-center">
                    Awaiting {label}
                </p>
                <div className="flex items-center gap-1 mt-1 text-slate-300">
                    <LockKeyhole className="w-3 h-3" />
                    <span className="text-[9px] uppercase tracking-widest font-bold">Not Authorized</span>
                </div>
            </div>
        );
    }

    // User CAN sign
    return (
        <div className="flex flex-col items-center w-full gap-2">
            <div className="w-full border-b border-dashed border-slate-400 mb-1 mt-1" />
            {error && (
                <p className="text-[9px] text-rose-500 font-bold text-center bg-rose-50 rounded px-2 py-1 w-full">
                    {error}
                </p>
            )}
            <button
                onClick={handleSignOff}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <UserCheck className="w-3 h-3" />
                }
                {loading ? 'Signing...' : `Sign as ${label}`}
            </button>
            <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span className="text-[9px] uppercase tracking-widest font-bold">Pending Signature</span>
            </div>
        </div>
    );
}
