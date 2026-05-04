import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import iamsLogo from '../assets/IAMS logo.png';
import PageTransition from '../components/ui/PageTransition';
import LogoLoader from '../components/ui/LogoLoader';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? '';

const SSO_ERRORS = {
    unsupported_provider: 'Unsupported sign-in provider.',
    auth_failed: 'Authentication failed. Please try again.',
    invalid_domain: 'Only government (.gov.ph) accounts are permitted.',
    pending_approval: 'Your account is awaiting Director approval. You will be notified by email.',
};

export default function Login() {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const ssoError = searchParams.get('sso_error');
        if (ssoError) setError(SSO_ERRORS[ssoError] ?? 'SSO sign-in failed. Please try again.');
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/login', credentials);

            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            if (res.data.user.designation === 'director') navigate('/director');
            else if (res.data.user.designation === 'division_chief') navigate('/division-chief');
            else if (res.data.user.designation === 'assistant_division_chief') navigate('/assistant-division-chief');
            else if (res.data.user.designation === 'lead_auditor' || res.data.user.designation === 'auditor' || res.data.user.designation === 'assistant_auditor') navigate('/auditor');
            else navigate('/auditee');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid login credentials');
            setLoading(false);
        }
    };

    const handleSso = (provider) => {
        window.location.href = `${BACKEND_URL}/api/auth/${provider}/redirect`;
    };


    return (
        <PageTransition className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
                <header className="bg-white border-b border-slate-200 px-12 py-12 shrink-0 z-10 relative overflow-hidden">
                    <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <img src={iamsLogo} alt="IAMS Logo" className="h-16 w-16 object-contain drop-shadow-sm" />
                                <div>
                                    <h2 className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Department of the Interior and Local Government</h2>
                                    <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Internal Audit Management System</h1>
                                </div>
                            </div>
                            <p className="text-slate-500 font-medium text-sm max-w-2xl">Welcome to the central portal. Please authenticate your identity to access assigned workspaces and repositories.</p>
                        </div>
                        <div className="hidden lg:block text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Status</p>
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-bold uppercase tracking-widest">Secure Gateway Active</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-12 py-10 flex items-center justify-center">
                    <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04m17.236 0a11.955 11.955 0 00-11.764 0 11.955 11.955 0 01-8.618-3.04m17.236 0A11.956 11.956 0 0112 21.48a11.956 11.956 0 01-8.618-3.04" /></svg>
                        </div>

                        <div className="px-10 py-8 border-b border-slate-100 bg-slate-50 relative z-10">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">Access Portal</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enter Credentials to continue</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6 relative z-10">
                            {error && (
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest border border-rose-200">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Official Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={credentials.email}
                                        onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                                        className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                                        placeholder="auditor@dilg.gov.ph"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={credentials.password}
                                        onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                        className="block w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                                        placeholder="••••••••"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <Link to="/forgot-password" title="Recover lost account" className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 flex justify-between items-center py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center w-full gap-3">
                                        <LogoLoader size="sm" text="" />
                                        <span>Authenticating Securely...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Secure Login</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* SSO Divider */}
                        <div className="px-10 pb-2">
                            <div className="flex items-center gap-3 my-2">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    Or sign in with government account
                                </span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>

                            {/* Google Workspace for Government */}
                            <button
                                type="button"
                                onClick={() => handleSso('google')}
                                className="w-full flex items-center justify-center gap-3 py-3 px-5 mb-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm group"
                            >
                                {/* Google G logo */}
                                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    Sign in with Google Workspace
                                </span>
                            </button>

                            {/* Microsoft 365 */}
                            <button
                                type="button"
                                onClick={() => handleSso('azure')}
                                className="w-full flex items-center justify-center gap-3 py-3 px-5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm group"
                            >
                                {/* Microsoft logo */}
                                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 21 21">
                                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                                    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                                </svg>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    Sign in with Microsoft 365
                                </span>
                            </button>
                        </div>



                        <div className="px-10 py-6 bg-slate-50 text-center border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Authorized Personnel Only</span>
                            <Link to="/signup" className="text-blue-500 hover:text-blue-600">Register New Account</Link>
                        </div>
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}
