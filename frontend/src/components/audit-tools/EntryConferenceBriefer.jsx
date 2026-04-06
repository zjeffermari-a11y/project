import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';

export default function EntryConferenceBriefer({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [formData, setFormData] = useState({
        ecbRef: `ECB-${new Date().getFullYear()}-001`,
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
    });

    useEffect(() => {
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

                <div className="grid grid-cols-[100px_10px_1fr] gap-y-2 mb-6 text-[13px] font-serif">
                    {[['Engagement','title',true],['Date','date'],['Time','time'],['Venue','venue'],['Audit Team','auditTeam'],['Auditees','auditees']].map(([lbl,field,system=false]) => (
                        <>
                            <div className="font-bold" key={`lbl-${field}`}>{lbl}</div>
                            <div className="text-center font-bold" key={`colon-${field}`}>:</div>
                            <div key={`val-${field}`}>
                                <input type="text" className="doc-input font-bold py-0.5" value={system ? (engagement.title||'') : formData[field]} onChange={e=>!system&&set(field,e.target.value)} disabled={system||readOnly} />
                            </div>
                        </>
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
            </div>
        </AuditToolWrapper>
    );
}
