import React, { useState, useEffect } from 'react';
import { Save, Printer, Download, Plus, Trash2, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function AuditWorkProgram({ engagementId, engagement, onClose }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    
    // Header Info
    const [awpRef, setAwpRef] = useState('');
    const [aeNumber, setAeNumber] = useState('');
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [agency, setAgency] = useState('');
    const [auditType, setAuditType] = useState('Operations');
    const [objective, setObjective] = useState('');
    const [teamLeader, setTeamLeader] = useState('Lead Auditor');

    // Signatories
    const [preparedBy, setPreparedBy] = useState('');
    const [reviewedBy, setReviewedBy] = useState('');
    const [approvedBy, setApprovedBy] = useState('');

    // Table Data
    const [phases, setPhases] = useState([
        { id: 'planning', label: 'Audit Planning', rows: [{ id: 1, itemNo: '1', activity: 'Determine Scope and Materiality', days: '', targetOutput: '', targetDate: '', personnel: '', actualOutput: '', actualDate: '', accomplishedBy: '', remarks: '' }] },
        { id: 'execution', label: 'Audit Execution', rows: [{ id: 2, itemNo: '2', activity: 'Conduct Fieldwork and Testing', days: '', targetOutput: '', targetDate: '', personnel: '', actualOutput: '', actualDate: '', accomplishedBy: '', remarks: '' }] },
        { id: 'reporting', label: 'Audit Reporting', rows: [{ id: 3, itemNo: '3', activity: 'Draft and Finalize Audit Report', days: '', targetOutput: '', targetDate: '', personnel: '', actualOutput: '', actualDate: '', accomplishedBy: '', remarks: '' }] },
        { id: 'followup', label: 'Audit Follow-up', rows: [{ id: 4, itemNo: '4', activity: 'Monitor Implementation of Recommendations', days: '', targetOutput: '', targetDate: '', personnel: '', accomplishedBy: '', remarks: '' }] }
    ]);

    useEffect(() => {
        if (engagement) {
            setAeNumber(engagement.ae_number || '');
            setTitle(engagement.title || '');
            setDuration(`${engagement.start_date || 'TBD'} - ${engagement.end_date || 'TBD'}`);
            setAgency(engagement.movs?.[0]?.auditee?.agency_name || 'Assigned Office');
            setAuditType(engagement.audit_type || 'Operations');
            setObjective(`DO Number: DO-${engagement.ae_number?.replace('AE-', '')} ${engagement.description || "To evaluate protocols."}`);
            
            // Set Signatories from Engagement users if available
            const tl = engagement.users?.find(u => u.pivot?.role_in_engagement === 'lead_auditor');
            if (tl) setTeamLeader(tl.name);
            
            const director = engagement.users?.find(u => u.pivot?.role_in_engagement === 'Director');
            if (director) setApprovedBy(director.name);
            else setApprovedBy('Lyra Zel'); // Default as requested

            const atl = engagement.users?.find(u => u.pivot?.role_in_engagement === 'Assistant Team Leader');
            const engagementTl = engagement.users?.find(u => u.pivot?.role_in_engagement === 'Team Leader');
            if (atl) setReviewedBy(atl.name);
            else if (engagementTl) setReviewedBy(engagementTl.name);
        }
    }, [engagement]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/engagements/${engagementId}/tools/awp`);
                if (res.data.form_data) {
                    const data = res.data.form_data;
                    setAwpRef(data.awpRef);
                    setAuditType(data.auditType);
                    setObjective(data.objective);
                    setTeamLeader(data.teamLeader);
                    setPreparedBy(data.preparedBy);
                    setReviewedBy(data.reviewedBy);
                    setApprovedBy(data.approvedBy);
                    if (data.phases) setPhases(data.phases);
                }
            } catch (err) {
                console.error("No previous tool data found.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [engagementId]);

    const updateRow = (phaseId, rowId, field, value) => {
        setPhases(prev => prev.map(p => {
            if (p.id === phaseId) {
                return {
                    ...p,
                    rows: p.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r)
                };
            }
            return p;
        }));
    };

    const addRow = (phaseId) => {
        setPhases(prev => prev.map(p => {
            if (p.id === phaseId) {
                const newId = Date.now();
                return {
                    ...p,
                    rows: [...p.rows, { id: newId, itemNo: '', activity: '', days: '', targetOutput: '', targetDate: '', personnel: '', accomplishedBy: '', remarks: '' }]
                };
            }
            return p;
        }));
    };

    const removeRow = (phaseId, rowId) => {
        setPhases(prev => prev.map(p => {
            if (p.id === phaseId) {
                return { ...p, rows: p.rows.filter(r => r.id !== rowId) };
            }
            return p;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = {
                awpRef, aeNumber, title, duration, agency, auditType, objective, teamLeader,
                preparedBy, reviewedBy, approvedBy,
                phases
            };
            await api.post(`/engagements/${engagementId}/tools/awp`, {
                form_data: formData,
                document_type: 'Audit Work Program (AWP)',
                phase: 'planning'
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert('Failed to save AWP data.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
            <p className="font-bold tracking-widest uppercase text-xs">Loading Work Program...</p>
        </div>
    );

    return (
        <div className="bg-slate-900 h-full overflow-y-auto flex flex-col p-8 custom-scrollbar">
            <style>{`
                @media print { 
                    @page { margin: 1cm; size: auto; }
                    body { background: white !important; }
                    .hide-on-print { display: none !important; }
                    .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; color: black !important; }
                    input, textarea { border-color: black !important; color: black !important; }
                    .awp-tbl { border: 1px solid black !important; color: black !important; }
                    .awp-tbl th, .awp-tbl td { border: 1px solid black !important; color: black !important; }
                }
            `}</style>

            <div className="max-w-[1200px] mx-auto w-full flex justify-between items-center mb-6 hide-on-print">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Loader2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-white font-black tracking-tight text-xl uppercase">Interactive Work Program</h2>
                        <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Planning Tool / Excel Mapping</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700">
                        <Printer className="w-4 h-4" /> Print PDF
                    </button>
                    <button onClick={handleSave} disabled={saving} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/10 ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white'}`}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : saved ? 'Changes Saved' : 'Save Program'}
                    </button>
                </div>
            </div>

            <div className="print-container bg-white shadow-2xl w-full max-w-[1200px] mx-auto min-h-[1400px] px-12 py-16 relative flex flex-col font-serif text-slate-800 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-6">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg" className="h-20 w-20" alt="Seal" />
                        <div>
                            <p className="text-[10px] font-serif uppercase text-slate-500 tracking-wider">Department of the Interior and Local Government</p>
                            <h1 className="text-3xl font-black font-serif tracking-tight text-slate-900 leading-none mb-1 uppercase">Audit Work Program</h1>
                            <p className="text-[9px] font-serif text-slate-400 italic">FM-QP-DILG-IAS-33-05 | Rev01 | 10.10.22</p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-[13px]">
                    <div className="space-y-3">
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 font-bold uppercase text-[11px] text-slate-400">AWP Reference No.</span>
                            <input className="flex-1 bg-transparent outline-none font-bold text-slate-900" value={awpRef} onChange={e => setAwpRef(e.target.value)} placeholder="TBD" />
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 font-bold uppercase text-[11px] text-slate-400">Engagement No.</span>
                            <span className="flex-1 font-bold text-slate-900">{aeNumber}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 font-bold uppercase text-[11px] text-slate-400">Engagement Title</span>
                            <span className="flex-1 font-bold text-slate-900 uppercase">{title}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 font-bold uppercase text-[11px] text-slate-400">Audit Duration</span>
                            <span className="flex-1 font-bold text-slate-900">{duration}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 font-bold uppercase text-[11px] text-slate-400">Agency / Office</span>
                            <span className="flex-1 font-bold text-slate-900">{agency}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 font-bold uppercase text-[11px] text-slate-400">Engagement Type</span>
                            <div className="flex-1 flex gap-4 font-bold text-[11px]">
                                {['Compliance', 'Management', 'Operations', 'Follow-up'].map(t => (
                                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="radio" name="auditType" checked={auditType === t} onChange={() => setAuditType(t)} className="accent-indigo-600 w-3 h-3" />
                                        <span>{t}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-l-4 border-slate-900 pl-4 py-2 mb-8 bg-slate-50/50">
                    <div className="flex gap-4">
                        <span className="font-bold uppercase text-[11px] text-slate-400 whitespace-nowrap">Audit Objective:</span>
                        <textarea className="flex-1 bg-transparent outline-none font-bold text-slate-900 h-16 resize-none" value={objective} onChange={e => setObjective(e.target.value)} />
                    </div>
                    <div className="flex gap-4 mt-2">
                        <span className="font-bold uppercase text-[11px] text-slate-400 whitespace-nowrap">Team Leader:</span>
                        <input className="flex-1 bg-transparent outline-none font-bold text-slate-900" value={teamLeader} onChange={e => setTeamLeader(e.target.value)} />
                    </div>
                </div>

                {/* Main Table */}
                <div className="flex-1 overflow-x-auto min-h-[400px]">
                    <table className="awp-tbl w-full text-left border-collapse border border-slate-900">
                        <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th rowSpan={2} className="p-3 border border-slate-700 w-12 text-center">Item</th>
                                <th rowSpan={2} className="p-3 border border-slate-700 min-w-[200px]">Activities / Procedures</th>
                                <th rowSpan={2} className="p-3 border border-slate-700 w-16 text-center">Days</th>
                                <th colSpan={2} className="p-2 border border-slate-700 text-center">Target</th>
                                <th rowSpan={2} className="p-3 border border-slate-700 min-w-[150px]">Responsible Personnel</th>
                                <th rowSpan={2} className="p-3 border border-slate-700 min-w-[120px]">Accomplished By</th>
                                <th rowSpan={2} className="p-3 border border-slate-700 min-w-[150px]">Remarks</th>
                                <th rowSpan={2} className="p-3 border border-slate-700 w-10 hide-on-print"></th>
                            </tr>
                            <tr>
                                <th className="p-2 border border-slate-700 text-center w-24">Output</th>
                                <th className="p-2 border border-slate-700 text-center w-24">Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px]">
                            {phases.map(phase => (
                                <React.Fragment key={phase.id}>
                                    <tr className="bg-slate-100 font-black uppercase text-slate-900">
                                        <td colSpan={8} className="p-3 border border-slate-400">
                                            <div className="flex justify-between items-center group">
                                                <span>{phase.label}</span>
                                                <button onClick={() => addRow(phase.id)} className="hide-on-print opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-white rounded text-indigo-600 flex items-center gap-1 text-[10px]">
                                                    <Plus className="w-3 h-3" /> Add Row
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {phase.rows.map(row => (
                                        <tr key={row.id} className="hover:bg-slate-50/50">
                                            <td className="border border-slate-300 p-0">
                                                <input className="w-full h-full p-2 bg-transparent text-center outline-none" value={row.itemNo} onChange={e => updateRow(phase.id, row.id, 'itemNo', e.target.value)} />
                                            </td>
                                            <td className="border border-slate-300 p-0">
                                                <textarea className="w-full h-full p-2 bg-transparent outline-none resize-none min-h-[40px]" value={row.activity} onChange={e => updateRow(phase.id, row.id, 'activity', e.target.value)} />
                                            </td>
                                            <td className="border border-slate-300 p-0 text-center font-bold">
                                                <input className="w-full h-full p-2 bg-transparent text-center outline-none" value={row.days} onChange={e => updateRow(phase.id, row.id, 'days', e.target.value)} />
                                            </td>
                                            <td className="border border-slate-300 p-0">
                                                <input className="w-full h-full p-2 bg-transparent outline-none" value={row.targetOutput} onChange={e => updateRow(phase.id, row.id, 'targetOutput', e.target.value)} />
                                            </td>
                                            <td className="border border-slate-300 p-0">
                                                <input className="w-full h-full p-2 bg-transparent outline-none" value={row.targetDate} onChange={e => updateRow(phase.id, row.id, 'targetDate', e.target.value)} />
                                            </td>
                                            <td className="border border-slate-300 p-0">
                                                <input className="w-full h-full p-2 bg-transparent outline-none font-bold text-slate-900" value={row.personnel} onChange={e => updateRow(phase.id, row.id, 'personnel', e.target.value)} placeholder="Assign Auditor" />
                                            </td>
                                            <td className="border border-slate-300 p-0">
                                                <input className="w-full h-full p-2 bg-transparent outline-none font-bold text-slate-900" value={row.accomplishedBy} onChange={e => updateRow(phase.id, row.id, 'accomplishedBy', e.target.value)} />
                                            </td>
                                            <td className="border border-slate-300 p-0">
                                                <input className="w-full h-full p-2 bg-transparent outline-none italic text-blue-600 underline" value={row.remarks} onChange={e => updateRow(phase.id, row.id, 'remarks', e.target.value)} />
                                            </td>
                                            <td className="border border-slate-300 p-2 text-center hide-on-print">
                                                <button onClick={() => removeRow(phase.id, row.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-[10px] font-bold italic mt-3 text-slate-500 bg-slate-50 p-2 border-l-2 border-slate-300">
                        Notes: Personnel mapped directly to Audit Workspace "Prepared By" status. Use exact Document Name in 'Activities' for auto-mapping.
                    </p>
                </div>

                {/* Signatories Section */}
                <div className="mt-20 flex justify-between gap-12 text-[12px] font-serif">
                    <div className="flex-1 flex flex-col items-center">
                        <p className="mb-10 w-full italic text-left text-slate-400 font-bold uppercase text-[10px]">Prepared by:</p>
                        <input className="w-full bg-transparent border-b border-slate-900 text-center font-bold px-2 py-1 uppercase text-[14px] outline-none" value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Auditor Name" />
                        <p className="text-[10px] italic mt-1 text-slate-500 uppercase font-black">Auditor's Name over Signature / Date</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                        <p className="mb-10 w-full italic text-left text-slate-400 font-bold uppercase text-[10px]">Reviewed by:</p>
                        <input className="w-full bg-transparent border-b border-slate-900 text-center font-bold px-2 py-1 uppercase text-[14px] outline-none" value={reviewedBy} onChange={e => setReviewedBy(e.target.value)} placeholder="Team Leader / ATL" />
                        <p className="text-[10px] italic mt-1 text-slate-500 uppercase font-black">Team Leader's Name over Signature / Date</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                        <p className="mb-10 w-full italic text-left text-slate-400 font-bold uppercase text-[10px]">Approved by:</p>
                        <input className="w-full bg-transparent border-b border-slate-900 text-center font-bold px-2 py-1 uppercase text-[14px] outline-none" value={approvedBy} onChange={e => setApprovedBy(e.target.value)} placeholder="The Director" />
                        <p className="text-[10px] italic mt-1 text-slate-500 uppercase font-black">Director's Name over Signature / Date</p>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="mt-auto pt-12 flex flex-col items-center hide-on-print">
                    <p className="text-rose-600 font-black text-[13px] tracking-[0.2em] uppercase italic">"Matino, Mahusay at Maaasahan"</p>
                    <div className="h-0.5 w-16 bg-slate-900 my-2" />
                    <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest">Department of the Interior and Local Government | Internal Audit Service</p>
                </div>
            </div>
            
            <div className="h-20 hide-on-print"></div>
        </div>
    );
}
