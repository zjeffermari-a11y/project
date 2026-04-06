import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';

const CheckRow = ({ num, row, onChange, readOnly }) => (
    <tr>
        <td className="text-center font-bold">{num}</td>
        <td><textarea className="tbl-input" value={row.policy} onChange={e=>onChange('policy',e.target.value)} disabled={readOnly} /></td>
        <td><textarea className="tbl-input" value={row.requirement} onChange={e=>onChange('requirement',e.target.value)} disabled={readOnly} /></td>
        <td><textarea className="tbl-input" value={row.movs} onChange={e=>onChange('movs',e.target.value)} disabled={readOnly} /></td>
        <td className="text-center align-middle"><input type="checkbox" className="doc-checkbox" checked={row.yes} onChange={e=>onChange('yes',e.target.checked)} disabled={readOnly} /></td>
        <td className="text-center align-middle"><input type="checkbox" className="doc-checkbox" checked={row.no} onChange={e=>onChange('no',e.target.checked)} disabled={readOnly} /></td>
        <td className="text-center align-middle"><input type="checkbox" className="doc-checkbox" checked={row.na} onChange={e=>onChange('na',e.target.checked)} disabled={readOnly} /></td>
        <td><textarea className="tbl-input" value={row.notes} onChange={e=>onChange('notes',e.target.value)} disabled={readOnly} /></td>
    </tr>
);

const emptyRow = () => ({ policy:'', requirement:'', movs:'', yes:false, no:false, na:false, notes:'' });

const CATEGORIES_MAC = [
    { label: '1. GENERAL MANAGEMENT', count: 5 },
    { label: '2. FINANCIAL MANAGEMENT', count: 6 },
    { label: '3. HUMAN RESOURCE MANAGEMENT', count: 7 },
    { label: '4. RECORDS MANAGEMENT', count: 4 },
    { label: '5. PROPERTY CUSTODIANSHIP', count: 5 },
];

export default function ManagementAuditChecklist({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    const initRows = () => {
        const obj = {};
        CATEGORIES_MAC.forEach(cat => { obj[cat.label] = Array(cat.count).fill(null).map(emptyRow); });
        return obj;
    };

    const [formData, setFormData] = useState({
        macRef: `MAC-${new Date().getFullYear()}-001`,
        preparedBy: '', reviewedBy: '', approvedBy: '',
        rows: initRows(),
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get(`/engagements/${engagement.id}/tools/mac`);
                if (res.data?.form_data) setFormData(fd => ({ ...fd, ...res.data.form_data }));
            } catch (_) {}
        };
        load();
    }, [engagement.id]);

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    const setRow = (cat, ri, field, val) => setFormData(fd => ({
        ...fd,
        rows: { ...fd.rows, [cat]: fd.rows[cat].map((r,i) => i===ri ? {...r,[field]:val} : r) }
    }));
    const addRow = (cat) => setFormData(fd => ({
        ...fd,
        rows: { ...fd.rows, [cat]: [...fd.rows[cat], emptyRow()] }
    }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/engagements/${engagement.id}/tools/mac`, {
                form_data: formData,
                document_type: 'Management Audit Checklist (MAC)',
                phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
        } catch (e) { alert('Save failed: ' + e.message); }
        finally { setSaving(false); }
    };

    const handleExportWord = () => {
        const doc = document.getElementById('mac-document');
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
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `MAC_${engagement.title?.replace(/ /g,'_')}.doc`; a.click();
    };

    const handleExportExcel = () => {
        const doc = document.getElementById('mac-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('textarea, input[type="text"]').forEach(el => { const t = document.createTextNode(el.value || ''); el.parentNode.replaceChild(t, el); });
        clone.querySelectorAll('input[type="checkbox"]').forEach(el => { const t = document.createTextNode(el.checked ? '✔' : ''); el.parentNode.replaceChild(t, el); });
        clone.querySelectorAll('.hide-on-print').forEach(el => el.remove());
        const table = clone.querySelector('table');
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${table?.outerHTML}</body></html>`;
        const a = document.createElement('a');
        a.href = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
        a.download = `MAC_${engagement.title?.replace(/ /g,'_')}.xls`;
        a.click();
    };

    let itemNo = 0;

    return (
        <AuditToolWrapper
            toolTitle="Management Audit Checklist"
            toolCode="MAC"
            phase="Audit Execution"
            engagementTitle={engagement.title}
            onSave={handleSave}
            onExportWord={handleExportWord}
            onExportExcel={handleExportExcel}
            isSaving={saving}
            lastSaved={lastSaved}
            readOnly={readOnly}
        >
            <div id="mac-document" className="audit-tool-paper bg-white shadow-2xl w-[1300px] mx-auto my-6 px-12 py-12 font-serif">
                <div className="flex items-center gap-4 mb-6">
                    <img src={DILG_SEAL} className="h-16 w-16" alt="DILG Seal" />
                    <div>
                        <p className="text-[11px] text-gray-800">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-xl font-black tracking-wide">MANAGEMENT AUDIT CHECKLIST</h1>
                        <p className="text-[9px] text-gray-500 italic">FM-QP-DILG-IAS-33-07A | Rev01 | 09.16.22</p>
                    </div>
                </div>

                <div className="grid grid-cols-[180px_10px_400px] gap-y-1 mb-8 text-xs font-bold items-center">
                    <div>MAC Reference No.</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold" value={formData.macRef} onChange={e=>set('macRef',e.target.value)} disabled={readOnly} /></div>
                    <div>Audit Engagement No.</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold" value={engagement.ae_number || 'System Generated'} disabled /></div>
                    <div>Audit Engagement Title</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold" value={engagement.title || ''} disabled /></div>
                </div>

                <div className="overflow-x-auto">
                    <table className="oac-table">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th rowSpan="3" className="w-8">Item<br/>No.</th>
                                <th colSpan="3">AUDIT PLANNING STAGE*</th>
                                <th colSpan="4">AUDIT EXECUTION STAGE</th>
                            </tr>
                            <tr>
                                <th colSpan="2">Criteria</th>
                                <th rowSpan="2" className="w-48">MOVs</th>
                                <th rowSpan="2" className="w-8">Yes</th>
                                <th rowSpan="2" className="w-8">No</th>
                                <th rowSpan="2" className="w-10">N/A</th>
                                <th rowSpan="2" className="w-64">Audit Notes</th>
                            </tr>
                            <tr>
                                <th className="w-72">Specific Laws/Policy/Guidelines/Standards</th>
                                <th className="w-64">Requirements</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CATEGORIES_MAC.map(cat => (
                                <>
                                    <tr key={cat.label} className="cat-header">
                                        <td></td>
                                        <td colSpan="7">{cat.label}</td>
                                    </tr>
                                    {formData.rows[cat.label]?.map((row, ri) => {
                                        itemNo++;
                                        return <CheckRow key={ri} num={itemNo} row={row} onChange={(f,v)=>setRow(cat.label,ri,f,v)} readOnly={readOnly} />;
                                    })}
                                    {!readOnly && (
                                        <tr className="hide-on-print">
                                            <td colSpan="8" className="p-1">
                                                <button onClick={() => addRow(cat.label)} className="text-indigo-600 text-[10px] hover:underline font-sans font-bold pl-2">+ Add Row</button>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-12 text-[12px] font-serif space-y-10 w-1/3 min-w-[300px]">
                    {[['Prepared by:','preparedBy',"Auditor's Name Over Signature/Date"],['Reviewed by:','reviewedBy','Team Leader Over Signature/Date'],['Approved by:','approvedBy','IAS Director Over Signature/Date']].map(([lbl,key,role]) => (
                        <div key={key}>
                            <p className="font-bold mb-8">{lbl}</p>
                            <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold" value={formData[key]} onChange={e=>set(key,e.target.value)} disabled={readOnly} />
                            <p className="mt-1 italic">{role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </AuditToolWrapper>
    );
}
