import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LogoLoader from '../components/ui/LogoLoader';
import iamsLogo from '../assets/IAMS logo.png';

/**
 * SsoCallback — Landing page for the OAuth redirect.
 *
 * The backend redirects here after a successful SSO login with:
 *   ?token=<sanctum_token>&user=<json_encoded_user>
 *
 * On failure it redirects to /login?sso_error=<reason>
 *
 * This page reads the token, saves it to localStorage, then navigates
 * to the correct role-based dashboard — exactly like the normal login flow.
 */
export default function SsoCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const userRaw = searchParams.get('user');

        if (!token || !userRaw) {
            setError('SSO authentication failed. No credentials received.');
            return;
        }

        try {
            const user = JSON.parse(decodeURIComponent(userRaw));

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Same routing logic as Login.jsx handleSubmit
            const d = user.designation;
            if (d === 'director') navigate('/director', { replace: true });
            else if (d === 'division_chief') navigate('/division-chief', { replace: true });
            else if (d === 'assistant_division_chief') navigate('/assistant-division-chief', { replace: true });
            else if (['lead_auditor', 'auditor', 'assistant_auditor'].includes(d)) navigate('/auditor', { replace: true });
            else navigate('/auditee', { replace: true });
        } catch {
            setError('Failed to process SSO session data. Please try again.');
        }
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
                <img src={iamsLogo} alt="IAMS Logo" className="h-16 w-16 mb-6 opacity-50" />
                <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
                    <p className="text-rose-600 font-black text-xs uppercase tracking-widest mb-2">SSO Error</p>
                    <p className="text-slate-700 text-sm font-medium mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <img src={iamsLogo} alt="IAMS Logo" className="h-20 w-20 mb-8 animate-pulse" />
            <LogoLoader size="md" text="Completing Secure Sign-In..." />
            <p className="mt-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
                Verifying your government account
            </p>
        </div>
    );
}
