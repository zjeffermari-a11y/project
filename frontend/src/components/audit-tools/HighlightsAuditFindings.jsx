import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import StandardAuditFooter from '../common/StandardAuditFooter';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';
const TOOL_KEY = 'hoaf';
const emptyFinding = () => ({ highlight: '', comment: '' });

export default function HighlightsAuditFindings({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);
    const [formData, setFormData] = useState({
        preparedByTeam: '', reviewedByIAS: '', submittedBy: '', notedApprovedBy: '',
        findings: [emptyFinding(), emptyFinding()],
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
                    setFormData(fd => ({ ...fd, ...res.data.form_data,
                        findings: res.data.form_data.findings?.length ? res.data.form_data.findings : [emptyFinding(), emptyFinding()],
                    }));
                }
            }
        } catch (_) {}
    };
    useEffect(() => { loadLatest(); fetchVersions(); }, [engagement.id]);

    const handleVersionSelect = (v) => {
        setCurrentVersion(v);
        setFormData(fd => ({ ...fd, ...v.form_data,
            findings: v.form_data.findings?.length ? v.form_data.findings : [emptyFinding(), emptyFinding()],
        }));
        setDocumentId(v.id);
        setSignatureHistory(v.signatures || []);
    };

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    const updateFinding = (i, field, val) => setFormData(fd => {
        const findings = [...fd.findings];
        findings[i] = { ...findings[i], [field]: val };
        return { ...fd, findings };
    });
    const addFinding = () => setFormData(fd => ({ ...fd, findings: [...fd.findings, emptyFinding()] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/${TOOL_KEY}`, {
                form_data: formData, document_type: 'Highlights of Audit Findings (HOAF)', phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
            setDocumentId(res.data.tool.id);
            fetchVersions();
        } catch (e) { alert('Save failed: ' + e.message); } finally { setSaving(false); }
    };

    const isReadOnly = readOnly || !!currentVersion;

    return (
        <AuditToolWrapper toolTitle="Highlights of Audit Findings" toolCode="HOAF" phase="Audit Execution"
            engagementTitle={engagement.title} onSave={handleSave} isSaving={saving} lastSaved={lastSaved}
            readOnly={isReadOnly} versions={versions} currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect} onNewDraft={() => { setCurrentVersion(null); loadLatest(); }}>
            <div className="bg-white shadow-2xl w-[1100px] mx-auto my-8 px-20 py-16 font-serif min-h-[1123px] flex flex-col relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] text-[140px] text-black/[0.04] font-black font-sans whitespace-nowrap pointer-events-none select-none z-0">CONFIDENTIAL</div>

                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <img src={DILG_SEAL} className="h-20 w-20" alt="DILG Seal" />
                    <div>
                        <p className="text-xs text-gray-800 leading-tight">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-2xl font-black tracking-wide">HIGHLIGHTS OF AUDIT FINDINGS</h1>
                        <p className="text-[10px] text-gray-500 italic">FM-QP-DILG-IAS-33-27 | Rev01 |</p>
                    </div>
                </div>

                <table className="w-full border-collapse mb-2 relative z-10">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border-2 border-black p-3 w-16 text-center text-[13px] font-bold">Ref.<br />No.</th>
                            <th className="border-2 border-black p-3 w-[45%] text-[13px] font-bold text-center">HIGHLIGHTS OF AUDIT FINDING/S</th>
                            <th className="border-2 border-black p-3 text-[13px] font-bold text-center">MANAGEMENT'S COMMENTS <span className="font-normal italic">(To include supporting documents, if any)</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.findings.map((f, idx) => (
                            <tr key={idx}>
                                <td className="border-2 border-black p-3 text-center font-bold align-middle">{idx + 1}</td>
                                <td className="border-2 border-black p-1">
                                    <textarea className="w-full bg-transparent outline-none resize-vertical min-h-[80px] p-2 text-[13px] leading-relaxed" style={{ fontFamily: 'serif' }} value={f.highlight} onChange={e => updateFinding(idx, 'highlight', e.target.value)} disabled={isReadOnly} />
                                </td>
                                <td className="border-2 border-black p-1">
                                    <textarea className="w-full bg-transparent outline-none resize-vertical min-h-[80px] p-2 text-[13px] leading-relaxed" style={{ fontFamily: 'serif' }} value={f.comment} onChange={e => updateFinding(idx, 'comment', e.target.value)} disabled={isReadOnly} />
                                </td>
                            </tr>
                        ))}
                        {!isReadOnly && (
                            <tr><td colSpan={3} className="border-2 border-black bg-slate-50 px-4 py-2">
                                <button onClick={addFinding} className="text-indigo-600 font-bold text-xs hover:underline w-full text-left">+ Add Another Finding Row</button>
                            </td></tr>
                        )}
                        <tr>
                            <td className="border-2 border-black p-2"></td>
                            <td className="border-2 border-black p-8">
                                <p className="font-bold italic mb-10 text-[13px]">As to audit findings</p>
                                <p className="font-bold mb-2 text-[13px]">Prepared by:</p>
                                <input type="text" className="w-3/4 bg-transparent outline-none border-b border-black font-bold mb-1" value={formData.preparedByTeam} onChange={e => set('preparedByTeam', e.target.value)} disabled={isReadOnly} placeholder="Team Names over Signature / Date" />
                                <p className="italic text-xs text-gray-800 mb-8">Team Names over Signature / Date</p>
                                <p className="font-bold mb-2 mt-4 text-[13px]">Reviewed by:</p>
                                <input type="text" className="w-3/4 bg-transparent outline-none border-b border-black font-bold mb-1" value={formData.reviewedByIAS} onChange={e => set('reviewedByIAS', e.target.value)} disabled={isReadOnly} placeholder="IAS Head name over Signature/Date" />
                                <p className="italic text-xs text-gray-800 font-bold">IAS Head name over Signature/Date</p>
                            </td>
                            <td className="border-2 border-black p-8">
                                <p className="font-bold italic mb-10 text-[13px]">As to management comments</p>
                                <p className="font-bold mb-2 text-[13px]">Submitted by:</p>
                                <input type="text" className="w-3/4 bg-transparent outline-none border-b border-black font-bold mb-1" value={formData.submittedBy} onChange={e => set('submittedBy', e.target.value)} disabled={isReadOnly} placeholder="Name over Signature/Date" />
                                <p className="italic text-xs text-gray-800 mb-1">Name over Signature/Date</p>
                                <p className="italic text-xs text-gray-800 font-bold mb-8">Bureau/Service/Regional/Executive Director</p>
                                <p className="font-bold mb-2 text-[13px]">Noted by/Approved by:</p>
                                <input type="text" className="w-3/4 bg-transparent outline-none border-b border-black font-bold mb-1" value={formData.notedApprovedBy} onChange={e => set('notedApprovedBy', e.target.value)} disabled={isReadOnly} placeholder="Name Over Signature/Date" />
                                <p className="italic text-xs text-gray-800 font-bold">Name Over Signature/Date</p>
                                <p className="italic text-xs text-gray-800 font-bold">Supervising Official / Head of Attached Agency</p>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="mb-10 text-[11px] italic leading-tight relative z-10">
                    <p className="font-bold">Note for Signatories in Management comments:</p>
                    <p>For Central Office, Submitted by the Bureau/Service Director/PMO Head and Noted by the Supervising Official</p>
                    <p>For Regional Office Submitted by the Regional Director</p>
                    <p>For LGA, BJMP, BFP and PPSC, Submitted by the Head of the Attached Agency</p>
                    <p>For NYC, PCW and NCMF, Submitted by Executive Director and Approved by the Head of the Attached Agency</p>
                </div>

                <StandardAuditFooter documentId={documentId} history={signatureHistory} onSigned={loadLatest}
                    readOnly={isReadOnly} formData={formData} setFormData={set}
                    className="mt-8 pt-6 border-t-2 border-slate-100"
                    sections={[{ label: 'Document Control', labelClass: 'bg-indigo-900', signatories: [
                        { label: 'Process Owner', stage: 'Prepared', nameField: 'processOwner', titleField: 'processOwnerTitle' },
                        { label: 'Asst. Division Chief / OIC-DC', stage: 'Reviewed', nameField: 'adcName', titleField: 'adcTitle' },
                        { label: 'IAS Deputy QMR', stage: 'Approved', nameField: 'qmrName', titleField: 'qmrTitle' },
                    ]}]} />
            </div>
        </AuditToolWrapper>
    );
}
