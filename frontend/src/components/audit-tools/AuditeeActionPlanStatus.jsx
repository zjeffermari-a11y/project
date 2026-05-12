import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import { formatRef } from '../../utils/formatters';

const TOOL_KEY = 'aapis';

const EMPTY_ROW = () => ({
    no: '', recommendation: '',
    activity: '', responsible: '', from: '', to: '',
    status1st: '', status2nd: '', status3rd: '', status4th: '',
});

export default function AuditeeActionPlanStatus({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);

    const [formData, setFormData] = useState({
        aapisRef:        formatRef('AAPIS', engagement.ae_number),
        engagementNo:    engagement.ae_number || '',
        engagementTitle: engagement.title || '',
        assessmentDate:  '',
        rows: [EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()],
        // Legend counts
        bpNo: '', bpPct: '',
        fiNo: '', fiPct: '',
        piNo: '', piPct: '',
        niNo: '', niPct: '',
        totalNo: '', totalPct: '',
        // Signatories
        submittedByName: '', submittedByTitle: '',
        approvedByName:  '', approvedByTitle:  '',
        processOwner: 'JESSICA M. BAYLON',
        divisionChief: 'ANGELBERT I. TULAUAN/ANDREA JULINE T. PASCUA',
        qmrName: 'MARY ROSE L. VILCHEZ-MARIANO',
    });

    const fetchVersions = async () => {
        try { const r = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}/versions`); setVersions(r.data); } catch (_) {}
    };
    const loadLatest = async () => {
        try {
            const r = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}`);
            if (r.data?.form_data) {
                setDocumentId(r.data.id); setSignatureHistory(r.data.signatures || []);
                setFormData(p => ({ ...p, ...r.data.form_data }));
            }
        } catch (_) {}
    };
    useEffect(() => { loadLatest(); fetchVersions(); }, [engagement.id]);

    const handleVersionSelect = v => {
        setCurrentVersion(v); setDocumentId(v.id); setSignatureHistory(v.signatures || []);
        setFormData(p => ({ ...p, ...v.form_data }));
    };

    const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));
    const setRow = (i, k, v) => setFormData(f => {
        const rows = [...f.rows]; rows[i] = { ...rows[i], [k]: v }; return { ...f, rows };
    });
    const addRow = () => setFormData(f => ({ ...f, rows: [...f.rows, EMPTY_ROW()] }));
    const removeRow = i => setFormData(f => ({ ...f, rows: f.rows.filter((_, idx) => idx !== i) }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const r = await api.post(`/engagements/${engagement.id}/tools/${TOOL_KEY}`,
                { form_data: formData, document_type: "Auditee's Action Plan and Implementation Status (AAPIS)", phase: 'follow-up' });
            setLastSaved(new Date().toLocaleTimeString()); setDocumentId(r.data.tool.id); fetchVersions();
        } catch (e) { alert('Save failed: ' + e.message); } finally { setSaving(false); }
    };

    const ro = readOnly || !!currentVersion;
    const tA = 'w-full bg-transparent outline-none resize-none text-[11px] p-0.5';
    const inp = 'w-full bg-transparent outline-none border-b border-black text-[11px] px-1';

    const LEGEND_ROWS = [
        ['BP', 'Best Practice', '– actions taken are beyond what is required by the audit recommendation and/or was recognized or awarded as best/innovative practice.', 'bpNo', 'bpPct'],
        ['FI', 'Fully Implemented', '– actions taken were adequate to fully comply with the audit recommendations.', 'fiNo', 'fiPct'],
        ['PI', 'Partially Implemented', '– ongoing implementation of the action plans and/or auditees action are inadequate to comply with the audit recommendations.', 'piNo', 'piPct'],
        ['NI', 'Not Implemented', '– action plan and/or action taken are not implemented or not responsive to the audit recommendations.', 'niNo', 'niPct'],
    ];

    return (
        <AuditToolWrapper
            toolTitle="Auditee's Action Plan and Implementation Status (AAPIS)"
            toolCode="AAPIS" phase="Audit Follow-Up"
            engagementTitle={engagement.title}
            onSave={handleSave} isSaving={saving} lastSaved={lastSaved}
            readOnly={ro} versions={versions} currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect} onNewDraft={() => { setCurrentVersion(null); loadLatest(); }}
        >
            <div className="bg-white shadow-2xl w-[1200px] mx-auto my-8 px-12 py-12 font-serif flex flex-col relative">

                {/* Watermark */}
                <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-0">
                    <span className="text-[120px] font-bold text-gray-200/40 rotate-[-40deg] whitespace-nowrap" style={{ fontFamily: 'Times New Roman, serif' }}>CONFIDENTIAL</span>
                </div>

                <div className="relative z-10 flex flex-col gap-6">

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg"
                            className="h-16 w-16" alt="DILG Seal" />
                        <div>
                            <p className="text-[13px]">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                            <h1 className="text-xl font-black" style={{ fontFamily: 'Times New Roman, serif' }}>
                                AUDITEE'S ACTION PLAN AND<br />IMPLEMENTATION STATUS (AAPIS)
                            </h1>
                            <p className="text-[10px] text-gray-500">FM-QP-DILG-IAS-33-15 | Rev02</p>
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[11px]" style={{ minWidth: '1100px' }}>
                            <thead>
                                <tr>
                                    <td colSpan={10} className="border border-black p-1.5 font-bold">
                                        Audit Engagement No.:&nbsp;
                                        <input className={inp} style={{ width: 200 }} value={formData.engagementNo}
                                            onChange={e => set('engagementNo', e.target.value)} disabled={ro || !!engagement.ae_number} />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={10} className="border border-black p-1.5 font-bold">
                                        Audit Engagement Title / Date of Audit:&nbsp;
                                        <input className={inp} style={{ width: 300 }} value={formData.engagementTitle}
                                            onChange={e => set('engagementTitle', e.target.value)} disabled={ro || !!engagement.title} />
                                        &nbsp;&nbsp;
                                        <input className={inp} style={{ width: 150 }} placeholder="Date" value={formData.assessmentDate}
                                            onChange={e => set('assessmentDate', e.target.value)} disabled={ro} />
                                    </td>
                                </tr>
                                <tr className="bg-gray-100 font-bold text-center text-[11px]">
                                    <th rowSpan={3} className="border border-black p-1 w-8">No.</th>
                                    <th rowSpan={3} className="border border-black p-1 w-36">Audit<br />Recommendations</th>
                                    <th colSpan={4} className="border border-black p-1">Action Plan</th>
                                    <th colSpan={4} className="border border-black p-1">
                                        Status of Implementation as of&nbsp;
                                        <input className="bg-transparent outline-none border-b border-black w-28 text-center font-normal text-[10px]"
                                            value={formData.assessmentDate} onChange={e => set('assessmentDate', e.target.value)} disabled={ro} />
                                    </th>
                                </tr>
                                <tr className="bg-gray-100 font-bold text-center text-[11px]">
                                    <th rowSpan={2} className="border border-black p-1 w-28">Activity/ies</th>
                                    <th rowSpan={2} className="border border-black p-1 w-24">Responsible<br />Person/<br />Office</th>
                                    <th colSpan={2} className="border border-black p-1">Timelines</th>
                                    <th colSpan={4} className="border border-black p-1 text-[10px]">Status (BP, FI, PI, NI) and Actions taken / actions to be taken (what, when, who)</th>
                                </tr>
                                <tr className="bg-gray-100 font-bold text-center text-[10px]">
                                    <th className="border border-black p-1 w-16">From</th>
                                    <th className="border border-black p-1 w-16">To</th>
                                    <th className="border border-black p-1">1st</th>
                                    <th className="border border-black p-1">2nd</th>
                                    <th className="border border-black p-1">3rd</th>
                                    <th className="border border-black p-1">4th</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.rows.map((row, i) => (
                                    <tr key={i} className="align-top">
                                        <td className="border border-black p-1 text-center font-bold">{i + 1}</td>
                                        {['recommendation','activity','responsible','from','to','status1st','status2nd','status3rd','status4th'].map(k => (
                                            <td key={k} className="border border-black p-1">
                                                <textarea rows={3} className={tA} value={row[k]} onChange={e => setRow(i, k, e.target.value)} disabled={ro} />
                                            </td>
                                        ))}
                                        {!ro && (
                                            <td className="border border-black p-1 text-center">
                                                <button onClick={() => removeRow(i)} className="text-red-500 text-xs">✕</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!ro && (
                            <button onClick={addRow} className="mt-2 text-xs text-blue-600 underline">+ Add Row</button>
                        )}
                    </div>

                    {/* Legend Table */}
                    <div>
                        <table className="w-4/5 border-collapse text-[11px]">
                            <thead>
                                <tr className="bg-gray-100 font-bold text-center">
                                    <th className="border border-black p-1 w-12 italic">Legend</th>
                                    <th className="border border-black p-1 italic">Description</th>
                                    <th className="border border-black p-1 w-12">No.</th>
                                    <th className="border border-black p-1 w-12">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {LEGEND_ROWS.map(([code, term, desc, nk, pk]) => (
                                    <tr key={code}>
                                        <td className="border border-black p-1 text-center font-bold">{code}</td>
                                        <td className="border border-black p-1 text-[11px]">
                                            <span className="font-bold">{term}</span>{desc}
                                        </td>
                                        <td className="border border-black p-1 text-center">
                                            <input className="w-full bg-transparent outline-none text-center" value={formData[nk]} onChange={e => set(nk, e.target.value)} disabled={ro} />
                                        </td>
                                        <td className="border border-black p-1 text-center">
                                            <input className="w-full bg-transparent outline-none text-center" value={formData[pk]} onChange={e => set(pk, e.target.value)} disabled={ro} />
                                        </td>
                                    </tr>
                                ))}
                                <tr className="font-bold">
                                    <td colSpan={2} className="border border-black p-1 text-right italic pr-4">TOTAL</td>
                                    <td className="border border-black p-1 text-center">
                                        <input className="w-full bg-transparent outline-none text-center" value={formData.totalNo} onChange={e => set('totalNo', e.target.value)} disabled={ro} />
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        <input className="w-full bg-transparent outline-none text-center" value={formData.totalPct} onChange={e => set('totalPct', e.target.value)} disabled={ro} />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Signatories */}
                    <div className="flex justify-between px-8 text-[13px]">
                        {[
                            ['Submitted by:', 'submittedByName', 'submittedByTitle', 'Bureau/Service/Regional/Executive Director'],
                            ['Noted/Approved by:', 'approvedByName', 'approvedByTitle', 'Supervising Official / Head of Attached Agency'],
                        ].map(([label, nk, tk, placeholder]) => (
                            <div key={nk} className="w-[45%]">
                                <p className="font-bold italic mb-10">{label}</p>
                                <input className="w-full border-b border-black bg-transparent outline-none font-bold italic mb-1" value={formData[nk]}
                                    onChange={e => set(nk, e.target.value)} disabled={ro} placeholder="Name over Signature/Date" />
                                <input className="w-full bg-transparent outline-none font-bold italic text-[12px]" value={formData[tk]}
                                    onChange={e => set(tk, e.target.value)} disabled={ro} placeholder={placeholder} />
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div className="text-[10px] leading-snug text-gray-700">
                        <p className="font-bold mb-1">Note for Signatories</p>
                        <p>For Central Office, Submitted by the Bureau/Service Director/PMO Head and Noted by the Supervising Official</p>
                        <p>For Regional Office Submitted by the Regional Director</p>
                        <p>For LGA, BJMP, BFP and PPSC, Submitted by the Head of the Attached Agency</p>
                        <p>For NYC, PCW and NCMF, Submitted by Executive Director and Approved by the Head of the Attached Agency</p>
                    </div>

                    <hr className="border-t-2 border-gray-300 my-4" />

                    {/* Document Control Footer */}
                    <div className="mt-8 mb-8">
                        <table className="sig-table">
                            <thead>
                                <tr>
                                    <th>Prepared by</th>
                                    <th>Reviewed by</th>
                                    <th>Approved by</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="font-bold">
                                    <td className="pt-8 pb-2">
                                        <input 
                                            type="text" 
                                            value={formData.processOwner} 
                                            onChange={e => set('processOwner', e.target.value)}
                                            disabled={ro}
                                            className="w-full text-center font-bold bg-transparent outline-none uppercase text-[11px]" 
                                        />
                                    </td>
                                    <td className="pt-8 pb-2">
                                        <input 
                                            type="text" 
                                            value={formData.divisionChief} 
                                            onChange={e => set('divisionChief', e.target.value)}
                                            disabled={ro}
                                            className="w-full text-center font-bold bg-transparent outline-none uppercase text-[9px]" 
                                        />
                                    </td>
                                    <td className="pt-8 pb-2">
                                        <input 
                                            type="text" 
                                            value={formData.qmrName} 
                                            onChange={e => set('qmrName', e.target.value)}
                                            disabled={ro}
                                            className="w-full text-center font-bold bg-transparent outline-none uppercase text-[11px]" 
                                        />
                                    </td>
                                </tr>
                                <tr className="font-bold text-center">
                                    <td>Process Owner</td>
                                    <td>ADC/OIC-DC</td>
                                    <td>IAS Deputy QMR</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuditToolWrapper>
    );
}
