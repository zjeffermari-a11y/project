import { useState, useEffect, Fragment } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import { formatRef } from '../../utils/formatters';
import MultiFileAttach from './MultiFileAttach';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';

export default function EntryConferenceBriefer({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [formData, setFormData] = useState({
        ecbRef: formatRef('ECB', engagement.ae_number),
        date: '',
        time: '',
        venue: '',
        auditTeam: '',
        auditees: '',
        objectives: '',
        scope: '',
        auditCriteria: '',
        auditProcess: '',
        requestedDocs: '',
        methodology: '',
        meetings: '',
        contactPerson: '',
        preparedBy: '', preparedTitle: '',
        notedBy: '', notedTitle: '',
        supporting_documents: []
    });

    useEffect(() => {
        if (engagement.ae_number) {
            set('ecbRef', formatRef('ECB', engagement.ae_number));
        }
        const load = async () => {
            try {
                const res = await api.get(`/engagements/${engagement.id}/tools/ecb`);
                if (res.data?.form_data) setFormData(fd => ({ ...fd, ...res.data.form_data }));
            } catch (_) {}
        };
        load();
    }, [engagement.id]);

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/engagements/${engagement.id}/tools/ecb`, {
                form_data: formData,
                document_type: 'Entry Conference Briefer (ECB)',
                phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
        } catch (e) { alert('Save failed: ' + e.message); }
        finally { setSaving(false); }
    };

    const handleExportWord = () => {
        const doc = document.getElementById('ecb-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('textarea, input').forEach(el => {
            const t = document.createTextNode(el.value || ''); el.parentNode.replaceChild(t, el);
        });
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${clone.innerHTML}</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ECB_${engagement.title?.replace(/ /g,'_')}.doc`; a.click();
    };

    const I = ({ field, cls='', placeholder='' }) => (
        <input type="text" className={`doc-input ${cls}`} value={formData[field]} onChange={e=>set(field,e.target.value)} disabled={readOnly} placeholder={placeholder} />
    );
    const TA = ({ field, rows=3, placeholder='' }) => (
        <textarea className="tbl-input border border-black/20 p-2" value={formData[field]} onChange={e=>set(field,e.target.value)} disabled={readOnly} placeholder={placeholder} rows={rows} />
    );

    return (
        <AuditToolWrapper
            toolTitle="Entry Conference Briefer"
            toolCode="ECB"
            phase="Audit Execution"
            engagementTitle={engagement.title}
            onSave={handleSave}
            onExportWord={handleExportWord}
            isSaving={saving}
            lastSaved={lastSaved}
            readOnly={readOnly}
        >
            <div id="ecb-document" className="audit-tool-paper bg-white shadow-2xl w-[850px] mx-auto my-6 px-16 py-12 font-serif min-h-[1123px]">
                {/* Header */}
                <div className="flex justify-center items-center gap-4 mb-4">
                    <img src={DILG_SEAL} className="h-16 w-16" alt="DILG Seal" />
                </div>
                <div className="text-center mb-6">
                    <p className="text-[9px] font-serif leading-none mb-0.5">Republic of the Philippines</p>
                    <p className="text-xs font-bold leading-none tracking-wide mb-1">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                    <p className="text-[9px] text-gray-800">Internal Audit Service</p>
                </div>

                <div className="mb-4 text-center">
                    <h1 className="text-base font-black uppercase tracking-wider">Entry Conference Briefer</h1>
                    <p className="text-[10px] text-gray-500 italic">(ECB Reference No. <I field="ecbRef" cls="w-36 bg-transparent border-none text-center" />)</p>
                </div>

                <hr className="border-black border-[1.5px] mb-4" />

                <div className="grid grid-cols-[110px_10px_1fr] gap-y-2 mb-6 text-[13px] font-serif items-center">
                    {[
                        ['Engagement', 'title', true],
                        ['AE Number', 'ae_number', true],
                        ['Auditee Office/s', 'auditee_offices', true],
                        ['Date', 'date', false],
                        ['Time', 'time', false],
                        ['Venue', 'venue', false],
                        ['Audit Team', 'auditTeam', false]
                    ].map(([lbl, field, system]) => (
                        <Fragment key={field}>
                            <div className="font-bold">{lbl}</div>
                            <div className="text-center font-bold">:</div>
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

                <hr className="border-black border mb-4" />

                {[
                    {label:'I. Audit Objectives:', field:'objectives', placeholder:'State the objectives of the audit...'},
                    {label:'II. Audit Scope and Period:', field:'scope', placeholder:'Define the scope and period covered...'},
                    {label:'III. Audit Criteria:', field:'auditCriteria', placeholder:'List the applicable laws, standards, and policies...'},
                    {label:'IV. Audit Process:', field:'auditProcess', placeholder:'Briefly describe the audit process and approach...'},
                    {label:'V. Documents/Records Requested:', field:'requestedDocs', placeholder:'List the initial documents needed...'},
                    {label:'VI. Audit Methodology:', field:'methodology', placeholder:'Describe the methodologies to be used...'},
                    {label:'VII. Schedule of Meetings/Interviews:', field:'meetings', placeholder:'Provide the planned schedule of meetings...'},
                    {label:'VIII. Contact Person(s):', field:'contactPerson', placeholder:'Provide contact details of the audit point persons...'},
                ].map(({label, field, placeholder}) => (
                    <div key={field} className="mb-4">
                        <p className="font-bold text-[13px] mb-1">{label}</p>
                        <TA field={field} placeholder={placeholder} rows={4} />
                    </div>
                ))}

                <hr className="border-black border mt-6 mb-6" />

                <div className="grid grid-cols-2 gap-12 text-[12px] font-serif mt-8">
                    <div>
                        <p className="font-bold mb-10">Prepared by:</p>
                        <I field="preparedBy" cls="font-bold text-center" />
                        <I field="preparedTitle" cls="italic text-[11px] mt-1" placeholder="Title / Designation" />
                    </div>
                    <div>
                        <p className="font-bold mb-10">Noted by:</p>
                        <I field="notedBy" cls="font-bold text-center" />
                        <I field="notedTitle" cls="italic text-[11px] mt-1" placeholder="Title / Designation" />
                    </div>
                </div>

                {/* Supporting Documents Section (Standardized Footer) */}
                <div className="mt-16 pt-8 border-t-2 border-slate-100 no-print font-sans">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Supporting Evidence</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Upload relevant annexes or briefing materials</p>
                        </div>
                    </div>
                    <MultiFileAttach
                        files={formData.supporting_documents || []}
                        onUpload={(newFiles) => set('supporting_documents', [...(formData.supporting_documents || []), ...newFiles])}
                        onRemove={(index) => set('supporting_documents', formData.supporting_documents.filter((_, i) => i !== index))}
                        readOnly={readOnly}
                    />
                </div>
            </div>
        </AuditToolWrapper>
    );
}
