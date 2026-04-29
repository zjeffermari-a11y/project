import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import { Lock, ArrowRight, ArrowLeft, ShieldAlert, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import iamsLogo from '../assets/IAMS logo.png';
import PageTransition from '../components/ui/PageTransition';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        email: searchParams.get('email') || '',
        token: searchParams.get('token') || '',
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        if (!formData.token || !formData.email) {
            setError('Invalid or expired reset link. Please request a new one.');
        }
    }, [formData.token, formData.email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await api.post('/reset-password', formData);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Password reset failed. The link may have expired.');
        } finally {
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
                            <p className="text-slate-500 font-medium text-sm max-w-2xl">Security Credentials Update. Configure a new secure password for your account.</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-12 py-10 flex items-center justify-center">
                    <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
                        <div className="px-10 py-8 border-b border-slate-100 bg-slate-50 relative z-10">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">Update Password</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configure your new access credentials</p>
                        </div>

                        {success ? (
                            <div className="p-10 text-center space-y-6">
                                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Security Updated</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        Your password has been successfully reset. You can now use your new credentials to log in.
                                    </p>
                                </div>
                                <Link 
                                    to="/login" 
                                    className="w-full inline-flex justify-center items-center py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all"
                                >
                                    Login with New Password
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-10 space-y-6 relative z-10">
                                {error && (
                                    <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest border border-rose-200 flex items-start gap-3">
                                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resetting Account for</p>
                                        <p className="text-sm font-bold text-slate-700 break-all">{formData.email}</p>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Secure Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
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

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={formData.password_confirmation}
                                                onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                                                className="block w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !formData.token}
                                    className="w-full flex justify-between items-center py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <span>{loading ? 'Updating Credentials...' : 'Set New Password'}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>

                                <div className="text-center pt-2">
                                    <Link to="/login" className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                                        <ArrowLeft className="w-3 h-3" />
                                        Cancel Recovery
                                    </Link>
                                </div>
                            </form>
                        )}

                        <div className="px-10 py-6 bg-slate-50 text-center border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Secure Credentials Management
                        </div>
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}
