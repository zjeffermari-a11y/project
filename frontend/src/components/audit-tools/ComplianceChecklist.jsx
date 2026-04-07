import { useState, useEffect, Fragment } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';

const emptyRow = () => ({
    policy:'', requirement:'', movs:'',
    selfYes:false, selfNo:false, selfNA:false, selfDocs:'', selfRemarks:'',
    auditorYes:false, auditorNo:false, auditorNA:false, auditorNotes:'',
});

export default function ComplianceChecklist({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [formData, setFormData] = useState({
        ccRef: engagement.ae_number ? `CC-${engagement.ae_number}` : `CC-${new Date().getFullYear()}-001`,
        auditDuration: '',
        auditObjectives: '',
        rows: Array(5).fill(null).map(emptyRow),
        // Signature fields (3 columns)
        preparedBy:'', preparedTitle:'',
        reviewedBy:'', reviewedTitle:'',
        approvedBy:'',
        accomplishedBy:'', accomplishedTitle:'',
        conformedBy:'', conformedTitle:'',
        evaluatedBy:'', evaluatedTitle:'',
        evalReviewedBy:'', evalReviewedTitle:'',
    });

    useEffect(() => {
        if (engagement.ae_number && !formData.ccRef.includes(engagement.ae_number)) {
            set('ccRef', `CC-${engagement.ae_number}`);
        }
        const load = async () => {
            try {
                const res = await api.get(`/engagements/${engagement.id}/tools/ccl`);
                if (res.data?.form_data) setFormData(fd => ({ ...fd, ...res.data.form_data }));
            } catch (_) {}
        };
        load();
    }, [engagement.id]);

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    const setRow = (ri, field, val) => setFormData(fd => ({
        ...fd,
        rows: fd.rows.map((r,i)=>i===ri?{...r,[field]:val}:r)
    }));
    const addRow = () => setFormData(fd => ({ ...fd, rows: [...fd.rows, emptyRow()] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/engagements/${engagement.id}/tools/ccl`, {
                form_data: formData,
                document_type: 'Compliance Checklist (CC)',
                phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
        } catch (e) { alert('Save failed: ' + e.message); }
        finally { setSaving(false); }
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

    const SigBlock = ({ label, nameKey, titleKey, note }) => (
        <div className="mb-5">
            <p className="font-bold mb-5 text-[11px]">{label}</p>
            <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold text-[12px]" value={formData[nameKey]} onChange={e=>set(nameKey,e.target.value)} disabled={readOnly} />
            <p className="text-[9px] font-normal italic mt-0.5">{note}</p>
            <input type="text" className="w-full bg-transparent outline-none text-[10px] mt-0.5" value={formData[titleKey]} onChange={e=>set(titleKey,e.target.value)} disabled={readOnly} placeholder="Position" />
        </div>
    );

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
        >
            <div id="ccl-document" className="audit-tool-paper bg-white shadow-2xl w-[1400px] mx-auto my-6 px-12 py-12 font-serif min-h-[1123px]">
                <div className="flex items-center gap-4 mb-8">
                    <img src={DILG_SEAL} className="h-20 w-20" alt="DILG Seal" />
                    <div>
                        <p className="text-xs text-gray-700">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-2xl font-black tracking-wide">COMPLIANCE CHECKLIST</h1>
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
                        <thead className="bg-amber-50/30">
                            <tr>
                                <th rowSpan="3" className="w-10 py-2 border border-black">Item<br/>No.</th>
                                <th colSpan="3" className="py-1 border border-black">AUDIT PLANNING STAGE</th>
                                <th colSpan="9" className="py-1 border border-black">AUDIT EXECUTION STAGE</th>
                            </tr>
                            <tr>
                                <th colSpan="2" className="py-1 border border-black">CRITERIA</th>
                                <th rowSpan="2" className="w-28 px-1 border border-black">Sample MOVs<br/><span className="text-[8px] font-normal">(Evidence)</span></th>
                                <th colSpan="5" className="py-1 border border-black">Auditee's Self Assessment</th>
                                <th colSpan="4" className="py-1 border border-black">Auditor's Evaluation</th>
                            </tr>
                            <tr>
                                <th className="w-48 px-2 py-1 border border-black">Specific Laws/Policy/Guidelines/Standards<br/><span className="text-[8px] font-normal">(hierarchy of laws)</span></th>
                                <th className="w-48 px-2 border border-black">Requirements</th>
                                <th className="w-8 border border-black">Yes</th>
                                <th className="w-8 border border-black">No</th>
                                <th className="w-10 border border-black">N/A</th>
                                <th className="w-32 px-1 border border-black">Supporting Documents<br/><span className="text-[8px] font-normal">(for Yes answers)</span></th>
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
                                    <td className="font-bold align-middle border border-black">{ri}</td>
                                    <td className="border border-black"><textarea className="tbl-input" value={row.policy} onChange={e=>setRow(ri,'policy',e.target.value)} disabled={readOnly} /></td>
                                    <td className="border border-black"><textarea className="tbl-input" value={row.requirement} onChange={e=>setRow(ri,'requirement',e.target.value)} disabled={readOnly} /></td>
                                    <td className="border border-black"><textarea className="tbl-input" value={row.movs} onChange={e=>setRow(ri,'movs',e.target.value)} disabled={readOnly} /></td>
                                    {['selfYes','selfNo','selfNA'].map(f=><td key={f} className="align-middle border border-black"><input type="checkbox" className="doc-checkbox mx-auto" checked={row[f]} onChange={e=>setRow(ri,f,e.target.checked)} disabled={readOnly}/></td>)}
                                    <td className="border border-black"><textarea className="tbl-input" value={row.selfDocs} onChange={e=>setRow(ri,'selfDocs',e.target.value)} disabled={readOnly} /></td>
                                    <td className="border border-black"><textarea className="tbl-input" value={row.selfRemarks} onChange={e=>setRow(ri,'selfRemarks',e.target.value)} disabled={readOnly} /></td>
                                    {['auditorYes','auditorNo','auditorNA'].map(f=><td key={f} className="align-middle border border-black"><input type="checkbox" className="doc-checkbox mx-auto" checked={row[f]} onChange={e=>setRow(ri,f,e.target.checked)} disabled={readOnly}/></td>)}
                                    <td className="border border-black"><textarea className="tbl-input" value={row.auditorNotes} onChange={e=>setRow(ri,'auditorNotes',e.target.value)} disabled={readOnly} /></td>
                                </tr>
                            ))}
                            {!readOnly && (
                                <tr className="hide-on-print">
                                    <td colSpan="13" className="text-left font-bold py-1 px-2 bg-amber-50/30 border border-black">
                                        <button onClick={addRow} className="text-indigo-600 text-[10px] hover:underline font-sans font-bold">+ Add Row</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-3 gap-8 mt-8 text-xs font-bold text-black border-t border-black pt-5">
                    {/* Col 1: CC Preparation */}
                    <div>
                        <p className="mb-4 italic text-[11px]">For CC Preparation</p>
                        <SigBlock label="Prepared by" nameKey="preparedBy" titleKey="preparedTitle" note="Auditor's Name over Signature/Date" />
                        <SigBlock label="Reviewed by" nameKey="reviewedBy" titleKey="reviewedTitle" note="Team Leader's Name over Signature/Date" />
                        <div className="mb-5">
                            <p className="font-bold mb-5 text-[11px]">Approved by</p>
                            <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold text-[12px]" value={formData.approvedBy} onChange={e=>set('approvedBy',e.target.value)} disabled={readOnly} />
                            <p className="text-[9px] font-normal italic mt-0.5">Head of Internal Audit Service/Date</p>
                        </div>
                    </div>
                    {/* Col 2: Self-Assessment */}
                    <div>
                        <p className="mb-4 italic text-[11px]">For CC Self-Assessment</p>
                        <SigBlock label="Accomplished by" nameKey="accomplishedBy" titleKey="accomplishedTitle" note="Auditee's Representative Name over Signature/Date" />
                        <SigBlock label="Conformed by" nameKey="conformedBy" titleKey="conformedTitle" note="Auditee's Immediate Supervisor Name over Signature/Date" />
                    </div>
                    {/* Col 3: Evaluation */}
                    <div>
                        <p className="mb-4 italic text-[11px]">For CC Evaluation</p>
                        <SigBlock label="Evaluated by" nameKey="evaluatedBy" titleKey="evaluatedTitle" note="Auditor's Name over Signature/Date" />
                        <SigBlock label="Reviewed by" nameKey="evalReviewedBy" titleKey="evalReviewedTitle" note="Team Leader's Name over Signature/Date" />
                    </div>
                </div>
            </div>
        </AuditToolWrapper>
    );
}
