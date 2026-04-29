import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Building2, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import iamsLogo from '../assets/IAMS logo.png';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [designation, setDesignation] = useState('auditee');
    const [agencyName, setAgencyName] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const AUDITEE_OFFICES = [
        "Bureau of Local Government Development (BLGD)",
        "Bureau of Local Government Supervision (BLGS)",
        "National Barangay Operations Office (NBOO)",
        "Office of Project Development Services (OPDS)",
        "Information Systems and Technology Management Service (ISTMS)",
        "Planning Service (PS)",
        "Financial Management Service (FMS)",
        "Administrative Service (AS)",
        "Legal and Legislative Liaison Service (LLLS)",
        "Public Affairs and Communication Service (PACS)",
        "NCR - National Capital Region",
        "Region I - Ilocos Region",
        "Region II - Cagayan Valley",
        "Region III - Central Luzon",
        "Region IV-A - CALABARZON",
        "Region IV-B - MIMAROPA",
        "Region V - Bicol Region",
        "Region VI - Western Visayas",
        "Region VII - Central Visayas",
        "Region VIII - Eastern Visayas",
        "Region IX - Zamboanga Peninsula",
        "Region X - Northern Mindanao",
        "Region XI - Davao Region",
        "Region XII - SOCCSKSARGEN",
        "Region XIII - CARAGA",
        "CAR - Cordillera Administrative Region"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await api.post('/register', {
                name,
                email,
                password,
                designation,
                agency_name: designation === 'auditee' ? agencyName : 'DILG Compliance Office'
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register. Ensure email is unique and password provides at least 8 characters.');
        }
    };

    if (success) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 font-sans p-6">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-10 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Registration Submitted</h2>
                    <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                        Your account has been created. Please check your <span className="font-bold text-indigo-600">email (including .gov.ph inbox)</span> for a verification link. Once verified, the <span className="font-bold text-slate-700">System Director</span> must approve your account before you can log in.
                    </p>
                    <button onClick={() => navigate('/login')} className="w-full bg-indigo-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:translate-y-[-2px] transition-all">
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen rtl items-center justify-center bg-slate-50 font-sans p-6 py-12">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-10 relative">
                
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

                <div className="mb-10 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 flex justify-center items-center">
                        <img src={iamsLogo} alt="IAMS Logo" className="w-full h-full object-contain drop-shadow-md" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Create Account</h2>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Compliance & Audit System</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-center">
                        <p className="text-xs font-bold text-rose-600 truncate">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-300" />
                            </div>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required 
                                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder-slate-300" 
                                placeholder="Juan Dela Cruz"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-300" />
                            </div>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required 
                                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder-slate-300" 
                                placeholder="name@agency.gov.ph"
                            />
                        </div>
                        <p className="text-[9px] font-bold text-rose-500 mt-1 pl-1 uppercase tracking-tighter">Mandatory: Registration requires a valid government (.gov.ph) email address</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-300" />
                            </div>
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required 
                                minLength={8}
                                className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder-slate-300" 
                                placeholder={"••••••••"}
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

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Role / Designation</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Briefcase className="h-5 w-5 text-slate-300" />
                            </div>
                            <select value={designation} onChange={e => setDesignation(e.target.value)} required 
                                className="block w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="director">Director</option>
                                <option value="division_chief">Division Chief</option>
                                <option value="assistant_division_chief">Assistant Division Chief</option>
                                <option value="lead_auditor">Lead Auditor</option>
                                <option value="auditor">Auditor</option>
                                <option value="auditee">Auditee</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    {designation === 'auditee' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Agency / Office</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Building2 className="h-5 w-5 text-slate-300" />
                                </div>
                                <select value={agencyName} onChange={e => setAgencyName(e.target.value)} required 
                                    className="block w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select your office...</option>
                                    {AUDITEE_OFFICES.map((office, idx) => (
                                        <option key={idx} value={office}>{office}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button type="submit" className="w-full bg-slate-900 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-slate-300 hover:bg-indigo-600 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all">
                            Submit Registration
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs font-medium text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-indigo-500 hover:text-indigo-600 transition-colors">Sign in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;
