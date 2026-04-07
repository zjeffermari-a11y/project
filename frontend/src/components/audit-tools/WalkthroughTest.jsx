import { useState, useEffect, Fragment } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';

const emptyIccRow = () => ({ ccRef:'', activity:'', attributes:'', movs:'', procedure:'', docs:'', notes:'' });
const emptyProcRow = () => ({ actNo:'', activity:'', attributes:'', movs:'', procedure:'', docs:'', notes:'' });

export default function WalkthroughTest({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [formData, setFormData] = useState({
        wtRef: `WT-${new Date().getFullYear()}-001`,
        agency: '',
        titleProcess: '',
        participant: '',
        dates: '',
        iccRows: Array(3).fill(null).map(emptyIccRow),
        processRows: Array(3).fill(null).map(emptyProcRow),
        quality: { correct:'', complete:'', clear:'', concise:'', coherent:'', total:'' },
        // Signatures
        preparedBy:'', preparedTitle:'',
        reviewedBy:'', reviewedTitle:'',
        accomplishedBy:'', accomplishedTitle:'',
        conformedBy:'', conformedTitle:'',
        performedBy:'', performedTitle:'',
        evalReviewedBy:'', evalReviewedTitle:'',
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get(`/engagements/${engagement.id}/tools/wt`);
                if (res.data?.form_data) setFormData(fd => ({ ...fd, ...res.data.form_data }));
            } catch (_) {}
        };
        load();
    }, [engagement.id]);

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    const setQuality = (field, val) => setFormData(fd => ({ ...fd, quality: { ...fd.quality, [field]: val } }));
    const setIcc = (ri, field, val) => setFormData(fd => ({ ...fd, iccRows: fd.iccRows.map((r,i)=>i===ri?{...r,[field]:val}:r) }));
    const setProc = (ri, field, val) => setFormData(fd => ({ ...fd, processRows: fd.processRows.map((r,i)=>i===ri?{...r,[field]:val}:r) }));
    const addIcc = () => setFormData(fd => ({ ...fd, iccRows: [...fd.iccRows, emptyIccRow()] }));
    const addProc = () => setFormData(fd => ({ ...fd, processRows: [...fd.processRows, emptyProcRow()] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/engagements/${engagement.id}/tools/wt`, {
                form_data: formData,
                document_type: 'Walkthrough Test (WT)',
                phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
        } catch (e) { alert('Save failed: ' + e.message); }
        finally { setSaving(false); }
    };

    const exportDoc = (type) => {
        const doc = document.getElementById('wt-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('textarea, input[type="text"]').forEach(el => { const t=document.createTextNode(el.value||''); el.parentNode.replaceChild(t,el); });
        clone.querySelectorAll('.hide-on-print').forEach(el=>el.remove());
        if (type==='word') {
            const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${clone.innerHTML}</body></html>`;
            const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `WT_${engagement.title?.replace(/ /g,'_')}.doc`; a.click();
        } else {
            const tables = clone.querySelectorAll('table');
            let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body><h2>WALKTHROUGH TEST</h2>`;
            tables.forEach(t => { html += t.outerHTML + '<br><br>'; });
            html += '</body></html>';
            const a = document.createElement('a');
            a.href = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
            a.download = `WT_${engagement.title?.replace(/ /g,'_')}.xls`;
            a.click();
        }
    };

    const SigCol = ({ label, note, nameKey, titleKey, color='black' }) => (
        <div>
            <p className="font-bold mb-4" style={{color}}>{label}</p>
            <input type="text" className="w-full bg-transparent outline-none font-bold mb-1" style={{borderBottom:`1px solid ${color}`, color}} value={formData[nameKey]} onChange={e=>set(nameKey,e.target.value)} disabled={readOnly} />
            <p className="text-[9px] italic" style={{color}}>{note}</p>
            <input type="text" className="w-full bg-transparent outline-none text-[9px] italic mt-0.5" style={{color}} value={formData[titleKey]} onChange={e=>set(titleKey,e.target.value)} disabled={readOnly} placeholder="Position" />
        </div>
    );

    const TableHeaders = () => (
        <thead>
            <tr className="bg-slate-200">
                <th colSpan="6" className="py-2 border border-black text-[10px]">AUDIT PLANNING</th>
                <th colSpan="2" className="py-2 border border-black text-[10px]">AUDIT EXECUTION</th>
            </tr>
            <tr>
                <th className="w-8 border border-black text-[9px]">Item<br/>No.</th>
                <th className="w-20 border border-black text-[9px]">Ref. No.</th>
                <th className="w-48 border border-black text-[9px]">Activity/Statement</th>
                <th className="w-48 border border-black text-[9px]">Control Attributes<br/>A2R4C2SM* / VaCATE**</th>
                <th className="w-40 border border-black text-[9px]">Sample MOV</th>
                <th className="w-40 border border-black text-[9px]">Walkthrough Procedure</th>
                <th className="w-52 border border-black text-[9px]">Documents Examined</th>
                <th className="w-52 border border-black text-[9px]">Audit Notes</th>
            </tr>
        </thead>
    );

    return (
        <AuditToolWrapper
            toolTitle="Walkthrough Test"
            toolCode="WT"
            phase="Audit Execution"
            engagementTitle={engagement.title}
            onSave={handleSave}
            onExportWord={()=>exportDoc('word')}
            onExportExcel={()=>exportDoc('excel')}
            isSaving={saving}
            lastSaved={lastSaved}
            readOnly={readOnly}
        >
            <div id="wt-document" className="audit-tool-paper bg-white shadow-2xl w-[1400px] mx-auto my-6 px-12 py-12 font-serif min-h-[1123px]">
                <div className="flex items-center gap-4 mb-6">
                    <img src={DILG_SEAL} className="h-16 w-16" alt="DILG Seal" />
                    <div>
                        <p className="text-[11px] text-gray-800">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-xl font-black tracking-wide">WALKTHROUGH TEST</h1>
                        <p className="text-[8px] text-gray-500 italic">FM-QP-DILG-IAS-33-09 | Rev01 | 10.10.22</p>
                    </div>
                </div>

                <div className="grid grid-cols-[180px_10px_400px] gap-y-1 mb-6 text-[11px] font-bold items-center">
                    {[
                        ['WT Reference No.', 'wtRef', false],
                        ['Audit Engagement No.', 'ae_number', true],
                        ['Audit Engagement Title', 'title', true],
                        ['Auditee Office/s', 'auditee_offices', true],
                        ['Title of Process/System', 'titleProcess', false],
                        ['Walkthrough Participant(s)', 'participant', false],
                        ['Walkthrough Date/s', 'dates', false]
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

                {/* Section A - ICC */}
                <p className="font-bold text-[11px] italic mb-1 mt-4">A. For ICC</p>
                <div className="overflow-x-auto">
                    <table className="oac-table mb-8">
                        <TableHeaders />
                        <tbody>
                            <tr className="cat-header">
                                <td></td>
                                <td colSpan="7" className="flex justify-between items-center">
                                    <span>Controls from CC/ICC</span>
                                    {!readOnly && <button onClick={addIcc} className="text-indigo-600 text-[9px] hover:underline normal-case font-bold ml-2 hide-on-print">+ Add Row</button>}
                                </td>
                            </tr>
                            {formData.iccRows.map((row, ri) => (
                                <tr key={ri}>
                                    <td className="text-center font-bold border border-black small">{ri}</td>
                                    {[['ccRef','text','text-center'],['activity','textarea',null],['attributes','textarea',null],['movs','textarea',null],['procedure','textarea',null],['docs','textarea',null],['notes','textarea',null]].map(([f,type,cls])=>(
                                        <td key={f} className="border border-black">
                                            {type==='textarea'
                                                ? <textarea className="tbl-input" value={row[f]} onChange={e=>setIcc(ri,f,e.target.value)} disabled={readOnly} />
                                                : <input type="text" className={`tbl-input ${cls||''}`} value={row[f]} onChange={e=>setIcc(ri,f,e.target.value)} disabled={readOnly} />
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Section B - Process */}
                <p className="font-bold text-[11px] italic mb-1">B. For Process</p>
                <div className="overflow-x-auto">
                    <table className="oac-table mb-6">
                        <TableHeaders />
                        <tbody>
                            <tr className="cat-header">
                                <td></td>
                                <td colSpan="7" className="flex justify-between items-center">
                                    <span>Controls from Process</span>
                                    {!readOnly && <button onClick={addProc} className="text-indigo-600 text-[9px] hover:underline normal-case font-bold ml-2 hide-on-print">+ Add Row</button>}
                                </td>
                            </tr>
                            {formData.processRows.map((row, ri) => (
                                <tr key={ri}>
                                    <td className="text-center font-bold border border-black small">{ri}</td>
                                    {[['actNo','text','text-center'],['activity','textarea',null],['attributes','textarea',null],['movs','textarea',null],['procedure','textarea',null],['docs','textarea',null],['notes','textarea',null]].map(([f,type,cls])=>(
                                        <td key={f} className="border border-black">
                                            {type==='textarea'
                                                ? <textarea className="tbl-input" value={row[f]} onChange={e=>setProc(ri,f,e.target.value)} disabled={readOnly} />
                                                : <input type="text" className={`tbl-input ${cls||''}`} value={row[f]} onChange={e=>setProc(ri,f,e.target.value)} disabled={readOnly} />
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legend + Quality table */}
                <div className="flex justify-between items-start mb-8">
                    <div className="w-2/3 pr-8 pt-2">
                        <p className="text-[8px] mb-1"><span className="font-bold">*Activity Controls (AC)–</span> Authorization/Approval/Recording/Review/Reporting/Reconciliation/Custody/Comparison/Segregation/Monitoring</p>
                        <p className="text-[8px]"><span className="font-bold">**Quality Controls (QC)–</span> Validity/Completeness/Accuracy/Timeliness/Existence</p>
                    </div>
                    <table className="border-collapse w-72 text-[10px]" style={{border:'1px solid #000'}}>
                        <thead>
                            <tr className="bg-slate-200">
                                <th className="text-left py-1 px-2 border border-black">Quality of Workpaper</th>
                                <th className="text-center w-24 border border-black">Pointing (1 or 0)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {['correct','complete','clear','concise','coherent'].map(f=>(
                                <tr key={f}>
                                    <td className="font-bold px-2 py-1 border border-black capitalize">{f}</td>
                                    <td className="border border-black"><input type="text" className="w-full text-center outline-none bg-transparent" value={formData.quality[f]} onChange={e=>setQuality(f,e.target.value)} disabled={readOnly} /></td>
                                </tr>
                            ))}
                            <tr className="bg-slate-200">
                                <td className="font-bold px-2 py-1 border border-black">Total (WP) Rating</td>
                                <td className="border border-black"><input type="text" className="w-full text-center outline-none bg-transparent font-bold" value={formData.quality.total} onChange={e=>setQuality('total',e.target.value)} disabled={readOnly} /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-x-12 text-[10px] font-serif mt-4">
                    <div className="space-y-8">
                        <div><p className="italic text-gray-500 mb-2 text-[9px]">For preparation</p><SigCol label="Prepared by:" note="Auditor's Name over Signature/Date" nameKey="preparedBy" titleKey="preparedTitle" /></div>
                        <div className="mt-8"><SigCol label="Reviewed by:" note="Team Leader's Name over Signature/Date" nameKey="reviewedBy" titleKey="reviewedTitle" /></div>
                    </div>
                    <div className="space-y-8 pt-6">
                        <SigCol label="Accomplished by:" note="Auditee's Representative Name over Signature/Date" nameKey="accomplishedBy" titleKey="accomplishedTitle" color="darkred" />
                        <div className="mt-8"><SigCol label="Conformed by:" note="Auditee's Immediate Supervisor Name over Signature/Date" nameKey="conformedBy" titleKey="conformedTitle" color="darkred" /></div>
                    </div>
                    <div className="space-y-8 pt-6">
                        <SigCol label="Performed by:" note="Auditor's Name over Signature/Date" nameKey="performedBy" titleKey="performedTitle" />
                        <div className="mt-8"><SigCol label="Reviewed by:" note="Team Leader's Name over Signature/Date" nameKey="evalReviewedBy" titleKey="evalReviewedTitle" /></div>
                    </div>
                </div>
            </div>
        </AuditToolWrapper>
    );
}
