import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import MultiFileAttach from './MultiFileAttach';
import { formatRef } from '../../utils/formatters';
import StandardAuditFooter from '../common/StandardAuditFooter';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';



export default function InventoryMOVs({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [versions, setVersions] = useState([]);
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [formData, setFormData] = useState({
        iomRef: formatRef('IOM', engagement.ae_number),
        auditArea: '',
        auditTeam: '',
        initialDate: '',
        additionalDate: '',
        initialRows: Array(5).fill(null).map(() => ['', '', '', '', []]),
        additionalRows: Array(4).fill(null).map(() => ['', '', '', '', []]),
        attachments: []
    });

    useEffect(() => {
        if (engagement.ae_number) {
            const team = engagement.users?.map(u => u.name).join(', ') || '';
            const offices = engagement.offices?.map(o => o.name).join(', ') || '';
            
            setFormData(fd => ({
                ...fd,
                iomRef: formatRef('IOM', engagement.ae_number),
                auditTeam: team,
                auditArea: offices || fd.auditArea
            }));
        }
        fetchVersions();
        loadLatest();
    }, [engagement.id, engagement.ae_number, engagement.users]);

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/iom/versions`);
            setVersions(res.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/iom`);
            if (res.data?.form_data) {
                setFormData(fd => ({ ...fd, ...res.data.form_data }));
                setSignatureHistory(res.data.signatures || []);
                setSelectedVersionId(res.data.id);
            }
        } catch (_) { /* no saved data yet */ }
    };

    const handleVersionSelect = async (versionId) => {
        try {
            const docRes = await api.get(`/engagements/${engagement.id}/documents`);
            const target = docRes.data.find(d => d.id === parseInt(versionId));
            if (target && target.form_data) {
                setFormData(target.form_data);
                setSignatureHistory(target.signatures || []);
                setSelectedVersionId(versionId);
            }
        } catch (e) { alert('Failed to load version: ' + e.message); }
    };

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    const setRow = (key, ri, ci, val) => setFormData(fd => ({
        ...fd,
        [key]: fd[key].map((r, i) => i === ri ? r.map((c, j) => j === ci ? val : c) : r)
    }));
    const addRow = (key) => setFormData(fd => ({ ...fd, [key]: [...fd[key], ['', '', '', '', []]] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/iom`, {
                form_data: formData,
                document_type: 'Inventory of MOVs (IM)',
                phase: 'planning',
            });
            setLastSaved(new Date().toLocaleTimeString());
            fetchVersions();
            if (res.data.tool) setSelectedVersionId(res.data.tool.id);
        } catch (e) { alert('Save failed: ' + e.message); }
        finally { setSaving(false); }
    };

    const handleExportWord = () => {
        const doc = document.getElementById('iom-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('textarea, input').forEach(el => {
            const t = document.createTextNode(el.value || '');
            el.parentNode.replaceChild(t, el);
        });
        clone.querySelectorAll('.hide-on-print').forEach(el => el.remove());
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${clone.innerHTML}</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `IOM_${engagement.title?.replace(/ /g,'_')}.doc`; a.click();
    };

    const handleExportExcel = () => {
        const doc = document.getElementById('iom-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('textarea, input').forEach(el => {
            const t = document.createTextNode(el.value || '');
            el.parentNode.replaceChild(t, el);
        });
        clone.querySelectorAll('.hide-on-print').forEach(el => el.remove());
        const tables = clone.querySelectorAll('table');
        let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body><h2>INVENTORY OF MOVs</h2>`;
        tables.forEach(t => { html += t.outerHTML + '<br><br>'; });
        html += '</body></html>';
        const a = document.createElement('a');
        a.href = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
        a.download = `IOM_${engagement.title?.replace(/ /g,'_')}.xls`;
        a.click();
    };

    const Row = ({ val, onChange, placeholder, disabled }) => (
        <textarea className="tbl-input" value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled || readOnly} />
    );
    const InRow = ({ val, onChange }) => (
        <input type="text" className="tbl-input text-center" value={val} onChange={e => onChange(e.target.value)} disabled={readOnly} />
    );

    return (
        <AuditToolWrapper
            toolTitle="Inventory of MOVs"
            toolCode="IOM"
            phase="Audit Planning"
            engagementTitle={engagement.title}
            onSave={handleSave}
            onExportWord={handleExportWord}
            onExportExcel={handleExportExcel}
            isSaving={saving}
            lastSaved={lastSaved}
            readOnly={readOnly || !!selectedVersionId}
            versions={versions}
            selectedVersionId={selectedVersionId}
            onVersionSelect={handleVersionSelect}
        >
            <div id="iom-document" className="audit-tool-paper bg-white shadow-2xl w-[900px] mx-auto my-6 px-12 py-12 font-serif min-h-[1123px]">
                <div className="flex items-center gap-4 mb-10">
                    <img src={DILG_SEAL} className="h-16 w-16" alt="DILG Seal" />
                    <div>
                        <p className="text-[10px] text-gray-800">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-xl font-black tracking-wide">INVENTORY OF MOVs</h1>
                        <p className="text-[9px] text-gray-500 italic">FM-QP-DILG-IAS-33-22 | Rev00 | 09.16.22</p>
                    </div>
                </div>

                <div className="grid grid-cols-[180px_10px_1fr] gap-y-1 mb-8 text-[12px] font-bold items-center max-w-2xl">
                    <div>IoM Reference No.</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold" value={formData.iomRef} onChange={e=>set('iomRef',e.target.value)} disabled={readOnly} /></div>
                    <div>Audit Engagement No.</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold" value={engagement.ae_number || `AE-${new Date().getFullYear()}-XXX`} disabled /></div>
                    <div>Audit Engagement Title</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold uppercase" value={engagement.title || ''} disabled /></div>
                    <div>Auditee Office/s</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold text-indigo-700" value={[...new Set(engagement.movs?.map(m => m.auditee?.name).filter(Boolean))].join(', ') || 'N/A'} disabled /></div>
                    <div>Audit Team</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold" value={engagement.users?.map(u => u.name).join(', ') || 'IAS TEAM'} disabled /></div>
                </div>

                <table className="iom-table mb-6">
                    <thead>
                        <tr>
                            <th className="w-8">No.</th>
                            <th className="w-[35%]">Documents/Records Requested<br /><span className="font-normal text-[9px] italic">(Generic name of the documents)</span></th>
                            <th className="w-[18%]">Type of Submission<br /><span className="font-normal text-[9px] italic">(Online/Physical/Both)</span></th>
                            <th className="w-[15%]">Date Submitted</th>
                            <th className="w-[32%]">Actual Documents/Remarks<br /><span className="font-normal text-[9px] italic">(Description; indicate whether sufficient or insufficient)</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-slate-100/50">
                            <td></td>
                            <td colSpan="4" className="font-bold text-[11px] py-2">
                                Initial Documents/Records: (Date requested:&nbsp;
                                <input type="text" className="bg-transparent border-b border-black outline-none w-28 font-bold text-center" value={formData.initialDate} onChange={e=>set('initialDate',e.target.value)} disabled={readOnly} placeholder="e.g. 03/01/26" />
                                &nbsp;)
                            </td>
                        </tr>
                        {formData.initialRows.map((row, ri) => (
                            <tr key={ri}>
                                <td className="text-center font-bold">{ri + 1}</td>
                                <td><Row val={row[0]} onChange={v=>setRow('initialRows',ri,0,v)} /></td>
                                <td><InRow val={row[1]} onChange={v=>setRow('initialRows',ri,1,v)} /></td>
                                <td><InRow val={row[2]} onChange={v=>setRow('initialRows',ri,2,v)} /></td>
                                <td className="p-1 space-y-1">
                                    <Row 
                                        val={row[3]} 
                                        onChange={v=>setRow('initialRows',ri,3,v)} 
                                        placeholder="Description/Remarks..."
                                    />
                                    <MultiFileAttach 
                                        files={row[4] || []} 
                                        onUpdate={(files) => setRow('initialRows', ri, 4, files)}
                                        engagementId={engagement.id}
                                        readOnly={readOnly}
                                    />
                                </td>
                            </tr>
                        ))}
                        {!readOnly && (
                            <tr className="hide-on-print">
                                <td colSpan="5" className="p-1">
                                    <button onClick={() => addRow('initialRows')} className="text-indigo-600 text-[10px] hover:underline font-sans font-bold w-full text-left pl-2">+ Add Initial Document Row</button>
                                </td>
                            </tr>
                        )}

                        <tr className="bg-slate-100/50">
                            <td></td>
                            <td colSpan="4" className="font-bold text-[11px] py-2 border-t-[2px] border-black">
                                Additional Documents/Records (Date requested:&nbsp;
                                <input type="text" className="bg-transparent border-b border-black outline-none w-28 font-bold text-center" value={formData.additionalDate} onChange={e=>set('additionalDate',e.target.value)} disabled={readOnly} placeholder="e.g. 03/15/26" />
                                &nbsp;)
                            </td>
                        </tr>
                        {formData.additionalRows.map((row, ri) => (
                            <tr key={ri}>
                                <td className="text-center font-bold">{ri + 1}</td>
                                <td><Row val={row[0]} onChange={v=>setRow('additionalRows',ri,0,v)} /></td>
                                <td><InRow val={row[1]} onChange={v=>setRow('additionalRows',ri,1,v)} /></td>
                                <td><InRow val={row[2]} onChange={v=>setRow('additionalRows',ri,2,v)} /></td>
                                <td className="p-1 space-y-1">
                                    <Row 
                                        val={row[3]} 
                                        onChange={v=>setRow('additionalRows',ri,3,v)} 
                                        placeholder="Description/Remarks..."
                                    />
                                    <MultiFileAttach 
                                        files={row[4] || []} 
                                        onUpdate={(files) => setRow('additionalRows', ri, 4, files)}
                                        engagementId={engagement.id}
                                        readOnly={readOnly}
                                    />
                                </td>
                            </tr>
                        ))}
                        {!readOnly && (
                            <tr className="hide-on-print">
                                <td colSpan="5" className="p-1">
                                    <button onClick={() => addRow('additionalRows')} className="text-indigo-600 text-[10px] hover:underline font-sans font-bold w-full text-left pl-2">+ Add Additional Document Row</button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <StandardAuditFooter 
                    documentId={selectedVersionId}
                    history={signatureHistory}
                    onSigned={loadLatest}
                    readOnly={readOnly || !!selectedVersionId}
                    formData={formData}
                    setFormData={set}
                    className="mt-16 pt-12 border-t-2 border-slate-100"
                    signatories={[
                        { label: 'Prepared by', stage: 'Prepared', nameField: 'preparedBy', titleField: 'preparedTitle' },
                        { label: 'Reviewed by', stage: 'Reviewed', nameField: 'reviewedBy', titleField: 'reviewedTitle' },
                        { label: 'Approved by', stage: 'Approved', nameField: 'approvedBy', titleField: 'approvedTitle' }
                    ]}
                />

            </div>
        </AuditToolWrapper>
    );
}
