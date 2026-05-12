import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import { formatRef } from '../../utils/formatters';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';
const BAGONG_PILIPINAS = 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Bagong_Pilipinas_logo.svg';

const TOOL_KEY = 'ainm';

export default function AuditInquiryMemorandum({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);

    const [formData, setFormData] = useState({
        aimRef: formatRef('AIM', engagement.ae_number),
        toFor: '',
        thru: '',
        attention: '',
        subject: '',
        date: '',
        context: '',
        details: '',
        deadline: '',
        teamLeaderName: '',
        directorName: '',
        preparedBy: 'JESSICA M. BAYLON',
        reviewedBy: 'ANGELBERT I. TULAUAN/ANDREA JULINE T. PASCUA',
        approvedBy: 'MARY ROSE L. VILCHEZ-MARIANO',
    });

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}/versions`);
            setVersions(res.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}`);
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

    const exportToWord = () => {
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
        const postHtml = "</body></html>";
        
        const wrapper = document.getElementById('aim-document');
        if (!wrapper) return;
        
        const clone = wrapper.cloneNode(true);
        
        // Convert inputs/textareas to plain text elements for Word structure
        const textareas = clone.querySelectorAll('textarea');
        textareas.forEach(ta => {
            const p = document.createElement('p');
            p.innerText = ta.value || ta.placeholder;
            if(ta.value === "") p.style.color = "#9ca3af";
            ta.parentNode.replaceChild(p, ta);
        });

        const inputs = clone.querySelectorAll('input[type="text"], input[type="date"]');
        inputs.forEach(input => {
            const span = document.createElement('span');
            span.innerText = input.value ? " " + input.value + " " : " ____________ ";
            span.style.fontWeight = "bold";
            input.parentNode.replaceChild(span, input);
        });

        const html = preHtml + clone.innerHTML + postHtml;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
        const filename = 'Audit_Inquiry_Memorandum.doc';
        
        const downloadLink = document.createElement("a");
        document.body.appendChild(downloadLink);
        
        if (navigator.msSaveOrOpenBlob) {
            navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.click();
        }
        document.body.removeChild(downloadLink);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/${TOOL_KEY}`, {
                form_data: formData,
                document_type: 'Audit Inquiry Memorandum (AIM)',
                phase: 'execution',
            });
            setLastSaved(new Date().toLocaleTimeString());
            setDocumentId(res.data.tool.id);
            fetchVersions();
        } catch (e) { alert('Save failed: ' + e.message); }
        finally { setSaving(false); }
    };

    const isReadOnly = readOnly || !!currentVersion;

    return (
        <AuditToolWrapper
            toolTitle="Audit Inquiry Memorandum"
            toolCode="AIM"
            phase="Audit Execution"
            engagementTitle={engagement.title}
            onSave={handleSave}
            onExportWord={exportToWord}
            isSaving={saving}
            lastSaved={lastSaved}
            readOnly={isReadOnly}
            versions={versions}
            currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect}
            onNewDraft={() => {
                setCurrentVersion(null);
                loadLatest();
            }}
        >
            <div id="aim-document" className="audit-tool-paper bg-white shadow-2xl w-[794px] mx-auto my-8 px-16 py-14 font-serif min-h-[1123px] flex flex-col">

                {/* Government Letterhead */}
                <div className="flex justify-center items-center gap-6 mb-2">
                    <img src={DILG_SEAL} className="h-[72px] w-[72px]" alt="DILG Seal" />
                    <img src={BAGONG_PILIPINAS} className="h-[72px] w-[72px] object-contain" alt="Bagong Pilipinas" />
                </div>

                <div className="text-center mb-8 font-serif">
                    <p className="text-[10px] leading-tight">Republic of the Philippines</p>
                    <p className="text-sm font-bold tracking-wide leading-tight">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                    <p className="text-[10px] leading-tight">DILG-NAPOLCOM Center, EDSA cor. Quezon Avenue, West Triangle, Quezon City</p>
                    <a href="http://www.dilg.gov.ph" className="text-[10px] text-blue-600 leading-tight">www.dilg.gov.ph</a>
                </div>

                {/* Document Title */}
                <div className="mb-6">
                    <h1 className="font-bold text-[14px] tracking-wide mb-1">AUDIT INQUIRY MEMORANDUM</h1>
                    <p className="text-[12px] text-gray-700">
                        (AIM Ref. No.{' '}
                        <input
                            type="text"
                            value={formData.aimRef}
                            onChange={e => set('aimRef', e.target.value)}
                            disabled={isReadOnly}
                            className="doc-input inline-block w-28 text-gray-700"
                        />
                        )
                    </p>
                </div>

                {/* Addressee Grid */}
                <div className="grid grid-cols-[100px_15px_1fr] gap-y-3 mb-8 font-bold items-center text-[13px]">
                    <div>TO/FOR</div><div className="text-center">:</div>
                    <div>
                        <input
                            type="text"
                            className="doc-input font-bold"
                            placeholder="[Enter Auditee/Recipient]"
                            value={formData.toFor}
                            onChange={e => set('toFor', e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>THRU</div><div className="text-center">:</div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            className="doc-input font-bold w-1/2"
                            placeholder="[Enter name if applicable]"
                            value={formData.thru}
                            onChange={e => set('thru', e.target.value)}
                            disabled={isReadOnly}
                        />
                        <span className="font-normal italic text-[11px] text-gray-600 whitespace-nowrap">(if applicable)</span>
                    </div>

                    <div>ATTENTION</div><div className="text-center">:</div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            className="doc-input font-bold w-1/2"
                            placeholder="[Enter name if applicable]"
                            value={formData.attention}
                            onChange={e => set('attention', e.target.value)}
                            disabled={isReadOnly}
                        />
                        <span className="font-normal italic text-[11px] text-gray-600 whitespace-nowrap">(if applicable)</span>
                    </div>

                    <div>SUBJECT</div><div className="text-center">:</div>
                    <div>
                        <input
                            type="text"
                            className="doc-input font-bold"
                            placeholder="[Enter Subject]"
                            value={formData.subject}
                            onChange={e => set('subject', e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>DATE</div><div className="text-center">:</div>
                    <div>
                        <input
                            type="date"
                            className="doc-input font-bold w-auto"
                            value={formData.date}
                            onChange={e => set('date', e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>
                </div>

                <hr className="border-t-[1.5px] border-black mb-6" />

                {/* Body Fields */}
                <div className="flex-1 text-[13px] leading-relaxed space-y-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Context and Authority</p>
                        <textarea
                            className="tbl-input min-h-[80px] italic border border-dashed border-slate-300 rounded p-2 w-full"
                            placeholder="(Context and Authority: i.e. Audit Engagement Title, Department Order, Audit Notification Memorandum)"
                            value={formData.context}
                            onChange={e => set('context', e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Details of Inquiry</p>
                        <textarea
                            className="tbl-input min-h-[120px] italic border border-dashed border-slate-300 rounded p-2 w-full"
                            placeholder="(Details of Inquiry: clarification/additional information on the initially noted noncompliances and control deficiencies and/or request for additional documents)"
                            value={formData.details}
                            onChange={e => set('details', e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Deadline of Submission</p>
                        <textarea
                            className="tbl-input min-h-[40px] italic border border-dashed border-slate-300 rounded p-2 w-full"
                            placeholder="(Deadline of Submission)"
                            value={formData.deadline}
                            onChange={e => set('deadline', e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Signatories within document body */}
                    <div className="mt-10 space-y-8">
                        <div>
                            <input
                                type="text"
                                className="w-64 bg-transparent outline-none border-b border-black font-bold mb-1 text-[13px]"
                                placeholder="[Audit Team Leader Name]"
                                value={formData.teamLeaderName}
                                onChange={e => set('teamLeaderName', e.target.value)}
                                disabled={isReadOnly}
                            />
                            <p className="font-bold text-[13px]">Audit Team Leader</p>
                        </div>

                        <div>
                            <p className="italic mb-5 text-[13px]">Noted by:</p>
                            <input
                                type="text"
                                className="w-64 bg-transparent outline-none border-b border-black font-bold mb-1 text-[13px]"
                                placeholder="[Director Name]"
                                value={formData.directorName}
                                onChange={e => set('directorName', e.target.value)}
                                disabled={isReadOnly}
                            />
                            <p className="font-bold text-[13px]">Director, Internal Audit Service</p>
                        </div>
                    </div>
                </div>

                {/* Standard Signatories Footer Table */}
                <div className="mt-12 mb-8">
                    <table className="sig-table">
                        <thead>
                            <tr>
                                <th>Prepared by</th>
                                <th>Reviewed by</th>
                                <th>Approved by</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="font-bold">
                                <td className="pt-8 pb-2">
                                    <input 
                                        type="text" 
                                        value={formData.preparedBy} 
                                        onChange={e => set('preparedBy', e.target.value)}
                                        disabled={isReadOnly}
                                        className="w-full text-center font-bold bg-transparent outline-none uppercase text-[11px]" 
                                    />
                                </td>
                                <td className="pt-8 pb-2">
                                    <input 
                                        type="text" 
                                        value={formData.reviewedBy} 
                                        onChange={e => set('reviewedBy', e.target.value)}
                                        disabled={isReadOnly}
                                        className="w-full text-center font-bold bg-transparent outline-none uppercase text-[9px]" 
                                    />
                                </td>
                                <td className="pt-8 pb-2">
                                    <input 
                                        type="text" 
                                        value={formData.approvedBy} 
                                        onChange={e => set('approvedBy', e.target.value)}
                                        disabled={isReadOnly}
                                        className="w-full text-center font-bold bg-transparent outline-none uppercase text-[11px]" 
                                    />
                                </td>
                            </tr>
                            <tr className="font-bold text-center">
                                <td>Process Owner</td>
                                <td>ADC/OIC-DC</td>
                                <td>IAS Deputy QMR</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Document Footer */}
                <div className="text-center text-[9px] text-gray-600 mt-auto pt-4 leading-tight border-t border-slate-100">
                    <p>DILG- Internal Audit Service</p>
                    <p>DILG-NAPOLCOM Center, EDSA Corner Quezon Avenue, QC</p>
                    <p className="text-blue-600 font-bold underline">ias@dilg.gov.ph</p>
                    <p>02-8256552 / 02-876-3454 Local 5302/5305</p>
                </div>
            </div>
        </AuditToolWrapper>
    );
}
