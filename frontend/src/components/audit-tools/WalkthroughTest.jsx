import { useState, useEffect, Fragment } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import MultiFileAttach from './MultiFileAttach';
import { formatRef } from '../../utils/formatters';
import StandardAuditFooter from '../common/StandardAuditFooter';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';



const emptyIccRow = () => ({ ccRef:'', activity:'', attributes:'', movs:'', procedure:'', docs:'', notes:'', attachments: [] });
const emptyProcRow = () => ({ actNo:'', activity:'', attributes:'', movs:'', procedure:'', docs:'', notes:'', attachments: [] });

export default function WalkthroughTest({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);

    const [formData, setFormData] = useState({
        wtRef: formatRef('WT', engagement.ae_number),
        agency: '',
        titleProcess: '',
        participant: '',
        dates: '',
        iccRows: Array(3).fill(null).map(emptyIccRow),
        processRows: Array(3).fill(null).map(emptyProcRow),
        quality: { correct:'', complete:'', clear:'', concise:'', coherent:'', total:'' },
        attachments: []
    });

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/wt/versions`);
            setVersions(res.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/wt`);
            if (res.data) {
                setDocumentId(res.data.id);
                setSignatureHistory(res.data.signatures || []);
                if (res.data.form_data) {
                    setFormData(fd => ({ ...fd, ...res.data.form_data }));
                }
            }
        } catch (_) {}
    };

    useEffect(() => {
        loadLatest();
        fetchVersions();
    }, [engagement.id]);

    const handleVersionSelect = async (v) => {
        setCurrentVersion(v);
        setFormData(fd => ({ ...fd, ...v.form_data }));
        setDocumentId(v.id);
        setSignatureHistory(v.signatures || []);
    };

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    const setQuality = (field, val) => setFormData(fd => ({ ...fd, quality: { ...fd.quality, [field]: val } }));
    const setIcc = (ri, field, val) => setFormData(fd => ({ ...fd, iccRows: fd.iccRows.map((r,i)=>i===ri?{...r,[field]:val}:r) }));
    const setProc = (ri, field, val) => setFormData(fd => ({ ...fd, processRows: fd.processRows.map((r,i)=>i===ri?{...r,[field]:val}:r) }));
    const addIcc = () => setFormData(fd => ({ ...fd, iccRows: [...fd.iccRows, emptyIccRow()] }));
    const addProc = () => setFormData(fd => ({ ...fd, processRows: [...fd.processRows, emptyProcRow()] }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/wt`, {
                form_data: formData,
                document_type: 'Walkthrough Test (WT)',
                phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
            setDocumentId(res.data.tool.id);
            fetchVersions();
        } catch (e) { alert('Save failed: ' + e.message); }
        finally { setSaving(false); }
    };

    const TableHeaders = () => (
        <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-tighter font-black">
                <th colSpan="6" className="py-3 border-r border-slate-200 text-indigo-700 bg-indigo-50/30">Audit Planning</th>
                <th colSpan="2" className="py-3 text-emerald-700 bg-emerald-50/30">Audit Execution</th>
            </tr>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[9px] text-slate-500">
                <th className="w-12 p-3 border-r border-slate-200">Item</th>
                <th className="w-24 p-3 border-r border-slate-200">Ref. No.</th>
                <th className="w-64 p-3 border-r border-slate-200 text-left uppercase">Activity / Statement</th>
                <th className="w-64 p-3 border-r border-slate-200 text-left uppercase">Control Attributes</th>
                <th className="w-48 p-3 border-r border-slate-200 text-left uppercase">Sample MOV</th>
                <th className="w-48 p-3 border-r border-slate-200 text-left uppercase font-black text-indigo-700">Walkthrough Procedure</th>
                <th className="w-72 p-3 border-r border-slate-200 text-left uppercase font-black text-emerald-700">Documents Examined</th>
                <th className="w-64 p-3 text-left uppercase font-black text-emerald-700">Audit Notes</th>
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
            isSaving={saving}
            lastSaved={lastSaved}
            readOnly={readOnly || !!currentVersion}
            versions={versions}
            currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect}
            onNewDraft={() => {
                setCurrentVersion(null);
                loadLatest();
            }}
        >
            <div id="wt-document" className="audit-tool-paper bg-white shadow-2xl w-[1400px] mx-auto my-6 px-16 py-16 font-serif">
                {/* Header Banner */}
                <div className="bg-indigo-900 -mx-16 -mt-16 mb-12 p-8 text-white flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-2 rounded-xl shadow-lg">
                            <img src={DILG_SEAL} className="h-20 w-20" alt="DILG Seal" />
                        </div>
                        <div>
                            <p className="text-indigo-200 text-xs font-bold tracking-[0.2em] mb-1">REPUBLIC OF THE PHILIPPINES</p>
                            <p className="text-indigo-100 text-sm font-medium mb-1">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Walkthrough Test</h1>
                        </div>
                    </div>
                    <div className="text-right border-l border-indigo-700/50 pl-8">
                        <p className="text-[10px] text-indigo-300 font-mono">FM-QP-DILG-IAS-33-09</p>
                        <p className="text-[10px] text-indigo-300 font-mono uppercase">Rev01 | 10.10.22</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10 pb-8 border-b border-slate-100">
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">WT Reference No.</span>
                            <input type="text" className="text-sm font-bold text-slate-900 border-none p-0 focus:ring-0 uppercase" value={formData.wtRef} onChange={e => set('wtRef', e.target.value)} disabled={readOnly} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Audit Engagement No.</span>
                            <div className="text-sm font-bold text-indigo-600">{engagement.ae_number}</div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Title of Process/System</span>
                            <input type="text" className="text-sm font-bold text-slate-900 border-none p-0 focus:ring-0 uppercase" value={formData.titleProcess} onChange={e => set('titleProcess', e.target.value)} disabled={readOnly} placeholder="ENTER PROCESS TITLE..." />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Auditee Office/s</span>
                            <div className="text-sm font-bold text-slate-900 uppercase">
                                {[...new Set(engagement.movs?.map(m => m.auditee?.name).filter(Boolean))].join(', ') || 'N/A'}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Walkthrough Participant/s</span>
                            <input type="text" className="text-sm font-bold text-slate-900 border-none p-0 focus:ring-0 uppercase" value={formData.participant} onChange={e => set('participant', e.target.value)} disabled={readOnly} placeholder="ENTER PARTICIPANTS..." />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Walkthrough Date/s</span>
                            <input type="text" className="text-sm font-bold text-slate-900 border-none p-0 focus:ring-0 uppercase" value={formData.dates} onChange={e => set('dates', e.target.value)} disabled={readOnly} placeholder="SPECIFY DATES..." />
                        </div>
                    </div>
                </div>

                {/* Section A - ICC */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-indigo-900 flex items-center gap-2">
                            <span className="bg-indigo-900 text-white w-6 h-6 rounded flex items-center justify-center text-[10px]">A</span>
                            FOR INTERNAL CONTROL COMPONENTS (ICC)
                        </h3>
                        {!readOnly && <button onClick={addIcc} className="text-indigo-600 text-[10px] font-bold hover:text-indigo-800 uppercase tracking-widest">+ Add Row</button>}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                        <table className="w-full text-[11px] border-collapse">
                            <TableHeaders />
                            <tbody className="divide-y divide-slate-100">
                                {formData.iccRows.map((row, ri) => (
                                    <tr key={ri} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-200">{ri + 1}</td>
                                        <td className="p-2 border-r border-slate-200"><input type="text" className="tbl-input text-center" value={row.ccRef} onChange={e=>setIcc(ri,'ccRef',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200"><textarea className="tbl-input min-h-[60px]" value={row.activity} onChange={e=>setIcc(ri,'activity',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200"><textarea className="tbl-input min-h-[60px]" value={row.attributes} onChange={e=>setIcc(ri,'attributes',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200"><textarea className="tbl-input min-h-[60px]" value={row.movs} onChange={e=>setIcc(ri,'movs',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200 bg-indigo-50/10"><textarea className="tbl-input min-h-[60px] font-medium text-indigo-900" value={row.procedure} onChange={e=>setIcc(ri,'procedure',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200 bg-emerald-50/10">
                                            <textarea className="tbl-input min-h-[60px] font-medium text-emerald-900 mb-2" value={row.docs} onChange={e=>setIcc(ri,'docs',e.target.value)} disabled={readOnly} />
                                            <MultiFileAttach files={row.attachments} onUpdate={(files) => setIcc(ri, 'attachments', files)} engagementId={engagement.id} readOnly={readOnly} />
                                        </td>
                                        <td className="p-2 bg-emerald-50/10"><textarea className="tbl-input min-h-[60px] text-emerald-800" value={row.notes} onChange={e=>setIcc(ri,'notes',e.target.value)} disabled={readOnly} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section B - Process */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                            <span className="bg-emerald-900 text-white w-6 h-6 rounded flex items-center justify-center text-[10px]">B</span>
                            FOR PROCESS
                        </h3>
                        {!readOnly && <button onClick={addProc} className="text-emerald-600 text-[10px] font-bold hover:text-emerald-800 uppercase tracking-widest">+ Add Row</button>}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                        <table className="w-full text-[11px] border-collapse">
                            <TableHeaders />
                            <tbody className="divide-y divide-slate-100">
                                {formData.processRows.map((row, ri) => (
                                    <tr key={ri} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-200">{ri + 1}</td>
                                        <td className="p-2 border-r border-slate-200"><input type="text" className="tbl-input text-center" value={row.actNo} onChange={e=>setProc(ri,'actNo',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200"><textarea className="tbl-input min-h-[60px]" value={row.activity} onChange={e=>setProc(ri,'activity',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200"><textarea className="tbl-input min-h-[60px]" value={row.attributes} onChange={e=>setProc(ri,'attributes',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200"><textarea className="tbl-input min-h-[60px]" value={row.movs} onChange={e=>setProc(ri,'movs',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200 bg-indigo-50/10"><textarea className="tbl-input min-h-[60px] font-medium text-indigo-900" value={row.procedure} onChange={e=>setProc(ri,'procedure',e.target.value)} disabled={readOnly} /></td>
                                        <td className="p-2 border-r border-slate-200 bg-emerald-50/10">
                                            <textarea className="tbl-input min-h-[60px] font-medium text-emerald-900 mb-2" value={row.docs} onChange={e=>setProc(ri,'docs',e.target.value)} disabled={readOnly} />
                                            <MultiFileAttach files={row.attachments} onUpdate={(files) => setProc(ri, 'attachments', files)} engagementId={engagement.id} readOnly={readOnly} />
                                        </td>
                                        <td className="p-2 bg-emerald-50/10"><textarea className="tbl-input min-h-[60px] text-emerald-800" value={row.notes} onChange={e=>setProc(ri,'notes',e.target.value)} disabled={readOnly} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-between items-start mb-12 gap-12">
                    <div className="flex-1 bg-slate-50 p-6 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-500 leading-relaxed"><span className="font-black text-slate-700">*Activity Controls (AC):</span> Authorization, Approval, Recording, Review, Reporting, Reconciliation, Custody, Comparison, Segregation, Monitoring</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-2"><span className="font-black text-slate-700">**Quality Controls (QC):</span> Validity, Completeness, Accuracy, Timeliness, Existence</p>
                    </div>
                    <div className="w-80 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                            <span className="text-[10px] font-black text-slate-700 uppercase">Quality of Workpaper</span>
                        </div>
                        <div className="divide-y divide-slate-100 bg-white">
                            {['correct','complete','clear','concise','coherent'].map(f=>(
                                <div key={f} className="flex items-center justify-between px-4 py-2">
                                    <span className="text-[11px] font-bold text-slate-600 capitalize">{f}</span>
                                    <input type="text" className="w-12 text-center text-sm font-black text-indigo-600 bg-indigo-50/30 rounded border-none focus:ring-0" value={formData.quality[f]} onChange={e=>setQuality(f,e.target.value)} disabled={readOnly} />
                                </div>
                            ))}
                            <div className="flex items-center justify-between px-4 py-3 bg-indigo-900 text-white">
                                <span className="text-[11px] font-black uppercase tracking-wider">Total Rating</span>
                                <input type="text" className="w-12 text-center text-sm font-black bg-white/20 rounded border-none focus:ring-0" value={formData.quality.total} onChange={e=>setQuality('total',e.target.value)} disabled={readOnly} />
                            </div>
                        </div>
                    </div>
                </div>

                <StandardAuditFooter 
                    documentId={documentId}
                    history={signatureHistory}
                    onSigned={loadLatest}
                    readOnly={readOnly || !!currentVersion}
                    formData={formData}
                    setFormData={set}
                    className="mt-16 pt-12 border-t-2 border-slate-100"
                    sections={[
                        {
                            label: 'Preparation & Review',
                            labelClass: 'bg-indigo-900',
                            signatories: [
                                { label: 'Prepared by', stage: 'Prepared', nameField: 'preparedBy', titleField: 'preparedTitle' },
                                { label: 'Reviewed by', stage: 'Reviewed', nameField: 'reviewedBy', titleField: 'reviewedTitle' }
                            ]
                        },
                        {
                            label: 'Auditee Conformance',
                            labelClass: 'bg-rose-900',
                            signatories: [
                                { label: 'Accomplished by', stage: 'Accomplished', nameField: 'accomplishedBy', titleField: 'accomplishedTitle' },
                                { label: 'Conformed by', stage: 'Conformed', nameField: 'conformedBy', titleField: 'conformedTitle' }
                            ]
                        },
                        {
                            label: 'Final Performance Evaluation',
                            labelClass: 'bg-emerald-900',
                            signatories: [
                                { label: 'Performed by', stage: 'Performed', nameField: 'performedBy', titleField: 'performedTitle' },
                                { label: 'Reviewed by', stage: 'eval_reviewed', nameField: 'evalReviewedBy', titleField: 'evalReviewedTitle' }
                            ]
                        }
                    ]}
                />

            </div>
        </AuditToolWrapper>
    );
}
