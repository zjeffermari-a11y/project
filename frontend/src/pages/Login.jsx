import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import iamsLogo from '../assets/IAMS logo.png';
import PageTransition from '../components/ui/PageTransition';
import LogoLoader from '../components/ui/LogoLoader';

export default function Login() {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
            else if (res.data.user.designation === 'lead_auditor' || res.data.user.designation === 'auditor') navigate('/auditor');
            else navigate('/auditee');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid login credentials');
            setLoading(false);
        }
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
