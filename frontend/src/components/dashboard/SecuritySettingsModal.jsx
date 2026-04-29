import { useState } from 'react';
import { Lock, X, ShieldCheck, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../../api';

export default function SecuritySettingsModal({ isOpen, onClose, user }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.new_password !== formData.new_password_confirmation) {
            setError('New passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/change-password', formData);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({ current_password: '', new_password: '', new_password_confirmation: '' });
                onClose();
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password. Please check your current password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Security Portal</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Credential Management</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center py-6 animate-in slide-in-from-bottom-4">
                            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Password Updated</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                Your security credentials have been successfully updated. This session remains active.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600 text-xs font-bold uppercase tracking-widest leading-normal">
                                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-4 h-4 text-slate-300" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={formData.current_password}
                                            onChange={e => setFormData({ ...formData, current_password: e.target.value })}
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 mx-1"></div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Secure Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-4 h-4 text-slate-300" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            value={formData.new_password}
                                            onChange={e => setFormData({ ...formData, new_password: e.target.value })}
                                            className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="Minimum 8 characters"
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
                                            <Lock className="h-4 h-4 text-slate-300" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={formData.new_password_confirmation}
                                            onChange={e => setFormData({ ...formData, new_password_confirmation: e.target.value })}
                                            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-between items-center py-4 px-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <span>{loading ? 'Processing...' : 'Update Security Keys'}</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    )}
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted Session</span>
                </div>
            </div>
        </div>
    );
}
