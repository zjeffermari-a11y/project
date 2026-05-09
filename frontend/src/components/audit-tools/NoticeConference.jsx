import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import { formatRef } from '../../utils/formatters';
import StandardAuditFooter from '../common/StandardAuditFooter';

export default function NoticeConference({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [versions, setVersions] = useState([]);
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [signOffHistory, setSignOffHistory] = useState([]);
    const [formData, setFormData] = useState({
        // Memo header
        recipient: '',
        date: '',
        // Entry conference paragraph
        deptOrder: '', deptOrderDate: '', anmDate: '', entryTitle: '', entryFrom: '', entryTo: '',
        // Exit conference paragraph
        exitOrder: '', exitTitle: '', exitFrom: '', exitTo: '', verifyFrom: '', verifyTo: '',
        // Conference details
        confDate: '', confTime: '', confVenue: '', confParticipants: '', logisticSupport: '',
        attendanceLink: '', coordinator: '', contactDetails: '',
        // Signatories
        preparedBy: '', reviewedBy: '', approvedBy: '',
        preparedRole: 'Process Owner', reviewedRole: 'Division Chiefs', approvedRole: 'IAS Deputy QMR',
        attachments: []
    });

    useEffect(() => {
        fetchVersions();
        loadLatest();
    }, [engagement.id]);

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/neecm/versions`);
            setVersions(res.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/neecm`);
            if (res.data?.form_data) {
                setFormData(fd => ({ ...fd, ...res.data.form_data }));
                setSignOffHistory(res.data.sign_off_history || []);
                setSelectedVersionId(res.data.id);
            }
        } catch (_) {}
    };

    const handleVersionSelect = async (versionId) => {
        try {
            const docRes = await api.get(`/engagements/${engagement.id}/documents`);
            const target = docRes.data.find(d => d.id === parseInt(versionId));
            if (target && target.form_data) {
                setFormData(target.form_data);
                setSignOffHistory(target.sign_off_history || []);
                setSelectedVersionId(versionId);
            }
        } catch (e) { alert('Failed to load version: ' + e.message); }
    };

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/neecm`, {
                form_data: formData,
                document_type: 'Notice of Entry/Exit Conference (NEECM)',
                phase: 'execution',
                sign_off_history: signOffHistory,
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
        const doc = document.getElementById('neecm-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('input[type="text"]').forEach(el => {
            const span = document.createElement('span');
            span.innerText = el.value ? ` ${el.value} ` : ' ____________ ';
            span.style.fontWeight = 'bold';
            span.style.textDecoration = 'underline';
            el.parentNode.replaceChild(span, el);
        });
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${clone.innerHTML}</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `NEECM_${engagement.title?.replace(/ /g,'_')}.doc`; a.click();
    };

    // Inline text input (for mid-paragraph fill-in-the-blank)
    const Inline = ({ field, size='w-24', placeholder='' }) => (
        <input type="text" className="bg-transparent border-b border-black outline-none font-bold text-center font-serif text-[12px]" style={{width:size.replace('w-','')+'px'}} value={formData[field]} onChange={e=>set(field,e.target.value)} disabled={readOnly} placeholder={placeholder} />
    );
    const Field = ({ field, placeholder='', cls='' }) => (
        <input type="text" className={`doc-input font-bold ${cls}`} value={formData[field]} onChange={e=>set(field,e.target.value)} disabled={readOnly} placeholder={placeholder} />
    );

    return (
        <AuditToolWrapper
            toolTitle="Notice of Entry/Exit Conference"
            toolCode="NEECM"
            phase="Audit Execution"
            engagementTitle={engagement.title}
            onSave={handleSave}
            onExportWord={handleExportWord}
            isSaving={saving}
            lastSaved={lastSaved}
            readOnly={readOnly}
            versions={versions}
            selectedVersionId={selectedVersionId}
            onVersionSelect={handleVersionSelect}
        >
            <div id="neecm-document" className="audit-tool-paper bg-white shadow-2xl w-[794px] mx-auto my-6 px-16 py-12 font-serif min-h-[1123px] text-[12px] leading-relaxed">
                {/* Letterhead */}
                <div className="text-center mb-8">
                    <p className="text-[9px] leading-tight">Republic of the Philippines</p>
                    <p className="text-sm font-bold tracking-wide leading-tight uppercase">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                    <p className="text-[9px] leading-tight text-gray-600">DILG-NAPOLCOM Center, EDSA corner Quezon Avenue, West Triangle, Quezon City</p>
                    <a href="http://www.dilg.gov.ph" className="text-[10px] text-blue-600 leading-tight">http://www.dilg.gov.ph</a>
                </div>

                <h2 className="text-center font-bold text-[14px] tracking-widest mb-6">INTERNAL AUDIT SERVICE</h2>
                <h3 className="font-bold text-[13px] tracking-widest mb-4">MEMORANDUM</h3>

                <div className="grid grid-cols-[100px_10px_1fr] gap-y-4 mb-8 font-bold items-center">
                    <div>TO/FOR</div><div>:</div>
                    <div className="flex flex-col">
                        <input type="text" className="doc-input font-bold text-indigo-700 uppercase" value={formData.recipient || [...new Set(engagement.movs?.map(m => m.auditee?.name).filter(Boolean))].join(', ')} onChange={e=>set('recipient', e.target.value)} disabled={readOnly} />
                        <span className="text-[9px] text-gray-500 font-normal italic">(Auditee Office/s)</span>
                    </div>
                    <div>AE NUMBER</div><div>:</div>
                    <div><input type="text" className="bg-transparent border-none outline-none w-full font-bold uppercase" value={formatRef(engagement.ae_number, 'NEECM')} disabled /></div>
                    <div>SUBJECT</div><div>:</div>
                    <div><input type="text" className="bg-transparent border-none outline-none w-full font-bold cursor-default" value="NOTICE OF ENTRY/EXIT CONFERENCE" disabled /></div>
                    <div>DATE</div><div>:</div>
                    <div><Field field="date" placeholder="[Enter Date]" /></div>
                </div>

                <hr className="border-t-[1.5px] border-black mb-6" />

                <div className="space-y-5 text-justify">
                    {/* Entry conference paragraph */}
                    <div>
                        <p className="italic text-gray-600 text-[11px] mb-1">(for entry conference)</p>
                        <p className="indent-8">
                            Pursuant to Department Order No.&nbsp;<Inline field="deptOrder" size="w-20" />&nbsp;dated&nbsp;<Inline field="deptOrderDate" size="w-24" />&nbsp;and the Audit Notification Memorandum dated&nbsp;<Inline field="anmDate" size="w-24" />, IAS is set to conduct&nbsp;<Inline field="entryTitle" size="w-48" placeholder="(audit engagement title)" />&nbsp;on&nbsp;<Inline field="entryFrom" size="w-24" />&nbsp;to&nbsp;<Inline field="entryTo" size="w-24" />.
                        </p>
                    </div>

                    {/* Exit conference paragraph */}
                    <div>
                        <p className="italic text-gray-600 text-[11px] mb-1">(for exit conference)</p>
                        <p className="indent-8">
                            Pursuant to Department Order No.&nbsp;<Inline field="exitOrder" size="w-20" />, the DILG Internal Audit Service conducted the&nbsp;<Inline field="exitTitle" size="w-48" placeholder="(audit engagement title)" />. The DILG IAS Team has conducted the audit from&nbsp;<Inline field="exitFrom" size="w-24" />&nbsp;to&nbsp;<Inline field="exitTo" size="w-24" />. We have already completed the verification and validation activities from&nbsp;<Inline field="verifyFrom" size="w-20" />&nbsp;to&nbsp;<Inline field="verifyTo" size="w-20" />&nbsp;and are now preparing the Highlights of Audit Findings for presentation.
                        </p>
                    </div>

                    <p className="indent-8">
                        Accordingly, may we invite you to an entry/exit conference with the following agenda: <span className="italic">(for entry conference)</span> to confirm the agreement of all participants to the audit plan, to introduce the audit team and their roles, to ensure that all planned activities included in the audit plan can be performed, and to discuss previous audit recommendations, if any. <span className="italic">(for exit conference)</span> to discuss the highlights of the audit findings with the auditee and/or the responsible official who has sufficient knowledge about the audit area; and to get the auditee's comments (management comments) and insights about the significant audit issues as a way of validating the audit findings. The following are the details:
                    </p>

                    <ul className="list-disc pl-16 space-y-1">
                        <li><strong>Date:</strong> <Inline field="confDate" size="w-32" /></li>
                        <li><strong>Time:</strong> <Inline field="confTime" size="w-32" /></li>
                        <li><strong>Venue:</strong> <span className="italic">(Physical and Virtual Meeting)</span> <Inline field="confVenue" size="w-48" /></li>
                        <li><strong>Expected Participants:</strong> <Inline field="confParticipants" size="w-64" /></li>
                        <li><strong>Needed Logistic Support from the Auditee</strong> <span className="italic text-[11px]">(for 2nd level entry conference only)</span>: <Inline field="logisticSupport" size="w-32" /></li>
                    </ul>

                    <p className="indent-8">
                        We have attached an Entry Conference Briefer for further details <span className="italic">(only for entry conference)</span>. Kindly accomplish the Attendance Confirmation Sheet (list down the expected participants) which can be accessed at this link: <Inline field="attendanceLink" size="w-48" />. Mr./Ms. <Inline field="coordinator" size="w-32" /> will be coordinating with your office. He/she can be reached at <Inline field="contactDetails" size="w-48" placeholder="(email add and telephone)" /> for other queries/concerns.
                    </p>

                    <p className="mt-6">Thank you for your usual support and cooperation.</p>

                    <div className="mt-8 mb-12">
                        <Field field="preparedBy" placeholder="[Enter Name]" cls="w-64 font-bold text-[13px] border-none" />
                        <p className="text-[12px] uppercase font-bold text-slate-500">IAS Head/Team Leader</p>
                    </div>
                </div>

                <hr className="border-t border-black mb-10" />

                <StandardAuditFooter 
                    documentId={selectedVersionId}
                    history={signOffHistory}
                    onSigned={handleSignOffSuccess}
                    readOnly={readOnly || !!selectedVersionId}
                    formData={formData}
                    setFormData={set}
                    className="mt-16 pt-12 border-t-2 border-slate-100"
                    signatories={[
                        { label: 'Prepared by', stage: 'Prepared', nameField: 'preparedBy', titleField: 'preparedRole' },
                        { label: 'Reviewed by', stage: 'Reviewed', nameField: 'reviewedBy', titleField: 'reviewedRole' },
                        { label: 'Approved by', stage: 'Approved', nameField: 'approvedBy', titleField: 'approvedRole' }
                    ]}
                />
            </div>
        </AuditToolWrapper>
    );
}

