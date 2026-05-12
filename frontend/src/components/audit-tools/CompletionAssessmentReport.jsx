import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import StandardAuditFooter from '../common/StandardAuditFooter';
import { formatRef } from '../../utils/formatters';

const TOOL_KEY = 'comare';

export default function CompletionAssessmentReport({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);

    const [formData, setFormData] = useState({
        comareRef:           formatRef('COMARE', engagement.ae_number),
        engagementTitle:     engagement.title || '',
        period:              '',
        teamLeader:          '',
        assistantTeamLeader: '',
        teamMembers:         '',
        // Assessment Result + Remarks per component
        assessmentA:  '', remarksA:  '',
        assessmentB:  '', remarksB:  '',
        assessmentC:  '', remarksC:  '',
        assessmentD:  '', remarksD:  '',
        assessmentE:  '', remarksE:  '',
        totalMet:     '',
        overallAssessment: '',
        // Signatories
        preparedByName:  '', preparedByPosition:  '',
        reviewedByName:  '', reviewedByPosition:  '',
        approvedByName:  '',
    });

    // ── Data loaders ─────────────────────────────────────────────────────────
    const fetchVersions = async () => {
        try {
            const r = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}/versions`);
            setVersions(r.data);
        } catch (_) {}
    };

    const loadLatest = async () => {
        try {
            const r = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}`);
            if (r.data?.form_data) {
                setDocumentId(r.data.id);
                setSignatureHistory(r.data.signatures || []);
                setFormData(p => ({ ...p, ...r.data.form_data }));
            }
        } catch (_) {}
    };

    useEffect(() => { loadLatest(); fetchVersions(); }, [engagement.id]);

    const handleVersionSelect = v => {
        setCurrentVersion(v);
        setDocumentId(v.id);
        setSignatureHistory(v.signatures || []);
        setFormData(p => ({ ...p, ...v.form_data }));
    };

    const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const r = await api.post(
                `/engagements/${engagement.id}/tools/${TOOL_KEY}`,
                { form_data: formData, document_type: 'Completion Assessment Report (ComARe)', phase: 'follow-up' }
            );
            setLastSaved(new Date().toLocaleTimeString());
            setDocumentId(r.data.tool.id);
            fetchVersions();
        } catch (e) {
            alert('Save failed: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const ro = readOnly || !!currentVersion;
    const tA = 'w-full bg-transparent outline-none resize-vertical p-1 text-[11px] leading-relaxed font-serif';
    const dI = 'bg-transparent outline-none border-b border-black text-[12px] px-1 font-bold w-full';

    // Reusable assessment + remarks cell pair
    const AR = ({ ak, rk, rowSpan = 1, minH = 'min-h-[120px]' }) => (
        <>
            <td className="border border-black p-1 align-top" rowSpan={rowSpan}>
                <textarea className={`${tA} ${minH}`}
                    value={formData[ak] || ''} onChange={e => set(ak, e.target.value)} disabled={ro} />
            </td>
            <td className="border border-black p-1 align-top" rowSpan={rowSpan}>
                <textarea className={`${tA} ${minH}`}
                    value={formData[rk] || ''} onChange={e => set(rk, e.target.value)} disabled={ro} />
            </td>
        </>
    );

    return (
        <AuditToolWrapper
            toolTitle="Completion Assessment Report (ComARe)"
            toolCode="ComARe"
            phase="Audit Follow-Up"
            engagementTitle={engagement.title}
            onSave={handleSave}
            isSaving={saving}
            lastSaved={lastSaved}
            readOnly={ro}
            versions={versions}
            currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect}
            onNewDraft={() => { setCurrentVersion(null); loadLatest(); }}
        >
            <div className="bg-white shadow-2xl w-[1400px] mx-auto my-8 px-14 py-16 font-serif relative flex flex-col">

                {/* ── Header ── */}
                <div className="flex items-center gap-4 mb-8">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg"
                        className="h-16 w-16" alt="DILG Seal"
                    />
                    <div>
                        <p className="text-[11px] text-gray-800">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-xl font-black tracking-wide">COMPLETION ASSESSMENT REPORT (ComARe)</h1>
                        <p className="text-[9px] text-gray-500 italic">FM-QP-DILG-IAS-33-30 | Rev00 | 10.10.22</p>
                    </div>
                </div>

                {/* ── Meta fields ── */}
                <div className="grid grid-cols-[160px_10px_400px] gap-y-2 mb-8 text-[12px] font-bold items-center">
                    {[
                        ['ComARe Reference No.', 'comareRef',       true],
                        ['Engagement Title',     'engagementTitle', true],
                        ['Period',               'period',          false],
                    ].map(([lbl, k, locked]) => (
                        <div key={lbl} className="contents">
                            <div>{lbl}</div>
                            <div>:</div>
                            <div>
                                <input type="text" className={dI}
                                    value={formData[k]}
                                    onChange={e => set(k, e.target.value)}
                                    disabled={ro || locked} />
                            </div>
                        </div>
                    ))}

                    {/* Team composition */}
                    <div className="col-span-3 h-4" />
                    <div className="font-bold">Team/s Composition</div><div /><div />
                    {[
                        ['Team Leader',            'teamLeader'],
                        ['Assistant Team Leader',  'assistantTeamLeader'],
                        ['Team Member/s',           'teamMembers'],
                    ].map(([lbl, k]) => (
                        <div key={k} className="contents">
                            <div>{lbl}</div>
                            <div>:</div>
                            <div><input type="text" className={dI}
                                value={formData[k]} onChange={e => set(k, e.target.value)} disabled={ro} /></div>
                        </div>
                    ))}
                </div>

                {/* ── Main KPI Table ── */}
                <div className="mb-10 overflow-x-auto">
                    <table className="w-full border-collapse text-[11px]" style={{ minWidth: '1280px' }}>
                        <thead>
                            <tr className="bg-slate-100 font-bold text-center">
                                <th rowSpan={2} className="border border-black p-2 w-48">Components</th>
                                <th rowSpan={2} className="border border-black p-2 w-52">Focus</th>
                                <th colSpan={2} className="border border-black p-2">Key Performance Indicators</th>
                                <th rowSpan={2} className="border border-black p-2 w-36">MOV</th>
                                <th rowSpan={2} className="border border-black p-2 w-36">Assessment Result</th>
                                <th rowSpan={2} className="border border-black p-2 w-44">
                                    Remarks<br />
                                    <span className="text-[9px] font-normal italic">(If unmet indicate reason(s)/Interventions)</span>
                                </th>
                            </tr>
                            <tr className="bg-slate-100 font-bold text-center">
                                <th className="border border-black p-2 w-44">Performance Areas</th>
                                <th className="border border-black p-2 w-44">Formula and Target</th>
                            </tr>
                        </thead>
                        <tbody>

                            {/* ── ROW A ── */}
                            <tr>
                                <td className="border border-black p-2 align-top">
                                    A. Overall effectiveness and efficiency of the IAS/IAU in accordance with DBM rules and regulations and the agency's policies and standards;
                                </td>
                                <td className="border border-black p-2 align-top">
                                    To include Audit Reporting to Audit Follow-up accomplishments<br /><br />
                                    <span className="font-bold">Effectiveness:</span>
                                    <ul className="list-none pl-0 mt-1 space-y-0.5">
                                        <li>1. Consolidated PARe results</li>
                                        <li>2. Relevant SPMS targets</li>
                                        <li>3. QO rating</li>
                                        <li>4. Audit Work Program</li>
                                        <li>6. Feedback Survey</li>
                                    </ul>
                                    <span className="font-bold">Efficiency:</span><br />
                                    - Budget Plan vs Actual
                                </td>
                                <td className="border border-black p-2 align-top">
                                    <span className="font-bold">Effectiveness:</span>
                                    <ul className="list-none pl-0 mt-1 space-y-0.5">
                                        <li>1. PARe overall rating</li>
                                        <li>2. SPMS output rating</li>
                                        <li>3. QO rating</li>
                                        <li>4. Audit Work Program rating</li>
                                        <li>5. AFSF rating</li>
                                    </ul>
                                    <span className="font-bold">Efficiency:</span><br />
                                    Physical and Financial Accomplishments
                                </td>
                                <td className="border border-black p-2 align-top">
                                    <span className="font-bold">Effectiveness:</span>
                                    <ul className="list-none pl-0 mt-1 space-y-0.5">
                                        <li>1. At least 80%</li>
                                        <li>2. At least 4</li>
                                        <li>3. At least 80%</li>
                                        <li>4. At least 80%</li>
                                        <li>5. At least 90%</li>
                                    </ul>
                                    <span className="font-bold">Efficiency:</span><br />
                                    Physical and Financial Actual Outputs over Targets x 100
                                </td>
                                <td className="border border-black p-2 align-top">
                                    <span className="font-bold">Effectiveness:</span>
                                    <ul className="list-none pl-0 mt-1 space-y-0.5">
                                        <li>1. Updated PARe (Audit Planning to Follow-up)</li>
                                        <li>2. SPMS output rating,</li>
                                        <li>3. QME</li>
                                        <li>4. Audit Work Program</li>
                                        <li>5. CSS Monitoring Logsheet</li>
                                    </ul>
                                    <span className="font-bold">Efficiency:</span><br />
                                    OPB and Accomplishment Report
                                </td>
                                <AR ak="assessmentA" rk="remarksA" />
                            </tr>

                            {/* ── ROW B1 (rowSpan 3 for Component / Assessment / Remarks) ── */}
                            <tr>
                                <td rowSpan={3} className="border border-black p-2 align-top">
                                    B. Findings and recommendations which are based on facts and substantial evidence and in compliance with relevant laws, rules and regulations;
                                </td>
                                <td className="border border-black p-2 align-top">No. of audit recommendations</td>
                                <td className="border border-black p-2 align-top">No. of SILG approved audit recommendations</td>
                                <td className="border border-black p-2 align-top text-center font-bold italic">
                                    A. Sum of Ratings per Audit Finding over Total No. of Audit Findings
                                </td>
                                <td rowSpan={3} className="border border-black p-2 align-top">
                                    IAR<br /><br /><br /><br /><br />
                                    Consolidated rating of Item B of PARe results
                                </td>
                                <AR ak="assessmentB" rk="remarksB" rowSpan={3} minH="min-h-[180px]" />
                            </tr>

                            {/* ── ROW B2 ── */}
                            <tr>
                                <td className="border border-black p-2 align-top">Quality of Audit Findings and Audit Recommendations</td>
                                <td className="border border-black p-2 align-top">
                                    Average rating of Quality of Audit Findings<br />
                                    <span className="italic text-[10px]">[1) completeness; 2) appropriateness; 3) relevance; 4) factual; 5) evidence-based]</span>
                                    <br /><br />
                                    Average rating of Quality of Audit Recommendations<br />
                                    <span className="italic text-[10px]">[1) Specific; 2) Measurable; 3) Achievable; 4) Result-oriented; 5) Time-bound]</span>
                                </td>
                                <td className="border border-black p-2 align-top text-center">
                                    <span className="font-bold italic">B. Sum of Ratings per Audit Recommendation over Total No. of Recommendations</span><br /><br />
                                    <span className="font-bold italic">C. Sum of Ratings per Workpaper over Total No. of Workpapers</span><br /><br />
                                    <span className="font-bold">Note:<br />Average Rating is 3 or above = Met<br />Below 3 = Unmet</span>
                                </td>
                            </tr>

                            {/* ── ROW B3 ── */}
                            <tr>
                                <td className="border border-black p-2 align-top">Quality of Work Papers</td>
                                <td className="border border-black p-2 align-top">
                                    Average rating of Quality of Work Papers<br />
                                    <span className="italic text-[10px]">
                                        1) correct (accurate);<br />2) complete;<br />3) clear;<br />4) concise (few words);<br />5) coherent (organized)
                                    </span>
                                </td>
                                <td className="border border-black p-2" />
                            </tr>

                            {/* ── ROW C ── */}
                            <tr>
                                <td className="border border-black p-2 align-top">
                                    C. Application of internal auditing standards (NGICS, PGIAM and other relevant standards) pursuant to DBM rules and regulations;
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg"
                                        className="h-14 w-14 block mx-auto mt-2" alt="DILG Logo"
                                    />
                                </td>
                                <td className="border border-black p-2 align-top">
                                    To include Audit Reporting to Audit Follow-up accomplishments<br /><br />
                                    Compliance to Audit Process/Procedure<br /><br />
                                    <span className="italic text-[10px]">(Based on planned arrangements as indicated in the approved Audit Work Program)</span>
                                </td>
                                <td className="border border-black p-2 align-top">Percentage of met items in the Audit Work Program</td>
                                <td className="border border-black p-2 align-top text-center font-bold italic">
                                    No. of Activities Completed over Total No. of Activities Due x 100<br /><br />
                                    <span className="font-normal text-[10px]">Note:<br />80% and above = Met<br />Below 80% = Unmet</span>
                                </td>
                                <td className="border border-black p-2 align-top">
                                    Consolidated rating of Item C of PARe results, including audit reporting and follow-up
                                </td>
                                <AR ak="assessmentC" rk="remarksC" />
                            </tr>

                            {/* ── ROW D ── */}
                            <tr>
                                <td className="border border-black p-2 align-top">
                                    D. Findings and recommendations which promote the adequacy of internal control pursuant to DBM rules and regulations; and
                                </td>
                                <td className="border border-black p-2 align-top">
                                    Findings and recommendations addressed gaps, weaknesses and deficiencies of ICS
                                </td>
                                <td className="border border-black p-2 align-top">No. of audit findings and recommendations on internal control</td>
                                <td className="border border-black p-2 align-top text-center italic" style={{ color: '#7030a0' }}>
                                    No. of Control Deficiencies with corresponding Audit Finding and Recommendation/s over Total No. of Control Deficiencies x 100<br /><br />
                                    Note:<br />100% = Met<br />Below 100% = Unmet
                                </td>
                                <td className="border border-black p-2 align-top">
                                    Consolidated rating of Item D of PARe results, including audit reporting and follow-up
                                </td>
                                <AR ak="assessmentD" rk="remarksD" />
                            </tr>

                            {/* ── ROW E ── */}
                            <tr>
                                <td className="border border-black p-2 align-top">
                                    E. High standards of ethics and efficiency of public officials and employees are observed pursuant to CSC rules and regulations.
                                </td>
                                <td className="border border-black p-2 align-top">
                                    To include Audit Reporting to Audit Follow-up accomplishments<br /><br />
                                    On efficiency:<br />
                                    1. Scope <span className="italic" style={{ color: '#7030a0' }}>(audit areas and samples)</span><br />
                                    2. Cost <span className="italic" style={{ color: '#7030a0' }}>and Audit Activities Completed per Audit Work Program</span><br /><br />
                                    On ethics:<br />
                                    3. Discharged duties with utmost responsibility, integrity, competence and uphold public interest over personal interest based on RA 6713
                                </td>
                                <td className="border border-black p-2 align-top">
                                    Planned vs Actual<br />
                                    1. Scope<br />
                                    2. Cost<br /><br /><br />
                                    3. Rating on Individual Assessment on Demonstration of IA Principles
                                </td>
                                <td className="border border-black p-2 align-top italic text-[10px]" style={{ color: '#7030a0' }}>
                                    On efficiency:<br />
                                    1. No. of Audit Areas and Transactions Covered over Total No. of Audit Areas and Transactions planned to be covered x 100<br />
                                    Note:<br />At least 80% = Met<br />Below 80% = Unmet<br /><br />
                                    2. Actual Cost over Committed Cost x 100 with at least 80% completion of Audit Activities in the Audit Work Program<br />
                                    Note:<br />80-100% = Met<br />Less than 80% or more than 100% = Unmet<br /><br />
                                    On Ethics:<br />
                                    3. Sum of all Ratings of Team Members over 5<br /><br />
                                    At least 3 = Met<br />Below 3 = Unmet
                                </td>
                                <td className="border border-black p-2 align-top">
                                    Consolidated rating of Item E of PARe results, including audit reporting and follow-up
                                </td>
                                <AR ak="assessmentE" rk="remarksE" />
                            </tr>

                            {/* ── Footer row — Total Met ── */}
                            <tr>
                                <td colSpan={5} className="border border-black p-2 text-right font-bold bg-slate-50">
                                    Total Met
                                </td>
                                <td className="border border-black p-2 bg-slate-50">
                                    <input type="text" className="w-full bg-transparent outline-none border-b border-black text-center font-bold"
                                        value={formData.totalMet} onChange={e => set('totalMet', e.target.value)} disabled={ro} />
                                </td>
                                <td className="border border-black p-2 bg-slate-50" />
                            </tr>

                        </tbody>
                    </table>
                </div>

                {/* ── Overall Assessment ── */}
                <div className="mb-10">
                    <p className="font-bold underline mb-1">OVERALL ASSESSMENT</p>
                    <p className="italic text-[10px] text-gray-500 mb-2">(Describe results of assessment)</p>
                    <textarea
                        className="w-full border border-black p-2 text-[11px] font-serif resize-vertical bg-transparent outline-none min-h-[80px]"
                        value={formData.overallAssessment}
                        onChange={e => set('overallAssessment', e.target.value)}
                        disabled={ro}
                    />
                </div>

                {/* ── Signatories (top row) ── */}
                <div className="grid grid-cols-3 gap-x-12 text-[12px] font-serif mb-12">
                    {[
                        ['Prepared by:',  'preparedByName',  'preparedByPosition',  "Auditor's Name over Signature/Date"],
                        ['Reviewed by:',  'reviewedByName',  'reviewedByPosition',  "Team Leader's Name over Signature/Date"],
                        ['Approved by:',  'approvedByName',  null,                  'Head of Internal Audit Service/Date'],
                    ].map(([heading, nf, pf, lbl]) => (
                        <div key={nf}>
                            <p className="font-bold mb-10">{heading}</p>
                            <input type="text"
                                className="w-full bg-transparent outline-none border-b border-black font-bold mb-1"
                                value={formData[nf]} onChange={e => set(nf, e.target.value)} disabled={ro} />
                            <p className="italic text-[10px]">{lbl}</p>
                            {pf && (
                                <input type="text" placeholder="Position"
                                    className="w-full bg-transparent outline-none text-[11px] mt-1"
                                    value={formData[pf]} onChange={e => set(pf, e.target.value)} disabled={ro} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Document Control (StandardAuditFooter) ── */}
                <StandardAuditFooter
                    documentId={documentId}
                    history={signatureHistory}
                    onSigned={loadLatest}
                    readOnly={ro}
                    formData={formData}
                    setFormData={set}
                    sections={[{
                        label: 'Document Control',
                        labelClass: 'bg-indigo-900',
                        signatories: [
                            { label: 'Process Owner',         stage: 'Prepared', nameField: 'processOwner',    titleField: 'processOwnerTitle' },
                            { label: 'Division Chiefs',       stage: 'Reviewed', nameField: 'divisionChief',   titleField: 'divisionChiefTitle' },
                            { label: 'IAS Deputy QMR',        stage: 'Approved', nameField: 'qmrName',         titleField: 'qmrTitle' },
                        ],
                    }]}
                />

            </div>
        </AuditToolWrapper>
    );
}
