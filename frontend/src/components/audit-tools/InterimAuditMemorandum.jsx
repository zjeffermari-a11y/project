import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import StandardAuditFooter from '../common/StandardAuditFooter';
import { formatRef } from '../../utils/formatters';

const TOOL_KEY = 'iam';
const emptyRow = () => ({ no: '', finding: '', recommendation: '', page: '' });
const emptyFinding = () => ({ criteria: '', condition: '', auditeeComments: '', iasRejoinder: '', causeConsequence: '', recommendations: '' });

export default function InterimAuditMemorandum({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);
    const [formData, setFormData] = useState({
        asOf: '',
        iamRef: formatRef('IAR', engagement.ae_number),
        background: '',
        introduction: '',
        approvedByName: '', approvedByDate: '',
        submittedByAuditor: '', submittedAuditorPosition: '',
        submittedByTL: '', submittedTLPosition: '',
        submittedByIASHead: '', submittedIASHeadPosition: '',
        summaryRows: [emptyRow(), emptyRow(), emptyRow(), emptyRow()],
        detailedFindings: [emptyFinding(), emptyFinding()],
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
                        summaryRows: res.data.form_data.summaryRows?.length ? res.data.form_data.summaryRows : [emptyRow(), emptyRow(), emptyRow(), emptyRow()],
                        detailedFindings: res.data.form_data.detailedFindings?.length ? res.data.form_data.detailedFindings : [emptyFinding(), emptyFinding()],
                    }));
                }
            }
        } catch (_) {}
    };
    useEffect(() => { loadLatest(); fetchVersions(); }, [engagement.id]);

    const handleVersionSelect = (v) => {
        setCurrentVersion(v);
        setFormData(fd => ({
            ...fd, ...v.form_data,
            summaryRows: v.form_data.summaryRows?.length ? v.form_data.summaryRows : [emptyRow(), emptyRow(), emptyRow(), emptyRow()],
            detailedFindings: v.form_data.detailedFindings?.length ? v.form_data.detailedFindings : [emptyFinding(), emptyFinding()],
        }));
        setDocumentId(v.id); setSignatureHistory(v.signatures || []);
    };

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    const updateRow = (i, field, val) => setFormData(fd => {
        const summaryRows = [...fd.summaryRows];
        summaryRows[i] = { ...summaryRows[i], [field]: val };
        return { ...fd, summaryRows };
    });
    const updateDetail = (i, field, val) => setFormData(fd => {
        const detailedFindings = [...fd.detailedFindings];
        detailedFindings[i] = { ...detailedFindings[i], [field]: val };
        return { ...fd, detailedFindings };
    });
    const addRow = () => setFormData(fd => ({ ...fd, summaryRows: [...fd.summaryRows, emptyRow()] }));
    const addFinding = () => setFormData(fd => ({ ...fd, detailedFindings: [...fd.detailedFindings, emptyFinding()] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/${TOOL_KEY}`, {
                form_data: formData, document_type: 'Interim Audit Memorandum (IAM)', phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
            setDocumentId(res.data.tool.id);
            fetchVersions();
        } catch (e) { alert('Save failed: ' + e.message); } finally { setSaving(false); }
    };

    const isReadOnly = readOnly || !!currentVersion;
    const tblInput = 'w-full bg-transparent outline-none resize-vertical p-2 text-[13px] leading-relaxed';
    const lineInput = 'bg-transparent outline-none border-b border-black font-bold text-[14px] px-1';

    return (
        <AuditToolWrapper toolTitle="Interim Audit Memorandum" toolCode="IAM" phase="Audit Execution"
            engagementTitle={engagement.title} onSave={handleSave} isSaving={saving} lastSaved={lastSaved}
            readOnly={isReadOnly} versions={versions} currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect} onNewDraft={() => { setCurrentVersion(null); loadLatest(); }}>
            <div className="bg-white shadow-2xl w-[1100px] mx-auto my-8 px-24 py-20 font-serif min-h-[1123px] flex flex-col relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-[160px] text-black/[0.04] font-bold font-sans whitespace-nowrap pointer-events-none select-none z-0">CONFIDENTIAL</div>

                {/* Title block */}
                <div className="text-center mb-16 relative z-10">
                    <h1 className="text-2xl font-bold tracking-wide italic mb-2">INTERIM AUDIT REPORT</h1>
                    <div className="flex items-center justify-center gap-2 text-lg font-bold italic">
                        <span>as of</span>
                        <input type="text" className={lineInput + ' text-center w-48'} placeholder="(Date)" value={formData.asOf} onChange={e => set('asOf', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="mt-4 text-xs font-bold italic space-y-1">
                        <div className="flex items-center justify-center gap-2">
                            <span>Interim Report Reference No.:</span>
                            <input type="text" className={lineInput + ' w-48 text-center'} value={formData.iamRef} onChange={e => set('iamRef', e.target.value)} disabled={isReadOnly} />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <span>Audit Engagement No.</span>
                            <input type="text" className={lineInput + ' w-64 text-center'} value={engagement.ae_number || ''} readOnly title="System Generated" />
                        </div>
                    </div>
                </div>

                {/* Executive Summary */}
                <div className="relative z-10 mb-16">
                    <h2 className="font-bold italic text-lg mb-6">EXECUTIVE SUMMARY</h2>
                    <h3 className="italic text-base mb-2">Background</h3>
                    <textarea className={tblInput + ' min-h-[100px] mb-10 w-full'} style={{ fontFamily: 'serif' }} value={formData.background} onChange={e => set('background', e.target.value)} disabled={isReadOnly} />

                    <h3 className="italic text-base mb-4">Summary of Interim Audit Findings and Recommendations</h3>
                    <table className="w-full border-collapse border-2 border-black mb-2">
                        <thead>
                            <tr className="font-bold italic text-center">
                                <th className="border-2 border-black p-3 w-16">No.</th>
                                <th className="border-2 border-black p-3 w-[42%]">Audit Finding</th>
                                <th className="border-2 border-black p-3 w-[42%]">Recommendation</th>
                                <th className="border-2 border-black p-3 w-20">Page</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.summaryRows.map((row, i) => (
                                <tr key={i}>
                                    <td className="border-2 border-black p-1"><input type="text" className="w-full text-center outline-none bg-transparent" value={row.no} onChange={e => updateRow(i, 'no', e.target.value)} disabled={isReadOnly} /></td>
                                    <td className="border-2 border-black p-1"><textarea className={tblInput + ' min-h-[40px]'} style={{ fontFamily: 'serif' }} value={row.finding} onChange={e => updateRow(i, 'finding', e.target.value)} disabled={isReadOnly} /></td>
                                    <td className="border-2 border-black p-1"><textarea className={tblInput + ' min-h-[40px]'} style={{ fontFamily: 'serif' }} value={row.recommendation} onChange={e => updateRow(i, 'recommendation', e.target.value)} disabled={isReadOnly} /></td>
                                    <td className="border-2 border-black p-1"><input type="text" className="w-full text-center outline-none bg-transparent" value={row.page} onChange={e => updateRow(i, 'page', e.target.value)} disabled={isReadOnly} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isReadOnly && <button onClick={addRow} className="text-indigo-600 font-bold text-xs hover:underline mb-4">+ Add Summary Row</button>}
                </div>

                {/* Approved by */}
                <div className="text-center w-full max-w-sm mx-auto mb-24 relative z-10">
                    <p className="font-bold mb-10">Approved by:</p>
                    <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold mb-1 text-center" placeholder="[Name]" value={formData.approvedByName} onChange={e => set('approvedByName', e.target.value)} disabled={isReadOnly} />
                    <p className="font-bold text-sm">Secretary of the Interior and Local Government</p>
                    <input type="text" className="bg-transparent outline-none border-b border-black font-bold italic text-center text-sm w-48 mt-2" placeholder="(date)" value={formData.approvedByDate} onChange={e => set('approvedByDate', e.target.value)} disabled={isReadOnly} />
                </div>

                {/* Page break marker */}
                <div className="w-full border-t-2 border-dashed border-slate-300 my-8 relative z-10" />

                {/* Body */}
                <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-6 font-bold italic text-lg">
                        <span>I.</span><span>INTRODUCTION</span>
                    </div>
                    <textarea className={tblInput + ' min-h-[120px] mb-10 pl-8'} style={{ fontFamily: 'serif' }} value={formData.introduction} onChange={e => set('introduction', e.target.value)} disabled={isReadOnly} />

                    <div className="flex items-start gap-4 mb-6 font-bold italic text-lg">
                        <span>II.</span><span>INTERIM AUDIT FINDINGS</span>
                    </div>

                    <div className="pl-8">
                        {formData.detailedFindings.map((f, idx) => (
                            <div key={idx} className="mb-12">
                                <h4 className="font-bold italic text-base mb-4">Interim Audit Findings No. {idx + 1}:</h4>
                                {[
                                    ['Criteria:', 'criteria'],
                                    ['Condition:', 'condition'],
                                    ["Auditee's Comments:", 'auditeeComments'],
                                    ['IAS Rejoinder:', 'iasRejoinder'],
                                    ['Cause and Consequence:', 'causeConsequence'],
                                    ['Recommendation/s:', 'recommendations'],
                                ].map(([label, field]) => (
                                    <div key={field} className="grid grid-cols-[200px_1fr] gap-4 mb-2">
                                        <div className="font-bold italic text-sm text-right pr-4">{label}</div>
                                        <div><textarea className={tblInput + ' min-h-[40px]'} style={{ fontFamily: 'serif' }} value={f[field]} onChange={e => updateDetail(idx, field, e.target.value)} disabled={isReadOnly} /></div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        {!isReadOnly && (
                            <button onClick={addFinding} className="text-indigo-600 font-bold text-sm hover:underline mb-16">+ Add Another Audit Finding Block</button>
                        )}
                    </div>
                </div>

                {/* Submitted by signatories */}
                <div className="relative z-10 font-bold italic text-sm space-y-12 w-2/3 mt-8">
                    <p>Submitted by:</p>
                    {[
                        ['submittedByAuditor', 'submittedAuditorPosition', "Auditor's Name over Signature/Date"],
                        ['submittedByTL', 'submittedTLPosition', "Team Leader's Name over Signature/Date"],
                        ['submittedByIASHead', 'submittedIASHeadPosition', "Head of Internal Audit Service' Name over Signature/Date"],
                    ].map(([nameField, posField, label]) => (
                        <div key={nameField}>
                            <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold mb-1" value={formData[nameField]} onChange={e => set(nameField, e.target.value)} disabled={isReadOnly} placeholder={label} />
                            <p>{label}</p>
                            <input type="text" placeholder="Position" className="w-full bg-transparent outline-none italic text-xs mt-1" value={formData[posField]} onChange={e => set(posField, e.target.value)} disabled={isReadOnly} />
                        </div>
                    ))}
                </div>

                <StandardAuditFooter documentId={documentId} history={signatureHistory} onSigned={loadLatest}
                    readOnly={isReadOnly} formData={formData} setFormData={set}
                    className="mt-12 pt-6 border-t-2 border-slate-100"
                    sections={[{ label: 'Document Control', labelClass: 'bg-indigo-900', signatories: [
                        { label: 'Process Owner', stage: 'Prepared', nameField: 'processOwner', titleField: 'processOwnerTitle' },
                        { label: 'ADC / OIC-DC', stage: 'Reviewed', nameField: 'adcName', titleField: 'adcTitle' },
                        { label: 'IAS Deputy QMR', stage: 'Approved', nameField: 'qmrName', titleField: 'qmrTitle' },
                    ]}]} />
            </div>
        </AuditToolWrapper>
    );
}
