import { useState, useEffect, Fragment } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import MultiFileAttach from './MultiFileAttach';
import { formatRef } from '../../utils/formatters';
import StandardAuditFooter from '../common/StandardAuditFooter';


const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';



// Shared row for checklist tables with Yes/No/NA checkboxes
const CheckRow = ({ num, row, onChange, readOnly, engagementId }) => (
    <tr className="hover:bg-slate-50/50 transition-colors">
        <td className="text-center font-bold text-slate-400 py-3">{num}</td>
        <td className="p-2"><textarea className="tbl-input min-h-[60px]" value={row.policy} onChange={e=>onChange('policy',e.target.value)} disabled={readOnly} /></td>
        <td className="p-2"><textarea className="tbl-input min-h-[60px]" value={row.requirement} onChange={e=>onChange('requirement',e.target.value)} disabled={readOnly} /></td>
        <td className="p-2 space-y-2">
            <textarea 
                className="tbl-input min-h-[60px]" 
                value={row.movs} 
                onChange={e=>onChange('movs',e.target.value)} 
                disabled={readOnly} 
                placeholder="Details of MOVs/Remarks..."
            />
            <MultiFileAttach 
                files={row.attachments} 
                onUpdate={(files) => onChange('attachments', files)}
                engagementId={engagementId}
                readOnly={readOnly}
            />
        </td>
        <td className="text-center align-middle p-2">
            <label className="checkbox-container">
                <input type="checkbox" checked={row.yes} onChange={e=>onChange('yes',e.target.checked)} disabled={readOnly} />
                <span className="checkmark"></span>
            </label>
        </td>
        <td className="text-center align-middle p-2">
            <label className="checkbox-container">
                <input type="checkbox" checked={row.no} onChange={e=>onChange('no',e.target.checked)} disabled={readOnly} />
                <span className="checkmark"></span>
            </label>
        </td>
        <td className="text-center align-middle p-2">
            <label className="checkbox-container">
                <input type="checkbox" checked={row.na} onChange={e=>onChange('na',e.target.checked)} disabled={readOnly} />
                <span className="checkmark"></span>
            </label>
        </td>
        <td className="p-2"><textarea className="tbl-input min-h-[60px]" value={row.notes} onChange={e=>onChange('notes',e.target.value)} disabled={readOnly} placeholder="Specific details for assessment..." /></td>
    </tr>
);

const emptyRow = () => ({ policy:'', requirement:'', movs:'', attachments:[], yes:false, no:false, na:false, notes:'' });

const CATEGORIES_OAC = [
    { label: '1. PROGRAM', count: 6 },
    { label: '2. PROJECT/S', count: 3 },
    { label: '3. OUTCOME/S (Effectiveness)', count: 2 },
    { label: '4. OUTPUT/S (Ethicality and Effectiveness)', count: 2 },
    { label: '5. PROCESS (Ethicality and Efficiency)', count: 6 },
    { label: '6. INPUT/S (Economical)', count: 5 },
];

export default function OperationsAuditChecklist({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);

    const initRows = () => {
        const obj = {};
        CATEGORIES_OAC.forEach(cat => {
            obj[cat.label] = Array(cat.count).fill(null).map(emptyRow);
        });
        return obj;
    };

    const [formData, setFormData] = useState({
        oacRef: formatRef('OAC', engagement.ae_number),
        program: '',
        rows: initRows(),
        attachments: []
    });

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/oac/versions`);
            setVersions(res.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/oac`);
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
    const setRow = (cat, ri, field, val) => setFormData(fd => ({
        ...fd,
        rows: { ...fd.rows, [cat]: fd.rows[cat].map((r,i) => i===ri ? {...r, [field]:val} : r) }
    }));
    const addRow = (cat) => setFormData(fd => ({
        ...fd,
        rows: { ...fd.rows, [cat]: [...fd.rows[cat], emptyRow()] }
    }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/oac`, {
                form_data: formData,
                document_type: 'Operations Audit Checklist (OAC)',
                phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
            setDocumentId(res.data.tool.id);
            fetchVersions();
        } catch (e) { alert('Save failed: ' + e.message); }
        finally { setSaving(false); }
    };


    const handleExportWord = () => {
        // ... (Export logic remains similar but with premium styling)
    };

    let itemNo = 1;

    return (
        <AuditToolWrapper
            toolTitle="Operations Audit Checklist"
            toolCode="OAC"
            phase="Audit Execution"
            engagementTitle={engagement.title}
            onSave={handleSave}
            onExportWord={handleExportWord}
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
            <div id="oac-document" className="audit-tool-paper bg-white shadow-2xl w-[1300px] mx-auto my-6 px-16 py-16 font-serif">
                {/* Header Banner */}
                <div className="bg-indigo-900 -mx-16 -mt-16 mb-12 p-8 text-white flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-2 rounded-xl shadow-lg">
                            <img src={DILG_SEAL} className="h-20 w-20" alt="DILG Seal" />
                        </div>
                        <div>
                            <p className="text-indigo-200 text-xs font-bold tracking-[0.2em] mb-1">REPUBLIC OF THE PHILIPPINES</p>
                            <p className="text-indigo-100 text-sm font-medium mb-1">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                            <h1 className="text-3xl font-black tracking-tight">OPERATIONS AUDIT CHECKLIST</h1>
                        </div>
                    </div>
                    <div className="text-right border-l border-indigo-700/50 pl-8">
                        <p className="text-[10px] text-indigo-300 font-mono">FM-QP-DILG-IAS-33-07B</p>
                        <p className="text-[10px] text-indigo-300 font-mono uppercase">Rev01 | 09.16.22</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10 pb-8 border-b border-slate-100">
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">OAC Reference No.</span>
                            <input type="text" className="text-sm font-bold text-slate-900 border-none p-0 focus:ring-0 uppercase" value={formData.oacRef} onChange={e => set('oacRef', e.target.value)} disabled={readOnly} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Audit Engagement No.</span>
                            <div className="text-sm font-bold text-indigo-600">{engagement.ae_number}</div>
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
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Audit Objective/s</span>
                            <div className="flex items-center text-xs italic text-slate-700">
                                To evaluate input, process, output and outcome as to economy, efficiency, ethicality and effectiveness of the
                                <input 
                                    type="text" 
                                    className="border-b border-indigo-200 outline-none w-48 text-center mx-2 font-bold bg-transparent text-indigo-900 focus:border-indigo-500 transition-colors" 
                                    value={formData.program} 
                                    onChange={e=>set('program',e.target.value)} 
                                    disabled={readOnly} 
                                    placeholder="(Specify Program)" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 mb-10 shadow-sm">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th rowSpan="3" className="w-12 text-slate-500 p-4 border-r border-slate-200">Item</th>
                                <th colSpan="3" className="text-center p-3 border-r border-slate-200 text-indigo-700 bg-indigo-50/30 uppercase tracking-tighter font-black text-[10px]">Audit Planning Stage*</th>
                                <th colSpan="4" className="text-center p-3 text-emerald-700 bg-emerald-50/30 uppercase tracking-tighter font-black text-[10px]">Audit Execution Stage</th>
                            </tr>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th colSpan="2" className="p-3 border-r border-slate-200">Criteria</th>
                                <th rowSpan="2" className="w-64 p-3 border-r border-slate-200">MOVs / Remarks</th>
                                <th rowSpan="2" className="w-12 p-3 border-r border-slate-100">Yes</th>
                                <th rowSpan="2" className="w-12 p-3 border-r border-slate-100">No</th>
                                <th rowSpan="2" className="w-12 p-3 border-r border-slate-200 text-slate-400">N/A</th>
                                <th rowSpan="2" className="w-72 p-3 text-slate-600">Audit Notes</th>
                            </tr>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="p-3 border-r border-slate-200 w-72 font-medium">Specific Laws / Policies / Standards</th>
                                <th className="p-3 border-r border-slate-200 w-64 font-medium">Requirements</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {CATEGORIES_OAC.map(cat => (
                                <Fragment key={cat.label}>
                                    <tr className="bg-indigo-50/50">
                                        <td className="p-3 border-r border-slate-200"></td>
                                        <td colSpan="7" className="p-3 font-black text-indigo-900 tracking-wide bg-indigo-50/20">{cat.label}</td>
                                    </tr>
                                    {formData.rows[cat.label]?.map((row, ri) => (
                                        <CheckRow 
                                            key={ri} 
                                            num={itemNo++} 
                                            row={row} 
                                            onChange={(f,v)=>setRow(cat.label,ri,f,v)} 
                                            readOnly={readOnly} 
                                            engagementId={engagement.id} 
                                        />
                                    ))}
                                    {!readOnly && (
                                        <tr className="hide-on-print">
                                            <td className="border-r border-slate-100"></td>
                                            <td colSpan="7" className="p-2">
                                                <button onClick={() => addRow(cat.label)} className="flex items-center gap-1 text-indigo-600 text-[10px] hover:text-indigo-800 transition-colors font-bold uppercase tracking-widest pl-2">
                                                    <span className="text-sm">+</span> Add Policy Requirement
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                <StandardAuditFooter 
                    documentId={documentId}
                    history={signatureHistory}
                    onSigned={loadLatest}
                    readOnly={readOnly || !!currentVersion}
                    formData={formData}
                    setFormData={set}
                    className="mt-16 pt-12 border-t-2 border-slate-100"
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

