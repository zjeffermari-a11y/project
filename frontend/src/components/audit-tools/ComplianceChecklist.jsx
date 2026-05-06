import { useState, useEffect, Fragment } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import MultiFileAttach from './MultiFileAttach';
import { formatRef } from '../../utils/formatters';
import StandardAuditFooter from '../common/StandardAuditFooter';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';

const emptyRow = () => ({
    policy:'', requirement:'', movs:'',
    selfYes:false, selfNo:false, selfNA:false, selfDocs:'', selfRemarks:'', selfAttachments: [],
    auditorYes:false, auditorNo:false, auditorNA:false, auditorNotes:'',
});

export default function ComplianceChecklist({ engagement, user, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [versions, setVersions] = useState([]);
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [signOffHistory, setSignOffHistory] = useState([]);
    const [formData, setFormData] = useState({
        ccRef: formatRef('CC', engagement.ae_number),
        auditDuration: '',
        auditObjectives: '',
        rows: Array(5).fill(null).map(emptyRow),
        // Names for display/export
        preparedBy:'', preparedTitle:'',
        reviewedBy:'', reviewedTitle:'',
        approvedBy:'', approvedTitle:'IAS Director',
        accomplishedBy:'', accomplishedTitle:'',
        conformedBy:'', conformedTitle:'',
        evaluatedBy:'', evaluatedTitle:'',
        evalReviewedBy:'', evalReviewedTitle:'',
        attachments: []
    });

    useEffect(() => {
        if (engagement.ae_number) {
            set('ccRef', formatRef('CC', engagement.ae_number));
        }
        fetchVersions();
        loadLatest();
    }, [engagement.id, engagement.ae_number]);

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/ccl/versions`);
            setVersions(res.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/ccl`);
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
    const setRow = (ri, field, val) => setFormData(fd => ({
        ...fd,
        rows: fd.rows.map((r,i)=>i===ri?{...r,[field]:val}:r)
    }));
    const addRow = () => setFormData(fd => ({ ...fd, rows: [...fd.rows, emptyRow()] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/ccl`, {
                form_data: formData,
                document_type: 'Compliance Checklist (CC)',
                phase: 'execution',
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
        const doc = document.getElementById('ccl-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('textarea, input[type="text"]').forEach(el => {
            const t = document.createTextNode(el.value || ''); el.parentNode.replaceChild(t, el);
        });
        clone.querySelectorAll('input[type="checkbox"]').forEach(el => {
            const t = document.createTextNode(el.checked ? '☑' : '☐'); el.parentNode.replaceChild(t, el);
        });
        clone.querySelectorAll('.hide-on-print').forEach(el => el.remove());
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${clone.innerHTML}</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `CCL_${engagement.title?.replace(/ /g,'_')}.doc`; a.click();
    };

    const handleExportExcel = () => {
        const table = document.getElementById('ccl-table');
        const clone = table.cloneNode(true);
        clone.querySelectorAll('textarea, input[type="text"]').forEach(el => { const t=document.createTextNode(el.value||''); el.parentNode.replaceChild(t, el); });
        clone.querySelectorAll('input[type="checkbox"]').forEach(el => { const t=document.createTextNode(el.checked?'✔':''); el.parentNode.replaceChild(t, el); });
        clone.querySelectorAll('.hide-on-print').forEach(el=>el.remove());
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${clone.outerHTML}</body></html>`;
        const a = document.createElement('a');
        a.href = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
        a.download = `CCL_${engagement.title?.replace(/ /g,'_')}.xls`;
        a.click();
    };



    return (
        <AuditToolWrapper
            toolTitle="Compliance Checklist"
            toolCode="CC"
            phase="Audit Execution"
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
            <div id="ccl-document" className="audit-tool-paper bg-white shadow-2xl w-[1400px] mx-auto my-6 px-12 py-12 font-serif min-h-[1123px]">
                <div className="flex items-center gap-4 mb-8">
                    <img src={DILG_SEAL} className="h-20 w-20" alt="DILG Seal" />
                    <div>
                        <p className="text-xs text-gray-700">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-2xl font-black tracking-wide uppercase">COMPLIANCE CHECKLIST</h1>
                        <p className="text-[10px] text-gray-500 italic">FM-QP-DILG-IAS-33-02 | Rev01 | 09.16.22</p>
                    </div>
                </div>

                <div className="grid grid-cols-[180px_10px_1fr] gap-y-2 mb-8 text-xs font-bold items-center max-w-3xl">
                    {[
                        ['CC Reference No.', 'ccRef', false],
                        ['Audit Engagement No.', 'ae_number', true],
                        ['Audit Engagement Title', 'title', true],
                        ['Auditee Office/s', 'auditee_offices', true],
                        ['Audit Duration', 'auditDuration', false],
                        ['Audit Objective/s', 'auditObjectives', false]
                    ].map(([lbl, field, system]) => (
                        <Fragment key={field}>
                            <div>{lbl}</div>
                            <div>:</div>
                            <div>
                                {field === 'auditee_offices' ? (
                                    <input type="text" className="doc-input font-bold text-indigo-700 uppercase" value={[...new Set(engagement.movs?.map(m => m.auditee?.name).filter(Boolean))].join(', ') || 'N/A'} disabled />
                                ) : (
                                    <input type="text" className="doc-input font-bold uppercase" value={system ? (engagement[field] || '') : formData[field]} onChange={e => !system && set(field, e.target.value)} disabled={system || readOnly} />
                                )}
                            </div>
                        </Fragment>
                    ))}
                </div>

                <div className="mb-4 overflow-x-auto">
                    <table id="ccl-table" className="cc-table w-full text-center text-[11px]" style={{borderCollapse:'collapse'}}>
                        <thead className="bg-slate-50">
                            <tr>
                                <th rowSpan="3" className="w-10 py-2 border border-black">Item<br/>No.</th>
                                <th colSpan="3" className="py-1 border border-black uppercase font-black bg-slate-100">AUDIT PLANNING STAGE</th>
                                <th colSpan="9" className="py-1 border border-black uppercase font-black bg-slate-100">AUDIT EXECUTION STAGE</th>
                            </tr>
                            <tr>
                                <th colSpan="2" className="py-1 border border-black font-black">CRITERIA</th>
                                <th rowSpan="2" className="w-28 px-1 border border-black font-black">Sample MOVs<br/><span className="text-[8px] font-normal">(Evidence)</span></th>
                                <th colSpan="5" className="py-1 border border-black font-black bg-amber-50">Auditee's Self Assessment</th>
                                <th colSpan="4" className="py-1 border border-black font-black bg-indigo-50">Auditor's Evaluation</th>
                            </tr>
                            <tr>
                                <th className="w-48 px-2 py-1 border border-black">Specific Laws/Policy/Guidelines/Standards<br/><span className="text-[8px] font-normal">(hierarchy of laws)</span></th>
                                <th className="w-48 px-2 border border-black">Requirements</th>
                                <th className="w-8 border border-black">Yes</th>
                                <th className="w-8 border border-black">No</th>
                                <th className="w-10 border border-black">N/A</th>
                                <th className="w-56 px-1 border border-black">Supporting Docs / Remarks<br/><span className="text-[8px] font-normal">(for Yes answers)</span></th>
                                <th className="w-32 px-1 border border-black">Remarks/Explanation<br/><span className="text-[8px] font-normal">(for No or N/A)</span></th>
                                <th className="w-8 border border-black">Yes</th>
                                <th className="w-8 border border-black">No</th>
                                <th className="w-10 border border-black">N/A</th>
                                <th className="w-56 px-2 border border-black">Audit Notes<br/><span className="text-[8px] font-normal">(details for all answers)</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.rows.map((row, ri) => (
                                <tr key={ri}>
                                    <td className="font-bold align-middle border border-black">{ri + 1}</td>
                                    <td className="border border-black"><textarea className="tbl-input" value={row.policy} onChange={e=>setRow(ri,'policy',e.target.value)} disabled={readOnly} /></td>
                                    <td className="border border-black"><textarea className="tbl-input" value={row.requirement} onChange={e=>setRow(ri,'requirement',e.target.value)} disabled={readOnly} /></td>
                                    <td className="border border-black"><textarea className="tbl-input" value={row.movs} onChange={e=>setRow(ri,'movs',e.target.value)} disabled={readOnly} /></td>
                                    {['selfYes','selfNo','selfNA'].map(f=><td key={f} className="align-middle border border-black"><input type="checkbox" className="doc-checkbox mx-auto" checked={row[f]} onChange={e=>setRow(ri,f,e.target.checked)} disabled={readOnly}/></td>)}
                                    <td className="border border-black p-1 space-y-1 bg-amber-50/20">
                                        <textarea 
                                            className="tbl-input min-h-[60px]" 
                                            value={row.selfDocs} 
                                            onChange={e=>setRow(ri,'selfDocs',e.target.value)} 
                                            disabled={readOnly} 
                                            placeholder="Description/Remarks..."
                                        />
                                        <div className="no-print">
                                            <MultiFileAttach 
                                                files={row.selfAttachments} 
                                                onUpdate={(files) => setRow(ri, 'selfAttachments', files)}
                                                engagementId={engagement.id}
                                                readOnly={readOnly}
                                            />
                                        </div>
                                    </td>
                                    <td className="border border-black bg-amber-50/20"><textarea className="tbl-input" value={row.selfRemarks} onChange={e=>setRow(ri,'selfRemarks',e.target.value)} disabled={readOnly} /></td>
                                    {['auditorYes','auditorNo','auditorNA'].map(f=><td key={f} className="align-middle border border-black bg-indigo-50/10"><input type="checkbox" className="doc-checkbox mx-auto" checked={row[f]} onChange={e=>setRow(ri,f,e.target.checked)} disabled={readOnly}/></td>)}
                                    <td className="border border-black bg-indigo-50/10"><textarea className="tbl-input" value={row.auditorNotes} onChange={e=>setRow(ri,'auditorNotes',e.target.value)} disabled={readOnly} /></td>
                                </tr>
                            ))}
                            {!readOnly && (
                                <tr className="hide-on-print">
                                    <td colSpan="13" className="text-left font-bold py-1 px-2 bg-slate-50 border border-black">
                                        <button onClick={addRow} className="text-indigo-600 text-[10px] hover:underline font-sans font-black uppercase tracking-widest">+ Add Criteria Row</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <StandardAuditFooter 
                    documentId={selectedVersionId}
                    history={signOffHistory}
                    onSigned={handleSignOffSuccess}
                    readOnly={readOnly}
                    formData={formData}
                    setFormData={set}
                    className="mt-16 pt-12 border-t-2 border-slate-100"
                    sections={[
                        {
                            label: 'Preparation Stage',
                            labelClass: 'bg-indigo-900',
                            signatories: [
                                { label: 'Prepared by', stage: 'prepared', nameField: 'preparedBy', titleField: 'preparedTitle' },
                                { label: 'Reviewed by', stage: 'reviewed', nameField: 'reviewedBy', titleField: 'reviewedTitle' },
                                { label: 'Approved by', stage: 'approved', nameField: 'approvedBy', titleField: 'approvedTitle' }
                            ]
                        },
                        {
                            label: 'Self-Assessment Stage',
                            labelClass: 'bg-amber-600',
                            signatories: [
                                { label: 'Accomplished by', stage: 'accomplished', nameField: 'accomplishedBy', titleField: 'accomplishedTitle' },
                                { label: 'Conformed by', stage: 'conformed', nameField: 'conformedBy', titleField: 'conformedTitle' }
                            ]
                        },
                        {
                            label: 'Evaluation Stage',
                            labelClass: 'bg-emerald-700',
                            signatories: [
                                { label: 'Evaluated by', stage: 'evaluated', nameField: 'evaluatedBy', titleField: 'evaluatedTitle' },
                                { label: 'Reviewed by', stage: 'evalReviewed', nameField: 'evalReviewedBy', titleField: 'evalReviewedTitle' }
                            ]
                        }
                    ]}
                />

            </div>
        </AuditToolWrapper>
    );
}
