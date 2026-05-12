import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import StandardAuditFooter from '../common/StandardAuditFooter';
import { formatRef } from '../../utils/formatters';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';
const TOOL_KEY = 'iaf';

const emptyFinding = () => ({
    conclusion: '', criteria: '', condition: '', cause: '', consequence: '', recommendation: '', wpRef: '', destination: '',
    reviewHistory: [
        { dateSubmitted: '', dateReviewed: '', remarks: '' },
        { dateSubmitted: '', dateReviewed: '', remarks: '' },
        { dateSubmitted: '', dateReviewed: '', remarks: '' },
    ],
    ratingFindings: { C: '', A: '', R: '', F: '', E: '', avg: '' },
    ratingRec: { S: '', M: '', A2: '', R2: '', T: '', avg2: '' },
    overallAvg: '',
    statusConsolidated: '', statusIntegrated: '', statusRevised: '', statusNotConsidered: '', statusReason: '',
});

export default function IndividualAuditFindings({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);
    const [formData, setFormData] = useState({
        iafRef: formatRef('IAF', engagement.ae_number),
        agency: '', auditDuration: '',
        preparedByAuditor: '', preparedPosition: '',
        reviewedByTL: '', reviewedPosition: '', overallAvgRating: '',
        findings: [emptyFinding()],
    });

    const fetchVersions = async () => {
        try { const res = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}/versions`); setVersions(res.data); } catch (_) {}
    };
    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}`);
            if (res.data) {
                setDocumentId(res.data.id);
                setSignatureHistory(res.data.signatures || []);
                if (res.data.form_data) {
                    setFormData(fd => ({
                        ...fd, ...res.data.form_data,
                        findings: res.data.form_data.findings?.length ? res.data.form_data.findings : [emptyFinding()],
                    }));
                }
            }
        } catch (_) {}
    };
    useEffect(() => { loadLatest(); fetchVersions(); }, [engagement.id]);

    const handleVersionSelect = (v) => {
        setCurrentVersion(v);
        setFormData(fd => ({ ...fd, ...v.form_data, findings: v.form_data.findings?.length ? v.form_data.findings : [emptyFinding()] }));
        setDocumentId(v.id);
        setSignatureHistory(v.signatures || []);
    };

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    const updateFinding = (i, path, val) => setFormData(fd => {
        const findings = [...fd.findings];
        const parts = path.split('.');
        if (parts.length === 1) findings[i] = { ...findings[i], [path]: val };
        else if (parts.length === 2) findings[i] = { ...findings[i], [parts[0]]: { ...findings[i][parts[0]], [parts[1]]: val } };
        else if (parts.length === 3) {
            const arr = [...findings[i][parts[0]]];
            arr[+parts[1]] = { ...arr[+parts[1]], [parts[2]]: val };
            findings[i] = { ...findings[i], [parts[0]]: arr };
        }
        return { ...fd, findings };
    });
    const addFinding = () => setFormData(fd => ({ ...fd, findings: [...fd.findings, emptyFinding()] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/${TOOL_KEY}`, {
                form_data: formData, document_type: 'Individual Audit Findings (IAF)', phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
            setDocumentId(res.data.tool.id);
            fetchVersions();
        } catch (e) { alert('Save failed: ' + e.message); } finally { setSaving(false); }
    };

    const isReadOnly = readOnly || !!currentVersion;
    const docInput = 'bg-transparent outline-none border-b border-black font-bold text-[14px] px-1';
    const tblInput = 'w-full bg-transparent outline-none resize-vertical min-h-[60px] p-2 text-[13px] leading-relaxed';
    const matrixInput = 'w-full text-center bg-transparent outline-none font-bold py-2';

    return (
        <AuditToolWrapper toolTitle="Individual Audit Findings" toolCode="IAF" phase="Audit Execution"
            engagementTitle={engagement.title} onSave={handleSave} isSaving={saving} lastSaved={lastSaved}
            readOnly={isReadOnly} versions={versions} currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect} onNewDraft={() => { setCurrentVersion(null); loadLatest(); }}>
            <div className="bg-white shadow-2xl w-[1100px] mx-auto my-8 px-20 py-16 font-serif min-h-[1123px] flex flex-col">

                {/* Header */}
                <div className="flex items-center gap-6 mb-10">
                    <img src={DILG_SEAL} className="h-20 w-20" alt="DILG Seal" />
                    <div>
                        <p className="text-xs text-gray-800 leading-tight">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-2xl font-black tracking-wide">INDIVIDUAL AUDIT FINDINGS (IAF)</h1>
                        <p className="text-[10px] text-gray-500 italic">FM-QP-DILG-IAS-33-14 | Rev01 | 10.10.22</p>
                    </div>
                </div>

                {/* Header fields */}
                <div className="grid grid-cols-[200px_10px_1fr] gap-y-3 mb-12 text-[15px] font-bold items-center max-w-3xl">
                    <div>IAF Reference No.</div><div>:</div>
                    <div><input type="text" className={docInput} value={formData.iafRef} onChange={e => set('iafRef', e.target.value)} disabled={isReadOnly} /></div>
                    <div>Audit Engagement No.</div><div>:</div>
                    <div><input type="text" className={docInput} value={engagement.ae_number || ''} readOnly title="System Generated" /></div>
                    <div>Audit Engagement Title</div><div>:</div>
                    <div><input type="text" className={docInput} value={engagement.title || ''} readOnly title="System Generated" /></div>
                    <div>Agency/Office</div><div>:</div>
                    <div><input type="text" className={docInput} value={formData.agency} onChange={e => set('agency', e.target.value)} disabled={isReadOnly} /></div>
                    <div>Audit Duration</div><div>:</div>
                    <div><input type="text" className={docInput} value={formData.auditDuration} onChange={e => set('auditDuration', e.target.value)} disabled={isReadOnly} /></div>
                </div>

                {/* Findings */}
                {formData.findings.map((finding, idx) => (
                    <div key={idx} className="mb-16">
                        {/* Main finding table */}
                        <table className="w-full border-collapse border border-black mb-0">
                            <thead>
                                <tr><th colSpan={2} className="border border-black bg-slate-200 text-left p-3 font-bold text-sm">Audit Finding No. {idx + 1}</th></tr>
                            </thead>
                            <tbody>
                                {[
                                    ['CONCLUSION', 'conclusion'],
                                    ['CRITERIA', 'criteria'],
                                    ['CONDITION', 'condition'],
                                    ['RECOMMENDATION', 'recommendation'],
                                    ['WP Reference:', 'wpRef'],
                                    ['Destination', 'destination'],
                                ].map(([label, field]) => (
                                    <tr key={field}>
                                        <td className="border border-black p-3 font-bold w-56 align-middle text-sm">{label}</td>
                                        <td className="border border-black p-1"><textarea className={tblInput} style={{ fontFamily: 'serif' }} value={finding[field]} onChange={e => updateFinding(idx, field, e.target.value)} disabled={isReadOnly} /></td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="border border-black p-3 align-middle">
                                        <span className="font-bold text-sm">CAUSE:</span><br />
                                        <span className="text-xs text-gray-600">(Probable - for Compliance Audit; Root - for Management and Operations Audit)</span>
                                    </td>
                                    <td className="border border-black p-1"><textarea className={tblInput} style={{ fontFamily: 'serif' }} value={finding.cause} onChange={e => updateFinding(idx, 'cause', e.target.value)} disabled={isReadOnly} /></td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-3 font-bold italic align-middle text-sm">CONSEQUENCE:</td>
                                    <td className="border border-black p-1"><textarea className={tblInput} style={{ fontFamily: 'serif' }} value={finding.consequence} onChange={e => updateFinding(idx, 'consequence', e.target.value)} disabled={isReadOnly} /></td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Review history */}
                        <table className="w-full border-collapse border border-black border-t-0">
                            <thead>
                                <tr><th colSpan={4} className="text-left font-bold bg-white text-sm py-4 px-3 border border-black">Review History</th></tr>
                                <tr className="text-center font-bold bg-gray-50 text-xs">
                                    <th className="border border-black p-2 w-16">No.</th>
                                    <th className="border border-black p-2 w-40">Date submitted</th>
                                    <th className="border border-black p-2 w-40">Date reviewed</th>
                                    <th className="border border-black p-2">Remarks/Instructions<br /><span className="font-normal italic">[include ratings for 1st (PARe) and last (PMES) submissions]</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {finding.reviewHistory.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        <td className="border border-black p-2 text-center font-bold">{rIdx + 1}</td>
                                        <td className="border border-black p-1"><input type="text" className={matrixInput + ' font-normal py-3'} value={row.dateSubmitted} onChange={e => updateFinding(idx, `reviewHistory.${rIdx}.dateSubmitted`, e.target.value)} disabled={isReadOnly} /></td>
                                        <td className="border border-black p-1"><input type="text" className={matrixInput + ' font-normal py-3'} value={row.dateReviewed} onChange={e => updateFinding(idx, `reviewHistory.${rIdx}.dateReviewed`, e.target.value)} disabled={isReadOnly} /></td>
                                        <td className="border border-black p-1"><textarea className="w-full bg-transparent outline-none resize-vertical min-h-[50px] p-2 text-[13px]" style={{ fontFamily: 'serif' }} value={row.remarks} onChange={e => updateFinding(idx, `reviewHistory.${rIdx}.remarks`, e.target.value)} disabled={isReadOnly} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Rating matrix */}
                        <table className="w-full border-collapse border border-black border-t-0">
                            <tbody>
                                <tr>
                                    <td rowSpan={4} className="border border-black p-3 w-72 text-[11px] leading-relaxed align-top">
                                        <p className="font-bold text-sm mb-2">Rating <span className="italic font-normal">(on 1st submission of IAF)</span></p>
                                        {[['5 - Excellent', "(Auditor's performance is considered superior.)"],
                                          ['4 - Very Satisfactory', "(Auditor's performance is extremely above expectations.)"],
                                          ['3 - Satisfactory', "(Auditor's performance is regularly competent and dependable.)"],
                                          ['2 - Unsatisfactory', "(Auditor's performance is below what is expected.)"],
                                          ['1 - Poor', "(Auditor's performance falls to meet expectations.)"]].map(([r, d]) => (
                                            <p key={r} className="mb-1"><span className="font-bold">{r}</span> <span className="font-normal italic text-gray-600">{d}</span></p>
                                        ))}
                                    </td>
                                    <td colSpan={6} className="border border-black p-3 italic text-xs bg-gray-50/50">
                                        <strong>Findings:</strong> 1) completeness; 2) appropriateness; 3) relevance; 4) factual; 5) evidence-based<br />
                                        <strong>Recommendations:</strong> 1) Specific; 2) Measurable; 3) Attainable; 4) Realistic; 5) Time-bound
                                    </td>
                                </tr>
                                <tr className="text-center font-bold text-xs bg-gray-100">
                                    <td className="border border-black p-2 w-40 align-middle">Findings</td>
                                    {['C','A','R','F','E'].map(k => <td key={k} className="border border-black p-2 w-16">{k}</td>)}
                                    <td className="border border-black p-2 w-24 align-middle">Average</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-2 text-center font-bold text-xs align-middle bg-gray-100" rowSpan={2}>Recommendations</td>
                                    {['C','A','R','F','E'].map(k => (
                                        <td key={k} className="border border-black p-1">
                                            <input type="text" className={matrixInput} value={finding.ratingFindings[k]} onChange={e => updateFinding(idx, `ratingFindings.${k}`, e.target.value)} disabled={isReadOnly} />
                                        </td>
                                    ))}
                                    <td className="border border-black p-1">
                                        <input type="text" className={matrixInput} value={finding.ratingFindings.avg} onChange={e => updateFinding(idx, 'ratingFindings.avg', e.target.value)} disabled={isReadOnly} />
                                    </td>
                                </tr>
                                <tr className="text-center font-bold text-xs">
                                    {['S','M','A2','R2','T'].map(k => (
                                        <td key={k} className="border border-black p-1 bg-gray-100">
                                            <input type="text" className={matrixInput} value={finding.ratingRec[k]} onChange={e => updateFinding(idx, `ratingRec.${k}`, e.target.value)} disabled={isReadOnly} />
                                        </td>
                                    ))}
                                    <td className="border border-black p-1">
                                        <input type="text" className={matrixInput + ' text-red-600 bg-red-50 text-lg'} value={finding.overallAvg} onChange={e => updateFinding(idx, 'overallAvg', e.target.value)} disabled={isReadOnly} title="Overall Average" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Status in IAR */}
                        <table className="w-full border-collapse border border-black border-t-0">
                            <tbody>
                                <tr>
                                    <td className="border border-black p-3 w-72 font-bold text-sm align-top py-6">Status in the IAR</td>
                                    <td className="border border-black p-3 text-sm leading-loose py-6 pl-6">
                                        {[['statusConsolidated','Consolidated'],['statusIntegrated','Integrated'],['statusRevised','Revised/Upgraded']].map(([field, lbl]) => (
                                            <div key={field} className="mb-2">
                                                <input type="text" className="border-b border-black w-40 bg-transparent outline-none italic" placeholder="(Audit findings no.)" value={finding[field]} onChange={e => updateFinding(idx, field, e.target.value)} disabled={isReadOnly} /> {lbl}
                                            </div>
                                        ))}
                                        <div className="mt-4">
                                            <input type="text" className="inline-block w-10 border-b border-black bg-transparent outline-none" value={finding.statusNotConsidered} onChange={e => updateFinding(idx, 'statusNotConsidered', e.target.value)} disabled={isReadOnly} /> Not Considered <span className="ml-4 font-bold">Reason:</span>
                                            <input type="text" className="border-b border-black w-64 bg-transparent outline-none ml-2" value={finding.statusReason} onChange={e => updateFinding(idx, 'statusReason', e.target.value)} disabled={isReadOnly} />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}

                {/* Add finding */}
                {!isReadOnly && (
                    <div className="mb-16 text-center">
                        <button onClick={addFinding} className="px-8 py-3 border-2 border-dashed border-indigo-400 text-indigo-700 font-black rounded-xl hover:bg-indigo-50 transition-all text-sm uppercase tracking-widest">
                            + Add Another Audit Finding
                        </button>
                    </div>
                )}

                {/* Prepared / Reviewed */}
                <div className="grid grid-cols-2 gap-x-24 text-sm mb-12">
                    <div>
                        <p className="font-bold italic mb-10 text-[15px]">Prepared by:</p>
                        <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold mb-2" value={formData.preparedByAuditor} onChange={e => set('preparedByAuditor', e.target.value)} disabled={isReadOnly} placeholder="Auditor's Name over Signature/Date" />
                        <p className="italic text-xs text-gray-700">Auditor's Name over Signature/Date</p>
                        <input type="text" placeholder="Position" className="w-full bg-transparent outline-none italic text-xs mt-3" value={formData.preparedPosition} onChange={e => set('preparedPosition', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <p className="font-bold italic text-[15px]">Reviewed by:</p>
                            <input type="text" className="border-b border-black w-16 text-center outline-none bg-transparent font-bold text-lg" value={formData.overallAvgRating} onChange={e => set('overallAvgRating', e.target.value)} disabled={isReadOnly} />
                            <p className="font-bold italic text-[15px]">(Overall Average Rating)</p>
                        </div>
                        <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold mb-2" value={formData.reviewedByTL} onChange={e => set('reviewedByTL', e.target.value)} disabled={isReadOnly} placeholder="Team Leader's Name over Signature/Date" />
                        <p className="italic text-xs text-gray-700">Team Leader's Name over Signature/Date</p>
                        <input type="text" placeholder="Position" className="w-full bg-transparent outline-none italic text-xs mt-3" value={formData.reviewedPosition} onChange={e => set('reviewedPosition', e.target.value)} disabled={isReadOnly} />
                    </div>
                </div>

                <StandardAuditFooter documentId={documentId} history={signatureHistory} onSigned={loadLatest}
                    readOnly={isReadOnly} formData={formData} setFormData={set}
                    className="mt-8 pt-6 border-t-2 border-slate-100"
                    sections={[{ label: 'Document Control', labelClass: 'bg-indigo-900', signatories: [
                        { label: 'Process Owner', stage: 'Prepared', nameField: 'processOwner', titleField: 'processOwnerTitle' },
                        { label: 'ADC / OIC-DC', stage: 'Reviewed', nameField: 'adcName', titleField: 'adcTitle' },
                        { label: 'IAS Deputy QMR', stage: 'Approved', nameField: 'qmrName', titleField: 'qmrTitle' },
                    ]}]} />
            </div>
        </AuditToolWrapper>
    );
}
