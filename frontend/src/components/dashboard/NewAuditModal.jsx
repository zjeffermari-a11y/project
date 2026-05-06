import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export default function NewAuditModal({ 
    isOpen, 
    onClose, 
    auditees = [], 
    availableAuditors = [], 
    onSubmit,
    engagements = [] 
}) {
    const [formData, setFormData] = useState({ 
        title: '', 
        description: '', 
        start_date: '', 
        end_date: '', 
        auditee_id: '',
        type_of_audit: 'Compliance Management'
    });
    const [doNumber, setDoNumber] = useState('');
    const [offices, setOffices] = useState([]);
    const [leadAuditors, setLeadAuditors] = useState([]);
    const [members, setMembers] = useState([]);

    const [newOffice, setNewOffice] = useState('');
    const [newLeadAuditor, setNewLeadAuditor] = useState('');
    const [newMember, setNewMember] = useState('');

    const [assistantLeaders, setAssistantLeaders] = useState([]);
    const [newAssistantLeader, setNewAssistantLeader] = useState('');


    useEffect(() => {
        if (isOpen) {
            const currentYear = new Date().getFullYear();
            let maxSequence = 0;
            // Scan ae_number for sequences like AE-2026-004
            engagements.forEach(eng => {
                const ae = eng.ae_number || '';
                const match = ae.match(/AE-(\d{4})-(\d+)/);
                if (match && match[1] === currentYear.toString()) {
                    const seq = parseInt(match[2], 10);
                    if (seq > maxSequence) maxSequence = seq;
                }
            });
            const nextSequence = String(maxSequence + 1).padStart(3, '0');
            setDoNumber(`${currentYear}-${nextSequence}`);
        }
    }, [isOpen, engagements]);

    if (!isOpen) return null;

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const combinedDescription = doNumber ? `DO Number: DO-${doNumber}\n${formData.description}` : formData.description;
        const computedAeNumber = `AE-${doNumber}`;
        
        onSubmit({
            ...formData,
            ae_number: computedAeNumber,
            description: combinedDescription,
            offices: offices.map(o => o.id),
            leadAuditors: leadAuditors.map(l => l.id),
            assistantLeaders: assistantLeaders.map(a => a.id),
            members: members.map(m => m.id)
        });
    };

    const addOffice = () => {
        if (!newOffice) return;
        const exists = auditees.find(a => a.id.toString() === newOffice);
        if (exists && !offices.find(o => o.id === exists.id)) {
            setOffices([...offices, exists]);
        }
        setNewOffice('');
    };

    const addLead = () => {
        if (!newLeadAuditor) return;
        const exists = availableAuditors.find(a => a.id.toString() === newLeadAuditor);
        if (exists && !leadAuditors.find(l => l.id === exists.id)) {
            setLeadAuditors([...leadAuditors, exists]);
        }
        setNewLeadAuditor('');
    };

    const addMember = () => {
        if (!newMember) return;
        const exists = availableAuditors.find(a => a.id.toString() === newMember);
        if (exists && !members.find(m => m.id === exists.id)) {
            setMembers([...members, exists]);
        }
        setNewMember('');
    };

    const addAssistantLeader = () => {
        if (!newAssistantLeader) return;
        const exists = availableAuditors.find(a => a.id.toString() === newAssistantLeader);
        if (exists && !assistantLeaders.find(m => m.id === exists.id)) {
            setAssistantLeaders([...assistantLeaders, exists]);
        }
        setNewAssistantLeader('');
    };



    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="px-10 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Register New Audit Engagement</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">Initialize workspace for a new department audit</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">DO Sequence Number</label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-400">DO-</span>
                                        <input 
                                            type="text" 
                                            value={doNumber} 
                                            onChange={(e) => setDoNumber(e.target.value)}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Engagement Number (Auto)</label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-400">AE-</span>
                                        <input 
                                            type="text" 
                                            value={doNumber} 
                                            className="flex-1 bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 text-sm font-black text-indigo-600 outline-none cursor-not-allowed" 
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Engagement Title</label>
                                <input 
                                    type="text" 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                                    placeholder="e.g. 2026 Procurement Audit"
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type of Audit</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                    value={formData.type_of_audit}
                                    onChange={(e) => setFormData({...formData, type_of_audit: e.target.value})}
                                >
                                    <option value="Compliance Management">Compliance Management</option>
                                    <option value="Operation Management">Operation Management</option>
                                </select>
                            </div>


                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Description</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium h-32 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Outline the scope and objectives..."
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold" 
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold" 
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Offices Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Offices / Agencies</label>
                                <div className="flex gap-2 mb-3">
                                    <select 
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                                        value={newOffice}
                                        onChange={(e) => setNewOffice(e.target.value)}
                                    >
                                        <option value="">Select Office...</option>
                                        {auditees.map(a => <option key={a.id} value={a.id}>{a.agency_name}</option>)}
                                    </select>
                                    <button type="button" onClick={addOffice} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-slate-900 transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {offices.map(o => (
                                        <span key={o.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {o.agency_name}
                                            <button type="button" onClick={() => setOffices(offices.filter(item => item.id !== o.id))}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Lead Auditor Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lead Auditor(s)</label>
                                <div className="flex gap-2 mb-3">
                                    <select 
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                                        value={newLeadAuditor}
                                        onChange={(e) => setNewLeadAuditor(e.target.value)}
                                    >
                                        <option value="">Select Lead...</option>
                                        {availableAuditors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    <button type="button" onClick={addLead} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-slate-900 transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {leadAuditors.map(l => (
                                        <span key={l.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {l.name}
                                            <button type="button" onClick={() => setLeadAuditors(leadAuditors.filter(item => item.id !== l.id))}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Assistant Leader Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assistant Leader(s)</label>
                                <div className="flex gap-2 mb-3">
                                    <select 
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                                        value={newAssistantLeader}
                                        onChange={(e) => setNewAssistantLeader(e.target.value)}
                                    >
                                        <option value="">Select Assistant Leader...</option>
                                        {availableAuditors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    <button type="button" onClick={addAssistantLeader} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-slate-900 transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {assistantLeaders.map(m => (
                                        <span key={m.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {m.name}
                                            <button type="button" onClick={() => setAssistantLeaders(assistantLeaders.filter(item => item.id !== m.id))}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Members Selection */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Engagement Members</label>
                                <div className="flex gap-2 mb-3">
                                    <select 
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                                        value={newMember}
                                        onChange={(e) => setNewMember(e.target.value)}
                                    >
                                        <option value="">Select Member...</option>
                                        {availableAuditors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    <button type="button" onClick={addMember} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-slate-900 transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {members.map(m => (
                                        <span key={m.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {m.name}
                                            <button type="button" onClick={() => setMembers(members.filter(item => item.id !== m.id))}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>


                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                        <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-lg shadow-indigo-100">Initialize Engagement</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
