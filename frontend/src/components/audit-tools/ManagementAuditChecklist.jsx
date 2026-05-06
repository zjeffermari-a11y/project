import { useState, useEffect, Fragment } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import MultiFileAttach from './MultiFileAttach';
import { formatRef } from '../../utils/formatters';
import StandardAuditFooter from '../common/StandardAuditFooter';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';

const CheckRow = ({ num, row, onChange, readOnly, engagementId }) => (
    <tr>
        <td className="text-center font-bold">{num}</td>
        <td><textarea className="tbl-input" value={row.policy} onChange={e=>onChange('policy',e.target.value)} disabled={readOnly} /></td>
        <td><textarea className="tbl-input" value={row.requirement} onChange={e=>onChange('requirement',e.target.value)} disabled={readOnly} /></td>
        <td className="p-1 space-y-1">
            <textarea 
                className="tbl-input min-h-[50px]" 
                value={row.movs} 
                onChange={e=>onChange('movs',e.target.value)} 
                disabled={readOnly} 
                placeholder="Description..."
            />
            <MultiFileAttach 
                files={row.attachments} 
                onUpdate={(files) => onChange('attachments', files)}
                engagementId={engagementId}
                readOnly={readOnly}
            />
        </td>
        <td className="text-center align-middle"><input type="checkbox" className="doc-checkbox" checked={row.yes} onChange={e=>onChange('yes',e.target.checked)} disabled={readOnly} /></td>
        <td className="text-center align-middle"><input type="checkbox" className="doc-checkbox" checked={row.no} onChange={e=>onChange('no',e.target.checked)} disabled={readOnly} /></td>
        <td className="text-center align-middle"><input type="checkbox" className="doc-checkbox" checked={row.na} onChange={e=>onChange('na',e.target.checked)} disabled={readOnly} /></td>
        <td><textarea className="tbl-input" value={row.notes} onChange={e=>onChange('notes',e.target.value)} disabled={readOnly} /></td>
    </tr>
);

const emptyRow = () => ({ policy:'', requirement:'', movs:'', attachments:[], yes:false, no:false, na:false, notes:'' });

const CATEGORIES_MAC = [
    { label: '1. GENERAL MANAGEMENT', count: 5 },
    { label: '2. FINANCIAL MANAGEMENT', count: 6 },
    { label: '3. HUMAN RESOURCE MANAGEMENT', count: 7 },
    { label: '4. RECORDS MANAGEMENT', count: 4 },
    { label: '5. PROPERTY CUSTODIANSHIP', count: 5 },
];

export default function ManagementAuditChecklist({ engagement, user, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [versions, setVersions] = useState([]);
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [signOffHistory, setSignOffHistory] = useState([]);

    const initRows = () => {
        const obj = {};
        CATEGORIES_MAC.forEach(cat => { obj[cat.label] = Array(cat.count).fill(null).map(emptyRow); });
        return obj;
    };

    const [formData, setFormData] = useState({
        macRef: formatRef('MAC', engagement.ae_number),
        preparedBy: '', reviewedBy: '', approvedBy: '',
        preparedTitle: '', reviewedTitle: 'Team Leader', approvedTitle: 'IAS Director',
        rows: initRows(),
        attachments: [],
    });

    useEffect(() => {
        if (engagement.ae_number) {
            set('macRef', formatRef('MAC', engagement.ae_number));
        }
        fetchVersions();
        loadLatest();
    }, [engagement.id, engagement.ae_number]);

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/mac/versions`);
            setVersions(res.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/mac`);
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
            const res = await api.post(`/engagements/${engagement.id}/tools/mac`, {
                form_data: formData,
                document_type: 'Management Audit Checklist (MAC)',
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
            versions={versions}
            selectedVersionId={selectedVersionId}
            onVersionSelect={handleVersionSelect}
        >
            <div id="mac-document" className="audit-tool-paper bg-white shadow-2xl w-[1300px] mx-auto my-6 px-12 py-12 font-serif min-h-[1123px]">
                <div className="flex items-center gap-4 mb-8">
                    <img src={DILG_SEAL} className="h-20 w-20" alt="DILG Seal" />
                    <div>
                        <p className="text-[11px] text-gray-800 uppercase font-bold">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-2xl font-black tracking-wide uppercase">MANAGEMENT AUDIT CHECKLIST</h1>
                        <p className="text-[9px] text-gray-500 italic">FM-QP-DILG-IAS-33-07A | Rev01 | 09.16.22</p>
                    </div>
                </div>

                <div className="grid grid-cols-[180px_10px_1fr] gap-y-2 mb-8 text-xs font-bold items-center max-w-3xl">
                    {[
                        ['MAC Reference No.', 'macRef', false],
                        ['Audit Engagement No.', 'ae_number', true],
                        ['Audit Engagement Title', 'title', true],
                        ['Auditee Office/s', 'auditee_offices', true],
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

                <div className="overflow-x-auto mb-8">
                    <table className="oac-table w-full border-collapse border border-black text-[11px]">
                        <thead className="bg-slate-50">
                            <tr>
                                <th rowSpan="3" className="w-10 border border-black bg-slate-100 font-black">Item<br/>No.</th>
                                <th colSpan="3" className="border border-black bg-slate-100 uppercase font-black">AUDIT PLANNING STAGE*</th>
                                <th colSpan="4" className="border border-black bg-slate-100 uppercase font-black">AUDIT EXECUTION STAGE</th>
                            </tr>
                            <tr>
                                <th colSpan="2" className="border border-black font-black">Criteria</th>
                                <th rowSpan="2" className="w-64 border border-black font-black">MOVs / Remarks</th>
                                <th rowSpan="2" className="w-8 border border-black font-black bg-indigo-50/10">Yes</th>
                                <th rowSpan="2" className="w-8 border border-black font-black bg-indigo-50/10">No</th>
                                <th rowSpan="2" className="w-10 border border-black font-black bg-indigo-50/10">N/A</th>
                                <th rowSpan="2" className="w-72 border border-black font-black bg-amber-50/10">Audit Notes</th>
                            </tr>
                            <tr>
                                <th className="w-64 border border-black font-black">Specific Laws/Policy/Guidelines/Standards</th>
                                <th className="w-64 border border-black font-black">Requirements</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CATEGORIES_MAC.map(cat => (
                                <Fragment key={cat.label}>
                                    <tr className="bg-slate-50">
                                        <td className="border border-black"></td>
                                        <td colSpan="7" className="px-3 py-1.5 font-black uppercase tracking-wider border border-black bg-slate-200/50">{cat.label}</td>
                                    </tr>
                                    {formData.rows[cat.label]?.map((row, ri) => (
                                        <CheckRow key={ri} num={itemNo++} row={row} onChange={(f,v)=>setRow(cat.label,ri,f,v)} readOnly={readOnly} engagementId={engagement.id} />
                                    ))}
                                    {!readOnly && (
                                        <tr className="hide-on-print">
                                            <td colSpan="8" className="p-1 border border-black bg-slate-50/30">
                                                <button onClick={() => addRow(cat.label)} className="text-indigo-600 text-[10px] hover:underline font-sans font-black uppercase tracking-widest pl-2">+ Add Row to {cat.label}</button>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
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
                    className="mt-16"
                    signatories={[
                        { label: 'Prepared by', stage: 'prepared', nameField: 'preparedBy', titleField: 'preparedTitle' },
                        { label: 'Reviewed by', stage: 'reviewed', nameField: 'reviewedBy', titleField: 'reviewedTitle' },
                        { label: 'Approved by', stage: 'approved', nameField: 'approvedBy', titleField: 'approvedTitle' }
                    ]}
                />

            </div>
        </AuditToolWrapper>
    );
}
