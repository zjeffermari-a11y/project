import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import { formatRef } from '../../utils/formatters';
import MultiFileAttach from './MultiFileAttach';
import SignOffButton from '../common/SignOffButton';

const DILG_SEAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg';

export default function AuditAreaProfile({ engagement, user, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [versions, setVersions] = useState([]);
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [signOffHistory, setSignOffHistory] = useState([]);
    const [formData, setFormData] = useState({
        aapRef: formatRef('AAP', engagement.ae_number),
        auditArea: '',
        preparedBy: '', reviewedBy: '', notedBy: '',
        // Section tables - stored as arrays of [col1, col2, col3] strings
        lrrRows: Array(5).fill(null).map(() => ['', '', '']),
        planOrgRows: Array(4).fill(null).map(() => ['', '']),
        coordMethodRows: Array(7).fill(null).map(() => ['', '']),
        controlPolicyRows: Array(6).fill(null).map(() => ['', '']),
        objectivesRows: Array(3).fill(null).map(() => ['', '']),
        contextRows: Array(2).fill(null).map(() => ['', '']),
        riskCriteria: '',
        riskIdRows: Array(3).fill(null).map(() => ['', '']),
        riskRespRows: Array(2).fill(null).map(() => ['', '', '']),
        controlProdRows: Array(10).fill(null).map(() => ['', '', '', '']),
        corrActionRows: [['', '']],
        perfReviewRows: [['', '']],
        compReviewRows: [['', '']],
        itControlRows: [['', '']],
        infoRows: Array(8).fill(null).map(() => ['', '']),
        commRows: Array(4).fill(null).map(() => ['', '']),
        ongoingMonRows: Array(3).fill(null).map(() => ['', '']),
        sepMonRows: Array(3).fill(null).map(() => ['', '']),
        supporting_documents: []
    });

    useEffect(() => {
        if (engagement.ae_number) {
            const offices = [...new Set(engagement.movs?.map(m => m.auditee?.name).filter(Boolean))].join(', ');
            setFormData(fd => ({
                ...fd,
                aapRef: formatRef('AAP', engagement.ae_number),
                auditArea: fd.auditArea || offices
            }));
        }
        fetchVersions();
        loadLatest();
    }, [engagement.id, engagement.ae_number, engagement.movs]);

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/aap/versions`);
            setVersions(res.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const res = await api.get(`/engagements/${engagement.id}/tools/aap`);
            if (res.data?.form_data) {
                setFormData(fd => ({ ...fd, ...res.data.form_data }));
                setSignOffHistory(res.data.sign_off_history || []);
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
                setSignOffHistory(target.sign_off_history || []);
                setSelectedVersionId(versionId);
            }
        } catch (e) { alert('Failed to load version: ' + e.message); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/engagements/${engagement.id}/tools/aap`, {
                form_data: formData,
                document_type: 'Audit Area Profile (AAP)',
                phase: 'planning',
                sign_off_history: signOffHistory,
            });
            setLastSaved(new Date().toLocaleTimeString());
            fetchVersions(); // Refresh history
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
        const doc = document.getElementById('aap-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('textarea, input').forEach(el => {
            const t = document.createTextNode(el.value || el.getAttribute('value') || '');
            el.parentNode.replaceChild(t, el);
        });
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${clone.innerHTML}</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `AAP_${engagement.title?.replace(/ /g,'_')}.doc`; a.click();
    };

    const handleExportExcel = () => {
        const doc = document.getElementById('aap-document');
        const clone = doc.cloneNode(true);
        clone.querySelectorAll('textarea, input').forEach(el => {
            const t = document.createTextNode(el.value || el.getAttribute('value') || '');
            el.parentNode.replaceChild(t, el);
        });
        const tables = clone.querySelectorAll('table');
        let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body><h2>Audit Area Profile</h2>`;
        tables.forEach(t => { html += t.outerHTML + '<br><br>'; });
        html += '</body></html>';
        const a = document.createElement('a');
        a.href = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
        a.download = `AAP_${engagement.title?.replace(/ /g,'_')}.xls`;
        a.click();
    };

    const set = (key, val) => setFormData(fd => ({ ...fd, [key]: val }));
    const setRow = (key, rowIdx, colIdx, val) => setFormData(fd => {
        const rows = fd[key].map((r, i) => i === rowIdx ? r.map((c, j) => j === colIdx ? val : c) : r);
        return { ...fd, [key]: rows };
    });

    const T = ({ val, onChange, placeholder, rows = 2, cls = '' }) => (
        <textarea
            className={`tbl-input ${cls}`}
            value={val}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={readOnly}
        />
    );
    const I = ({ val, onChange, cls = '', placeholder = '' }) => (
        <input type="text" className={`doc-input ${cls}`} value={val} onChange={e => onChange(e.target.value)} disabled={readOnly} placeholder={placeholder} />
    );

    const Table3 = ({ title, rows, rowKey, labels, cols = ['', '', ''], colWidths = ['w-1/3','w-1/3','w-1/3'] }) => (
        <>
            {title && <div className="section-title">{title}</div>}
            <table className="aap-table mb-4">
                <thead><tr>{cols.map((c,i)=><th key={i} className={colWidths[i]}>{c}</th>)}</tr></thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri}>
                            <td className="font-bold italic">{labels?.[ri] || <T val={row[0]} onChange={v=>setRow(rowKey,ri,0,v)} />}</td>
                            <td><T val={row[labels?.[ri]!=null?1:1]} onChange={v=>setRow(rowKey,ri,labels?.[ri]!=null?1:1,v)} /></td>
                            <td><T val={row[labels?.[ri]!=null?2:2]} onChange={v=>setRow(rowKey,ri,labels?.[ri]!=null?2:2,v)} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );

    return (
        <AuditToolWrapper
            toolTitle="Audit Area Profile"
            toolCode="AAP"
            phase="Audit Planning"
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
            <div id="aap-document" className="audit-tool-paper bg-white shadow-2xl w-[1000px] mx-auto my-6 px-16 py-12 font-serif">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <img src={DILG_SEAL} className="h-20 w-20" alt="DILG Seal" />
                    <div>
                        <p className="text-[11px] text-gray-800">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-2xl font-black tracking-wide">Audit Area Profile</h1>
                        <p className="text-[10px] text-gray-500 italic">FM-QP-DILG-IAS-33-23/Rev01</p>
                    </div>
                </div>

                {/* Meta fields */}
                <div className="grid grid-cols-[180px_10px_1fr] gap-y-1 mb-6 text-sm font-bold items-center max-w-3xl">
                    <div>AAP Reference No.</div><div>:</div>
                    <div><I val={formData.aapRef} onChange={v=>set('aapRef',v)} cls="font-bold" /></div>
                    <div>Audit Engagement No.</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold" value={engagement.ae_number || `AE-${new Date().getFullYear()}-XXX`} disabled /></div>
                    <div>Audit Engagement Title</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold uppercase" value={engagement.title || ''} disabled /></div>
                    <div>Auditee Office/s</div><div>:</div>
                    <div><input type="text" className="doc-input font-bold text-indigo-700 uppercase" value={[...new Set(engagement.movs?.map(m => m.auditee?.name).filter(Boolean))].join(', ') || 'N/A'} disabled /></div>
                    <div>Audit Area</div><div>:</div>
                    <div><I val={formData.auditArea} onChange={v=>set('auditArea',v)} cls="font-bold" /></div>
                </div>

                <div id="aapTables">
                    {/* Section I */}
                    <Table3 title="I. Relevant Laws, Rules, Regulations, Standards and Agreements"
                        rows={formData.lrrRows} rowKey="lrrRows"
                        labels={['Philippine Constitution','Laws, rules and regulations on public governance and accountability, and applicable jurisprudence','Government policies, standards, guidelines, and regulatory issuances','Standards and other issuances of intergovernmental organizations','Relevant or applicable standards and best practices in governance, accountability, and operations...']}
                        cols={['Hierarchy of LRRs','Title of Laws, Rules and Regulations','Reference']}
                    />

                    {/* Section II A */}
                    <div className="section-title">II. Control Environment</div>
                    <div className="font-bold italic text-[12px] mb-1 ml-4">A. Plan of Organization</div>
                    <Table3 rows={formData.planOrgRows} rowKey="planOrgRows"
                        labels={['Structure','Staffing','Management','Personnel']}
                        cols={['Component','Description','Reference']}
                    />

                    <div className="font-bold italic text-[12px] mb-1 ml-4">B. Coordinated Methods and Measures</div>
                    <Table3 rows={formData.coordMethodRows} rowKey="coordMethodRows"
                        labels={['Planning System','Financial Management System','Human Resource Management System','Administrative System','Performance Evaluation System','Quality Management System','Other Operating and Support System']}
                        cols={['Common Management Systems','Description','Reference']}
                    />

                    <div className="font-bold italic text-[12px] mb-1 ml-4">C. Common Control Policies and Measures</div>
                    <Table3 rows={formData.controlPolicyRows} rowKey="controlPolicyRows"
                        labels={['Delegation of authority and supervision','Segregation of duties','Access over resources, assets and facilities','Checking completeness of transaction documents and reports','Verification','Reconciliation of financial and non-financial data']}
                        cols={['Common Control Policies and Measures','Description','Reference']}
                    />

                    {/* Section III */}
                    <div className="section-title">III. Risk Assessment</div>
                    <div className="font-bold italic text-[12px] mb-1 ml-4">A. Relevant Objectives</div>
                    <Table3 rows={formData.objectivesRows} rowKey="objectivesRows"
                        labels={['Strategic','Functional','Process']}
                        cols={['Objectives','KPI','Reference']}
                    />

                    <div className="font-bold italic text-[12px] mb-1 ml-4">B. Context Analysis</div>
                    <Table3 rows={formData.contextRows} rowKey="contextRows"
                        labels={['Internal and External Issues','Interested Parties/Stakeholders']}
                        cols={['Context','Description','Reference']}
                    />

                    <div className="font-bold italic text-[12px] mb-1 ml-4">C. Risk Criteria</div>
                    <div className="border border-black p-2 mb-4">
                        <T val={formData.riskCriteria} onChange={v=>set('riskCriteria',v)} placeholder="(state the basis for analyzing and evaluating risks...)" rows={3} />
                    </div>

                    <div className="font-bold italic text-[12px] mb-1 ml-4">D. Risk Identification, Analysis and Evaluation</div>
                    <Table3 rows={formData.riskIdRows} rowKey="riskIdRows"
                        labels={['Strategic','Functional/Operations','Process']}
                        cols={['Risk','Description','Reference']}
                    />

                    {/* Section IV */}
                    <div className="section-title">IV. Control Activities</div>
                    <div className="font-bold italic text-[12px] mb-1 ml-4">A. Risk Responses</div>
                    <table className="aap-table mb-4">
                        <thead><tr><th className="w-1/3">Key Process</th><th className="w-1/3">Description</th><th className="w-1/3">Relevant Policy Issued</th></tr></thead>
                        <tbody>
                            {formData.riskRespRows.map((row, ri) => (
                                <tr key={ri}>
                                    <td><T val={row[0]} onChange={v=>setRow('riskRespRows',ri,0,v)} /></td>
                                    <td><T val={row[1]} onChange={v=>setRow('riskRespRows',ri,1,v)} /></td>
                                    <td><T val={row[2]} onChange={v=>setRow('riskRespRows',ri,2,v)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="font-bold italic text-[12px] mb-1 ml-4">B. Control of product and service provision</div>
                    <table className="aap-table mb-4">
                        <thead><tr><th className="w-1/4">Controls</th><th className="w-1/4">Process 1</th><th className="w-1/4">Process 2</th><th className="w-1/4">Process Nn</th></tr></thead>
                        <tbody>
                            {['Characteristics','Results','Monitoring and measuring resources (MMR)','Implementation of MMR','Infrastructure and Environment','Competent persons and qualifications','Validation activities','Actions to prevent human error','Release','Delivery and post-delivery'].map((lbl, ri) => (
                                <tr key={ri}>
                                    <td className="font-bold italic">{lbl}</td>
                                    {[1,2,3].map(ci => <td key={ci}><T val={formData.controlProdRows[ri]?.[ci]||''} onChange={v=>setRow('controlProdRows',ri,ci,v)} /></td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {[{label:'C. Corrective Action', key:'corrActionRows'},{label:'D. Performance Review', key:'perfReviewRows'},{label:'E. Compliance Review', key:'compReviewRows'},{label:'F. IT control measures', key:'itControlRows'}].map(({label, key}) => (
                        <div key={key}>
                            <div className="font-bold italic text-[12px] mb-1 ml-4">{label}</div>
                            <table className="aap-table mb-4">
                                <thead><tr><th className="w-2/3">Description</th><th className="w-1/3">Reference</th></tr></thead>
                                <tbody><tr><td><T val={formData[key][0][0]} onChange={v=>setRow(key,0,0,v)} /></td><td><T val={formData[key][0][1]} onChange={v=>setRow(key,0,1,v)} /></td></tr></tbody>
                            </table>
                        </div>
                    ))}

                    {/* Section V */}
                    <div className="section-title">V. Information and Communication</div>
                    <div className="font-bold italic text-[12px] mb-1 ml-4">A. Information</div>
                    <Table3 rows={formData.infoRows} rowKey="infoRows"
                        labels={['Records management','SALN','Freedom of information','Citizens Charter','Data Privacy','Full Disclosure','Transparency Seal','IEC Materials']}
                        cols={['Controls','Description','Reference']}
                    />
                    <div className="font-bold italic text-[12px] mb-1 ml-4">B. Communication</div>
                    <Table3 rows={formData.commRows} rowKey="commRows"
                        labels={['Management and staff','Clients','Public','Other stakeholders']}
                        cols={['Stakeholders','Communication Channels','Reference']}
                    />

                    {/* Section VI */}
                    <div className="section-title">VI. Monitoring</div>
                    <div className="font-bold italic text-[12px] mb-1 ml-4">A. Ongoing monitoring</div>
                    <Table3 rows={formData.ongoingMonRows} rowKey="ongoingMonRows"
                        labels={['Done by Management','Done by Operating Unit','Done by Management Division/Unit']}
                        cols={['Monitoring Party','Monitoring activity','Reference']}
                    />
                    <div className="font-bold italic text-[12px] mb-1 ml-4">B. Separate evaluation and monitoring</div>
                    <Table3 rows={formData.sepMonRows} rowKey="sepMonRows"
                        labels={['Internal Audit','Oversight Body (e.g. COA, DBM)','Other External Party (e.g. External Auditor)']}
                        cols={['Evaluating Party','Evaluation Activity','Reference']}
                    />
                </div>

                {/* Signature section */}
                <div className="grid grid-cols-3 gap-8 mt-12 text-[12px] font-bold mb-10">
                    {['Prepared by:','Reviewed by:','Noted by:'].map((lbl, i) => {
                        const stepNames = ['Prepared','Reviewed','Noted'];
                        const keys = ['preparedBy','reviewedBy','notedBy'];
                        const roles = ['Team Members','Team Leader','IAS Director'];
                        return (
                            <div key={i}>
                                <p className="mb-4">{lbl}</p>
                                <div className="mb-4">
                                    <SignOffButton 
                                        documentId={selectedVersionId}
                                        stage={stepNames[i]}
                                        history={signOffHistory}
                                        onSuccess={handleSignOffSuccess}
                                        disabled={readOnly}
                                        className="no-print"
                                    />
                                </div>
                                <I val={formData[keys[i]]} onChange={v=>set(keys[i],v)} placeholder="Name of Signatory" />
                                <p className="mt-1 font-normal">{roles[i]}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Supporting Documents Section (Standardized Footer) */}
                <div className="mt-16 pt-8 border-t-2 border-slate-100 no-print font-sans">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Supporting Evidence</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Upload relevant annexes or profile documentation</p>
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
