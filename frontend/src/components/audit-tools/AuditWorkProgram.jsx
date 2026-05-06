import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import StandardAuditFooter from '../common/StandardAuditFooter';


const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';

export default function AuditWorkProgram({ engagement, user, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [versions, setVersions] = useState([]);
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [signOffHistory, setSignOffHistory] = useState([]);
    
    const [formData, setFormData] = useState({
        awpRef: '',
        auditDuration: '',
        agency: '',
        auditType: 'Operations',
        objective: '',
        teamLeader: '',
        phases: [
            { id: 'planning', label: 'Audit Planning', rows: [{ id: 1, itemNo: '1', activity: 'Determine Scope and Materiality', days: '', targetOutput: '', targetDate: '', personnel: '', accomplishedBy: '', remarks: '' }] },
            { id: 'execution', label: 'Audit Execution', rows: [{ id: 2, itemNo: '2', activity: 'Conduct Fieldwork and Testing', days: '', targetOutput: '', targetDate: '', personnel: '', accomplishedBy: '', remarks: '' }] },
            { id: 'reporting', label: 'Audit Reporting', rows: [{ id: 3, itemNo: '3', activity: 'Draft and Finalize Audit Report', days: '', targetOutput: '', targetDate: '', personnel: '', accomplishedBy: '', remarks: '' }] },
            { id: 'followup', label: 'Audit Follow-up', rows: [{ id: 4, itemNo: '4', activity: 'Monitor Implementation of Recommendations', days: '', targetOutput: '', targetDate: '', personnel: '', accomplishedBy: '', remarks: '' }] }
        ],
        // Names for display/export
        preparedBy: '', preparedTitle: 'Auditor',
        reviewedBy: '', reviewedTitle: 'Assistant Team Leader',
        approvedBy: '', approvedTitle: 'IAS Director',
    });

    useEffect(() => {
        if (engagement) {
            const tl = engagement.users?.find(u => u.pivot?.role_in_engagement === 'lead_auditor')?.name || '';
            const director = engagement.users?.find(u => u.pivot?.role_in_engagement === 'Director')?.name || 'Lyra Zel';
            const atl = engagement.users?.find(u => u.pivot?.role_in_engagement === 'Assistant Team Leader')?.name || '';
            
            setFormData(fd => ({
                ...fd,
                awpRef: fd.awpRef || `AWP-${engagement.ae_number?.replace('AE-', '')}`,
                auditDuration: fd.auditDuration || `${engagement.start_date || ''} - ${engagement.end_date || ''}`,
                agency: fd.agency || engagement.movs?.[0]?.auditee?.agency_name || 'Assigned Office',
                auditType: fd.auditType || engagement.audit_type || 'Operations',
                objective: fd.objective || `DO Number: DO-${engagement.ae_number?.replace('AE-', '')} ${engagement.description || ""}`,
                teamLeader: fd.teamLeader || tl,
                preparedBy: fd.preparedBy || user?.name || '',
                reviewedBy: fd.reviewedBy || atl,
                approvedBy: fd.approvedBy || director
            }));
        }
        fetchVersions();
        loadLatest();
    }, [engagement.id, engagement.ae_number]);

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/awp/versions`);
            setVersions(res.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/awp`);
            if (res.data?.form_data) {
                setFormData(fd => ({ ...fd, ...res.data.form_data }));
                setSignOffHistory(res.data.document?.history || []);
                setSelectedVersionId(res.data.document?.id);
            }
        } catch (_) {}
    };

    const handleVersionSelect = async (versionId) => {
        try {
            const docRes = await api.get(`/engagements/${engagement.id}/documents`);
            const target = docRes.data.find(d => d.id === parseInt(versionId));
            if (target && target.form_data) {
                setFormData(target.form_data);
                setSignOffHistory(target.history || []);
                setSelectedVersionId(versionId);
            }
        } catch (e) { alert('Failed to load version: ' + e.message); }
    };

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    
    const updateRow = (phaseId, rowId, field, value) => {
        setFormData(fd => ({
            ...fd,
            phases: fd.phases.map(p => p.id === phaseId ? {
                ...p,
                rows: p.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r)
            } : p)
        }));
    };

    const addRow = (phaseId) => {
        setFormData(fd => ({
            ...fd,
            phases: fd.phases.map(p => p.id === phaseId ? {
                ...p,
                rows: [...p.rows, { id: Date.now(), itemNo: '', activity: '', days: '', targetOutput: '', targetDate: '', personnel: '', accomplishedBy: '', remarks: '' }]
            } : p)
        }));
    };

    const removeRow = (phaseId, rowId) => {
        setFormData(fd => ({
            ...fd,
            phases: fd.phases.map(p => p.id === phaseId ? {
                ...p,
                rows: p.rows.filter(r => r.id !== rowId)
            } : p)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/awp`, {
                form_data: formData,
                document_type: 'Audit Work Program (AWP)',
                phase: 'planning'
            });
            setLastSaved(new Date().toLocaleTimeString());
            fetchVersions();
            if (res.data.document) setSelectedVersionId(res.data.document.id);
        } catch (e) { alert('Save failed: ' + e.message); }
        finally { setSaving(false); }
    };

    const handleSignOffSuccess = (data) => {
        setSignOffHistory(data.document?.history || []);
        if (data.document?.id) setSelectedVersionId(data.document.id);
        fetchVersions();
    };



    const handleExportWord = () => {
        const doc = document.getElementById('awp-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('textarea, input[type="text"]').forEach(el => {
            const t = document.createTextNode(el.value || ''); el.parentNode.replaceChild(t, el);
        });
        clone.querySelectorAll('.hide-on-print').forEach(el => el.remove());
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${clone.innerHTML}</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `AWP_${engagement.title?.replace(/ /g,'_')}.doc`; a.click();
    };

    const handleExportExcel = () => {
        const table = document.getElementById('awp-table');
        const clone = table.cloneNode(true);
        clone.querySelectorAll('textarea, input[type="text"]').forEach(el => { const t=document.createTextNode(el.value||''); el.parentNode.replaceChild(t, el); });
        clone.querySelectorAll('.hide-on-print').forEach(el=>el.remove());
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${clone.outerHTML}</body></html>`;
        const a = document.createElement('a');
        a.href = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
        a.download = `AWP_${engagement.title?.replace(/ /g,'_')}.xls`;
        a.click();
    };



    return (
        <AuditToolWrapper
            toolTitle="Audit Work Program"
            toolCode="AWP"
            phase="Audit Planning"
            engagementTitle={engagement.title}
            onSave={handleSave}
            onExportWord={handleExportWord}
            onExportExcel={handleExportExcel}
            isSaving={saving}
            lastSaved={lastSaved}
            readOnly={readOnly}
            versions={versions}
            selectedVersionId={selectedVersionId}
            onVersionSelect={handleVersionSelect}
        >
            <div id="awp-document" className="audit-tool-paper bg-white shadow-2xl w-[1200px] mx-auto my-6 px-12 py-12 font-serif min-h-[1123px]">
                <div className="flex items-center gap-6 mb-10">
                    <img src={DILG_SEAL} className="h-24 w-24" alt="DILG Seal" />
                    <div>
                        <p className="text-xs text-gray-700">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none mb-1 uppercase">AUDIT WORK PROGRAM</h1>
                        <p className="text-[10px] text-gray-500 italic">FM-QP-DILG-IAS-33-05 | Rev01 | 10.10.22</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-[13px] font-bold">
                    <div className="space-y-2">
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 uppercase text-[11px] text-slate-400">AWP Reference No.</span>
                            <input className="flex-1 bg-transparent outline-none font-bold text-slate-900" value={formData.awpRef} onChange={e => set('awpRef', e.target.value)} placeholder="TBD" disabled={readOnly} />
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 uppercase text-[11px] text-slate-400">Engagement No.</span>
                            <span className="flex-1 text-slate-900">{engagement.ae_number}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 uppercase text-[11px] text-slate-400">Engagement Title</span>
                            <span className="flex-1 text-slate-900 uppercase">{engagement.title}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 uppercase text-[11px] text-slate-400">Audit Duration</span>
                            <input className="flex-1 bg-transparent outline-none font-bold text-slate-900" value={formData.auditDuration} onChange={e => set('auditDuration', e.target.value)} disabled={readOnly} />
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 uppercase text-[11px] text-slate-400">Agency / Office</span>
                            <input className="flex-1 bg-transparent outline-none font-bold text-slate-900" value={formData.agency} onChange={e => set('agency', e.target.value)} disabled={readOnly} />
                        </div>
                        <div className="flex border-b border-slate-200 pb-1">
                            <span className="w-44 uppercase text-[11px] text-slate-400">Engagement Type</span>
                            <div className="flex-1 flex gap-4 text-[11px]">
                                {['Compliance', 'Management', 'Operations', 'Follow-up'].map(t => (
                                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="radio" name="auditType" checked={formData.auditType === t} onChange={() => set('auditType', t)} className="accent-indigo-600 w-3 h-3" disabled={readOnly} />
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
                        <textarea className="flex-1 bg-transparent outline-none font-bold text-slate-900 h-16 resize-none" value={formData.objective} onChange={e => set('objective', e.target.value)} disabled={readOnly} />
                    </div>
                    <div className="flex gap-4 mt-2">
                        <span className="font-bold uppercase text-[11px] text-slate-400 whitespace-nowrap">Team Leader:</span>
                        <input className="flex-1 bg-transparent outline-none font-bold text-slate-900" value={formData.teamLeader} onChange={e => set('teamLeader', e.target.value)} disabled={readOnly} />
                    </div>
                </div>

                <div className="overflow-x-auto mb-12">
                    <table id="awp-table" className="iom-table w-full">
                        <thead>
                            <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider font-bold">
                                <th rowSpan={2} className="w-12 text-center">Item</th>
                                <th rowSpan={2} className="min-w-[200px]">Activities / Procedures</th>
                                <th rowSpan={2} className="w-16 text-center">Days</th>
                                <th colSpan={2} className="text-center">Target</th>
                                <th rowSpan={2} className="min-w-[150px]">Responsible Personnel</th>
                                <th rowSpan={2} className="min-w-[120px]">Accomplished By</th>
                                <th rowSpan={2} className="min-w-[150px]">Remarks</th>
                                <th rowSpan={2} className="w-10 hide-on-print"></th>
                            </tr>
                            <tr className="bg-slate-800 text-white text-[10px]">
                                <th className="text-center w-24">Output</th>
                                <th className="text-center w-24">Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px]">
                            {formData.phases.map(phase => (
                                <Fragment key={phase.id}>
                                    <tr className="bg-slate-100 font-black uppercase text-slate-900">
                                        <td colSpan={9} className="p-3 border border-black">
                                            <div className="flex justify-between items-center group">
                                                <span>{phase.label}</span>
                                                {!readOnly && (
                                                    <button onClick={() => addRow(phase.id)} className="hide-on-print opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-white rounded text-indigo-600 flex items-center gap-1 text-[10px] no-print">
                                                        <Plus className="w-3 h-3" /> Add Row
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {phase.rows.map(row => (
                                        <tr key={row.id}>
                                            <td className="text-center"><input className="tbl-input text-center" value={row.itemNo} onChange={e => updateRow(phase.id, row.id, 'itemNo', e.target.value)} disabled={readOnly} /></td>
                                            <td><textarea className="tbl-input min-h-[40px]" value={row.activity} onChange={e => updateRow(phase.id, row.id, 'activity', e.target.value)} disabled={readOnly} /></td>
                                            <td className="text-center font-bold"><input className="tbl-input text-center" value={row.days} onChange={e => updateRow(phase.id, row.id, 'days', e.target.value)} disabled={readOnly} /></td>
                                            <td><input className="tbl-input" value={row.targetOutput} onChange={e => updateRow(phase.id, row.id, 'targetOutput', e.target.value)} disabled={readOnly} /></td>
                                            <td><input className="tbl-input" value={row.targetDate} onChange={e => updateRow(phase.id, row.id, 'targetDate', e.target.value)} disabled={readOnly} /></td>
                                            <td><input className="tbl-input font-bold" value={row.personnel} onChange={e => updateRow(phase.id, row.id, 'personnel', e.target.value)} placeholder="Assign Auditor" disabled={readOnly} /></td>
                                            <td><input className="tbl-input" value={row.accomplishedBy} onChange={e => updateRow(phase.id, row.id, 'accomplishedBy', e.target.value)} disabled={readOnly} /></td>
                                            <td><input className="tbl-input italic text-blue-700 underline" value={row.remarks} onChange={e => updateRow(phase.id, row.id, 'remarks', e.target.value)} disabled={readOnly} /></td>
                                            <td className="text-center hide-on-print no-print">
                                                {!readOnly && (
                                                    <button onClick={() => removeRow(phase.id, row.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                <StandardAuditFooter 
                    documentId={selectedVersionId}
                    history={signOffHistory}
                    onSigned={handleSignOffSuccess}
                    readOnly={readOnly || !!selectedVersionId}
                    formData={formData}
                    setFormData={set}
                    className="mt-16"
                    signatories={[
                        { label: 'Prepared by', stage: 'Prepared', nameField: 'preparedBy', titleField: 'preparedTitle' },
                        { label: 'Reviewed by', stage: 'Reviewed', nameField: 'reviewedBy', titleField: 'reviewedTitle' },
                        { label: 'Approved by', stage: 'Approved', nameField: 'approvedBy', titleField: 'approvedTitle' }
                    ]}
                />



                <div className="mt-20 pt-12 flex flex-col items-center border-t border-slate-100">
                    <p className="text-rose-600 font-black text-[14px] tracking-[0.3em] uppercase italic mb-2">"Matino, Mahusay at Maaasahan"</p>
                    <p className="text-slate-400 text-[9px] uppercase font-bold tracking-[0.1em]">Department of the Interior and Local Government | Internal Audit Service</p>
                </div>
            </div>
        </AuditToolWrapper>
    );
}
