import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import StandardAuditFooter from '../common/StandardAuditFooter';

const TOOL_KEY = 'iascares';

const EMPTY_ROW = () => ({
    no: '', recommendation: '',
    activity: '', responsible: '', from: '', to: '',
    actionsTaken: '', implStatus: '',
    status1st: '', status2nd: '', status3rd: '', status4th: '',
    improvementRating: '',
});

export default function IAsCARes({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);

    const [formData, setFormData] = useState({
        engagementTitle: engagement.title || '',
        engagementDate:  '',
        assessmentDate:  '',
        rows: [EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()],
        // Legend counts (BP / FC / PC / NC)
        bpNo: '', bpPct: '',
        fcNo: '', fcPct: '',
        pcNo: '', pcPct: '',
        ncNo: '', ncPct: '',
        totalNo: '', totalPct: '',
        // Improvement results (rating rows: 5,4,3,2  for FC/BP; 2,1 for PC; 1,0 for NC)
        imp5No: '', imp4No: '', imp3No: '', imp2No: '', imp2pcNo: '', imp1No: '', imp1ncNo: '', imp0No: '',
        imp5ws: '', imp4ws: '', imp3ws: '', imp2ws: '', imp2pcWs: '', imp1ws: '', imp1ncWs: '', imp0ws: '',
        avgImprovementRating: '',
        // Signatories
        assessedByName: '', reviewedByName: '', approvedByName: '',
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
                { form_data: formData, document_type: 'Internal Assessment of Compliance with Audit Recommendation/s (IAsCARes)', phase: 'follow-up' });
            setLastSaved(new Date().toLocaleTimeString()); setDocumentId(r.data.tool.id); fetchVersions();
        } catch (e) { alert('Save failed: ' + e.message); } finally { setSaving(false); }
    };

    const ro = readOnly || !!currentVersion;
    const tA = 'w-full bg-transparent outline-none resize-none text-[11px] p-0.5';
    const inp = 'bg-transparent outline-none border-b border-black text-[11px] px-1';
    const cInp = 'w-full bg-transparent outline-none text-center text-[11px]';

    // Legend table rows: [code, term, desc, noKey, pctKey, ratingRows]
    const LEGEND = [
        { code: 'BP', term: 'Best Practice', desc: '– actions taken are beyond what is required by the audit recommendation and/or was recognized or awarded as best/innovative practice', noKey: 'bpNo', pctKey: 'bpPct', ratings: [['5','imp5No','imp5ws']] },
        { code: 'FC', term: 'Fully Compliant', desc: '– actions taken were adequate to fully comply with the audit recommendations', noKey: 'fcNo', pctKey: 'fcPct', ratings: [['4','imp4No','imp4ws'],['3','imp3No','imp3ws'],['2','imp2No','imp2ws']] },
        { code: 'PC', term: 'Partially Compliant', desc: '– ongoing implementation of the action plans and/or auditees action are inadequate to comply with the audit recommendations', noKey: 'pcNo', pctKey: 'pcPct', ratings: [['2','imp2pcNo','imp2pcWs'],['1','imp1No','imp1ws']] },
        { code: 'NC', term: 'Not Compliant', desc: '– action plan and/or action taken are not implemented or not responsive to the audit recommendations. Note: No submitted MOV does not automatically mean Not Compliant.', noKey: 'ncNo', pctKey: 'ncPct', ratings: [['1','imp1ncNo','imp1ncWs'],['0','imp0No','imp0ws']] },
    ];

    return (
        <AuditToolWrapper
            toolTitle="Internal Assessment of Compliance with Audit Recommendation/s (IAsCARes)"
            toolCode="IAsCARes" phase="Audit Follow-Up"
            engagementTitle={engagement.title}
            onSave={handleSave} isSaving={saving} lastSaved={lastSaved}
            readOnly={ro} versions={versions} currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect} onNewDraft={() => { setCurrentVersion(null); loadLatest(); }}
        >
            <div className="bg-white shadow-2xl w-[1300px] mx-auto my-8 px-12 py-12 font-serif flex flex-col relative">

                {/* Watermark */}
                <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-0">
                    <span className="text-[140px] font-bold rotate-[-45deg] whitespace-nowrap" style={{ color: 'rgba(220,220,220,0.4)', fontFamily: 'Times New Roman,serif' }}>CONFIDENTIAL</span>
                </div>

                <div className="relative z-10 flex flex-col gap-6">

                    {/* ── Page 1 ── */}

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg"
                            className="h-16 w-16" alt="DILG Seal" />
                        <div>
                            <p className="text-[13px] tracking-wide">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                            <h1 className="text-xl font-black" style={{ fontFamily: 'Times New Roman, serif' }}>
                                INTERNAL ASSESSMENT OF COMPLIANCE WITH AUDIT<br />RECOMMENDATION/S (IAsCARes)
                            </h1>
                            <p className="text-[10px] text-gray-500">FM-QP-DILG-IAS-33-16 | Rev01 | 10.10.22</p>
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[11px]" style={{ minWidth: '1200px' }}>
                            <thead>
                                <tr>
                                    <td colSpan={13} className="border border-black p-1.5 font-bold">
                                        Audit Engagement Title:&nbsp;
                                        <input className={`${inp} w-64`} value={formData.engagementTitle}
                                            onChange={e => set('engagementTitle', e.target.value)} disabled={ro || !!engagement.title} />
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={13} className="border border-black p-1.5 font-bold">
                                        Audit Engagement Date:&nbsp;
                                        <input className={`${inp} w-48`} value={formData.engagementDate}
                                            onChange={e => set('engagementDate', e.target.value)} disabled={ro} />
                                    </td>
                                </tr>
                                {/* Row 1 of header */}
                                <tr className="bg-gray-100 font-bold text-center text-[11px]">
                                    <th rowSpan={3} className="border border-black p-1 w-7">No.</th>
                                    <th rowSpan={3} className="border border-black p-1 w-32">Audit Recommendations</th>
                                    <th colSpan={6} className="border border-black p-1">Auditee's Action Plan and Action Taken</th>
                                    <th colSpan={5} className="border border-black p-1">
                                        IAS Assessment as of&nbsp;
                                        <input className="bg-transparent outline-none border-b border-black w-24 text-center font-normal"
                                            value={formData.assessmentDate} onChange={e => set('assessmentDate', e.target.value)} disabled={ro} />
                                    </th>
                                </tr>
                                {/* Row 2 */}
                                <tr className="bg-gray-100 font-bold text-center text-[10px]">
                                    <th rowSpan={2} className="border border-black p-1 w-24">Activity/ies</th>
                                    <th rowSpan={2} className="border border-black p-1 w-20">Responsible<br />Person/<br />Office</th>
                                    <th colSpan={2} className="border border-black p-1">Timelines</th>
                                    <th rowSpan={2} className="border border-black p-1 w-28">Actions Taken/<br />Auditee's<br />Progress Update</th>
                                    <th rowSpan={2} className="border border-black p-1 w-14 text-[8px]">Implementation<br />on Status<br /><i>(BP, FI, PI, NI)</i></th>
                                    <th colSpan={4} className="border border-black p-1">Status (BP/FC/PC/NC) and Evaluation</th>
                                    <th rowSpan={2} className="border border-black p-1 w-20 text-[9px]"><i>Improvement<br />Rating and<br />Result<br />(For BP/FC)</i></th>
                                </tr>
                                {/* Row 3 */}
                                <tr className="bg-gray-100 font-bold text-center text-[10px]">
                                    <th className="border border-black p-1 w-14">From</th>
                                    <th className="border border-black p-1 w-14">To</th>
                                    <th className="border border-black p-1 w-16">1st</th>
                                    <th className="border border-black p-1 w-16">2nd</th>
                                    <th className="border border-black p-1 w-16">3rd</th>
                                    <th className="border border-black p-1 w-16">4th</th>
                                </tr>
                                {/* Sub-note row */}
                                <tr>
                                    <th colSpan={8} className="border border-black bg-white" />
                                    <th colSpan={5} className="border border-black p-1 text-[9px] italic font-normal bg-gray-100 text-center">
                                        Only the current assessment status will be sent to the auditee per assessment period;<br />
                                        the improvement rating and result column will also be excluded.
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.rows.map((row, i) => (
                                    <tr key={i} className="align-top">
                                        <td className="border border-black p-1 text-center">{i + 1}</td>
                                        {['recommendation','activity','responsible','from','to','actionsTaken','implStatus','status1st','status2nd','status3rd','status4th','improvementRating'].map(k => (
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
                        {!ro && <button onClick={addRow} className="mt-2 text-xs text-blue-600 underline">+ Add Row</button>}
                    </div>

                    {/* Legend + Rating Side-by-Side */}
                    <div className="flex gap-4 items-start">
                        {/* Legend table (left 70%) */}
                        <div className="flex-[0_0_70%]">
                            <table className="w-full border-collapse text-[11px]">
                                <thead>
                                    <tr className="font-bold text-center">
                                        <th className="border border-black p-1 w-10">Legend</th>
                                        <th className="border border-black p-1">Description</th>
                                        <th className="border border-black p-1 w-10">No.</th>
                                        <th className="border border-black p-1 w-10">%</th>
                                        <th colSpan={2} className="border border-black p-1">Improvement Results</th>
                                        <th className="border border-black p-1 w-20">Weighted Score</th>
                                    </tr>
                                    <tr className="font-bold text-center text-[10px]">
                                        <th colSpan={4} className="border border-black" />
                                        <th className="border border-black p-1">Rating</th>
                                        <th className="border border-black p-1 text-[9px]">No. of<br />items</th>
                                        <th className="border border-black p-1" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {LEGEND.map(({ code, term, desc, noKey, pctKey, ratings }) =>
                                        ratings.map(([ rating, nk, wk ], ri) => (
                                            <tr key={`${code}-${ri}`}>
                                                {ri === 0 && <>
                                                    <td rowSpan={ratings.length} className="border border-black p-1 text-center font-bold">{code}</td>
                                                    <td rowSpan={ratings.length} className="border border-black p-1 text-[10px] text-left">
                                                        <span className="font-bold">{term}</span>{' '}{desc}
                                                    </td>
                                                    <td rowSpan={ratings.length} className="border border-black p-1 text-center">
                                                        <input className={cInp} value={formData[noKey]} onChange={e => set(noKey, e.target.value)} disabled={ro} />
                                                    </td>
                                                    <td rowSpan={ratings.length} className="border border-black p-1 text-center">
                                                        <input className={cInp} value={formData[pctKey]} onChange={e => set(pctKey, e.target.value)} disabled={ro} />
                                                    </td>
                                                </>}
                                                <td className="border border-black p-1 text-center">{rating}</td>
                                                <td className="border border-black p-1 text-center">
                                                    <input className={cInp} value={formData[nk]} onChange={e => set(nk, e.target.value)} disabled={ro} />
                                                </td>
                                                <td className="border border-black p-1 text-center">
                                                    <input className={cInp} value={formData[wk]} onChange={e => set(wk, e.target.value)} disabled={ro} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {/* Total row */}
                                    <tr className="font-bold">
                                        <td colSpan={2} className="border border-black p-1 text-right pr-4">TOTAL</td>
                                        <td className="border border-black p-1"><input className={cInp} value={formData.totalNo} onChange={e => set('totalNo', e.target.value)} disabled={ro} /></td>
                                        <td className="border border-black p-1"><input className={cInp} value={formData.totalPct} onChange={e => set('totalPct', e.target.value)} disabled={ro} /></td>
                                        <td colSpan={2} className="border border-black p-1 text-center text-[9px] font-bold">Average Improvement<br />Results Rating</td>
                                        <td className="border border-black p-1"><input className={cInp} value={formData.avgImprovementRating} onChange={e => set('avgImprovementRating', e.target.value)} disabled={ro} /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Legend text (right 28%) */}
                        <div className="flex-[0_0_28%] text-[9px] leading-snug text-gray-800">
                            <p className="font-bold">Legend:</p><br />
                            <p><strong>0 = No actions taken.</strong> No steps have been taken to address the recommendation.</p><br />
                            <p><strong>1 = Improvement Committed</strong> – Implementation has not yet commenced; however, an Action Plan has been submitted and approved.</p><br />
                            <p><strong>2 = Improvement In-Progress</strong> – Remedial actions are currently underway but not yet fully operational.</p><br />
                            <p><strong>3 = Improvement Achieved</strong> – Full compliance with action plan thru established controls, but benefits are not yet fully realized.</p><br />
                            <p><strong>4 = Benefits achieved</strong> – Full compliance resulted in expected benefits.</p><br />
                            <p><strong>5 = Achieved benefits recognized</strong> – Full compliance resulted in innovative, sustainable, and replicable improvements.</p>
                        </div>
                    </div>

                    {/* ── Page 2 — Signatories ── */}
                    <div className="mt-8 border-t pt-8">
                        {/* Header repeated */}
                        <div className="flex items-center gap-4 mb-10">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg"
                                className="h-14 w-14" alt="DILG Seal" />
                            <div>
                                <p className="text-[12px]">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                                <h2 className="text-lg font-black" style={{ fontFamily: 'Times New Roman, serif' }}>
                                    INTERNAL ASSESSMENT OF COMPLIANCE WITH AUDIT<br />RECOMMENDATION/S (IAsCARes)
                                </h2>
                                <p className="text-[9px] text-gray-500">FM-QP-DILG-IAS-33-16 | Rev01 | 10.10.22</p>
                            </div>
                        </div>

                        {/* Assessed / Reviewed / Approved */}
                        <div className="flex justify-between px-10 mb-16">
                            {[
                                ['Assessed by:', 'assessedByName', 'Internal Auditor/s'],
                                ['Reviewed by:', 'reviewedByName', 'Division Chief/s / Team Leader'],
                                ['Approved by:', 'approvedByName', 'IAS Head / Date'],
                            ].map(([label, nk, role]) => (
                                <div key={nk} className="w-[30%]">
                                    <p className="font-bold mb-12">{label}</p>
                                    <div className="border-b border-black mb-1">
                                        <input className="w-full bg-transparent outline-none text-[11px]" value={formData[nk]}
                                            onChange={e => set(nk, e.target.value)} disabled={ro} />
                                    </div>
                                    <p className="font-bold text-[12px] text-center">{role}</p>
                                </div>
                            ))}
                        </div>

                        {/* Document Control Footer */}
                        <StandardAuditFooter
                            documentId={documentId} history={signatureHistory} onSigned={loadLatest}
                            readOnly={ro} formData={formData} setFormData={set}
                            sections={[{ label: 'Document Control', labelClass: 'bg-black', signatories: [
                                { label: 'Process Owner',                       stage: 'Prepared', nameField: 'processOwner',  titleField: 'processOwnerTitle' },
                                { label: 'Asst. Division Chief/OIC-Div. Chief', stage: 'Reviewed', nameField: 'divisionChief', titleField: 'divisionChiefTitle' },
                                { label: 'IAS Deputy QMR',                      stage: 'Approved', nameField: 'qmrName',       titleField: 'qmrTitle' },
                            ]}]}
                        />
                    </div>

                </div>
            </div>
        </AuditToolWrapper>
    );
}
