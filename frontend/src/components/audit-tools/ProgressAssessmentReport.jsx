import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import StandardAuditFooter from '../common/StandardAuditFooter';
import { formatRef } from '../../utils/formatters';

const TOOL_KEY = 'pare';

export default function ProgressAssessmentReport({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);
    const [formData, setFormData] = useState({
        pareRef: formatRef('PARE', engagement.ae_number),
        engagementTitle: engagement.title || '',
        period: '',
        teamLeader: '', asistantTeamLeader: '', teamMembers: '',
        // KPI assessments
        complianceProgram: '', managementSystem: '', operationsProgram: '',
        assessmentResultA: '', remarksA: '',
        qualityFindingsResult: '', qualityFindingsRemarks: '',
        auditWorkProgramResult: '', auditWorkProgramRemarks: '',
        internalControlResult: '', internalControlRemarks: '',
        ethicsResult: '', ethicsRemarks: '',
        overallAssessment: '', totalMet: '',
        // Signatories
        preparedByName: '', preparedByPosition: '',
        reviewedByName: '', reviewedByPosition: '',
        approvedByName: '',
    });

    const fetchVersions = async () => {
        try { const r = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}/versions`); setVersions(r.data); } catch (_) {}
    };
    const loadLatest = async () => {
        try {
            const r = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}`);
            if (r.data?.form_data) {
                setDocumentId(r.data.id); setSignatureHistory(r.data.signatures || []);
                setFormData(p => ({ ...p, ...r.data.form_data }));
            }
        } catch (_) {}
    };
    useEffect(() => { loadLatest(); fetchVersions(); }, [engagement.id]);

    const handleVersionSelect = v => {
        setCurrentVersion(v); setDocumentId(v.id); setSignatureHistory(v.signatures || []);
        setFormData(p => ({ ...p, ...v.form_data }));
    };

    const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const r = await api.post(`/engagements/${engagement.id}/tools/${TOOL_KEY}`,
                { form_data: formData, document_type: 'Progress Assessment Report (PARe)', phase: 'execution' });
            setLastSaved(new Date().toLocaleTimeString()); setDocumentId(r.data.tool.id); fetchVersions();
        } catch (e) { alert('Save failed: ' + e.message); } finally { setSaving(false); }
    };

    const ro = readOnly || !!currentVersion;
    const tA = 'w-full bg-transparent outline-none resize-vertical p-1 text-[11px] leading-relaxed';
    const dI = 'bg-transparent outline-none border-b border-black text-[12px] px-1 font-bold';

    // Reusable assessment+remarks cell pair used repeatedly in the PARE table
    const AssessResult = ({ resultKey, remarksKey, minH = 'min-h-[120px]' }) => (
        <>
            <td className="border border-black p-1" rowSpan={1}>
                <textarea className={`${tA} ${minH}`} style={{ fontFamily: 'serif' }}
                    value={formData[resultKey] || ''} onChange={e => set(resultKey, e.target.value)} disabled={ro} />
            </td>
            <td className="border border-black p-1" rowSpan={1}>
                <textarea className={`${tA} ${minH}`} style={{ fontFamily: 'serif' }}
                    value={formData[remarksKey] || ''} onChange={e => set(remarksKey, e.target.value)} disabled={ro} />
            </td>
        </>
    );

    return (
        <AuditToolWrapper toolTitle="Progress Assessment Report (PARe)" toolCode="PARE" phase="Audit Execution"
            engagementTitle={engagement.title} onSave={handleSave} isSaving={saving} lastSaved={lastSaved}
            readOnly={ro} versions={versions} currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect} onNewDraft={() => { setCurrentVersion(null); loadLatest(); }}>

            <div className="bg-white shadow-2xl w-[1400px] mx-auto my-8 px-14 py-16 font-serif relative overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg"
                        className="h-16 w-16" alt="DILG Seal" />
                    <div>
                        <p className="text-[11px] text-gray-800">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</p>
                        <h1 className="text-xl font-black tracking-wide">PROGRESS ASSESSMENT REPORT (PARe)</h1>
                        <p className="text-[9px] text-gray-500 italic">FM-QP-DILG-IAS-33-29 | Rev001</p>
                    </div>
                </div>

                {/* Meta fields */}
                <div className="grid grid-cols-[160px_10px_400px] gap-y-2 mb-8 text-[12px] font-bold items-center">
                    {[
                        ['PARe Reference No.', 'pareRef'],
                        ['Engagement Title', 'engagementTitle'],
                        ['Period', 'period'],
                    ].map(([lbl, k]) => (
                        <><div key={lbl}>{lbl}</div><div>:</div>
                        <div><input type="text" className={`${dI} w-full`} value={formData[k]} onChange={e => set(k, e.target.value)} disabled={ro || k === 'pareRef' || k === 'engagementTitle'} /></div></>
                    ))}
                    <div className="mt-4">Team/s Composition</div><div className="mt-4" /><div className="mt-4" />
                    {[['Team Leader', 'teamLeader'], ['Assistant Team Leader', 'asistantTeamLeader'], ['Team Member/s', 'teamMembers']].map(([lbl, k]) => (
                        <><div key={lbl}>{lbl}</div><div>:</div>
                        <div><input type="text" className={`${dI} w-full`} value={formData[k]} onChange={e => set(k, e.target.value)} disabled={ro} /></div></>
                    ))}
                </div>

                {/* Main KPI Table */}
                <div className="mb-10 overflow-x-auto">
                    <table className="w-full border-collapse text-[11px] font-serif" style={{ minWidth: '1280px' }}>
                        <thead>
                            <tr className="bg-slate-100 font-bold text-center">
                                <th rowSpan={2} className="border border-black p-2 w-48">Component</th>
                                <th rowSpan={2} className="border border-black p-2 w-52">Focus</th>
                                <th colSpan={2} className="border border-black p-2">Key Performance Indicators</th>
                                <th rowSpan={2} className="border border-black p-2 w-32">MOV</th>
                                <th rowSpan={2} className="border border-black p-2 w-36">Assessment Result(s)</th>
                                <th rowSpan={2} className="border border-black p-2 w-44">Remarks<br /><span className="text-[9px] font-normal italic">(If unmet indicate reason(s)/interventions)</span></th>
                            </tr>
                            <tr className="bg-slate-100 font-bold text-center">
                                <th className="border border-black p-2 w-44">Performance Areas</th>
                                <th className="border border-black p-2 w-44">Formula and Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* COMPONENT A — 3 rows */}
                            <tr>
                                <td rowSpan={3} className="border border-black p-2 align-top">A. Audit/Assessment Objectives are met as reflected in the findings and recommendations</td>
                                <td className="border border-black p-2 align-top">
                                    <span className="font-bold">Compliance Audit Objective:</span><br />
                                    To determine the degree of compliance with existing laws, rules, regulations and managerial policies and operating procedures, including compliance with accountability measures and contractual obligations of{' '}
                                    <input type="text" className="inline border-b border-black outline-none bg-transparent w-16 text-center font-bold text-[10px]"
                                        placeholder="(Program)" value={formData.complianceProgram} onChange={e => set('complianceProgram', e.target.value)} disabled={ro} />
                                </td>
                                <td className="border border-black p-2 align-top">1. No. of audit findings and recommendations on compliance<br /><br />2. Percentage of compliance</td>
                                <td className="border border-black p-2 align-top font-bold italic text-gray-700">
                                    1. Sum of No. of Findings per Objective over Total No. of Findings x 100<br /><br />
                                    2. Sum of No. of Recommendations per Objective over Total No. of Recommendations x 100<br /><br />
                                    <span className="text-[10px]">Note:<br />100% = Met<br />less than 100% = Unmet</span>
                                </td>
                                <td rowSpan={3} className="border border-black p-2 text-center font-bold align-middle">IAR/HoAF</td>
                                <td rowSpan={3} className="border border-black p-1">
                                    <textarea className={`${tA} min-h-[180px]`} style={{ fontFamily: 'serif' }} value={formData.assessmentResultA} onChange={e => set('assessmentResultA', e.target.value)} disabled={ro} />
                                </td>
                                <td rowSpan={3} className="border border-black p-1">
                                    <textarea className={`${tA} min-h-[180px]`} style={{ fontFamily: 'serif' }} value={formData.remarksA} onChange={e => set('remarksA', e.target.value)} disabled={ro} placeholder="1.&#13;&#10;&#13;&#10;2." />
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 align-top">
                                    <span className="font-bold">Management Audit Objective:</span><br />
                                    To evaluate the effectiveness of internal controls adapted in the{' '}
                                    <input type="text" className="inline border-b border-black outline-none bg-transparent w-16 text-center font-bold text-[10px]"
                                        placeholder="(System/Process)" value={formData.managementSystem} onChange={e => set('managementSystem', e.target.value)} disabled={ro} />
                                </td>
                                <td className="border border-black p-2 align-top">1. No. of audit findings and recommendations on internal control<br /><br />2. Percentage of internal controls effectiveness</td>
                                <td className="border border-black p-2 align-top font-bold italic text-gray-700">Note:<br />100% = Met<br />less than 100% = Unmet</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 align-top">
                                    <span className="font-bold">Operations Audit Objective:</span><br />
                                    To evaluate input, process, output and outcome as to economy, efficiency, ethicality and effectiveness of the{' '}
                                    <input type="text" className="inline border-b border-black outline-none bg-transparent w-16 text-center font-bold text-[10px]"
                                        placeholder="(Program)" value={formData.operationsProgram} onChange={e => set('operationsProgram', e.target.value)} disabled={ro} />
                                </td>
                                <td className="border border-black p-2 align-top">1. No. of audit findings and recommendations on 4Es<br /><br />2. Percentage of 4Es<br />__% Economy<br />__% Efficiency<br />__% Ethicality<br />__% Effectiveness</td>
                                <td className="border border-black p-2 bg-gray-50/50" />
                            </tr>

                            {/* COMPONENT B — 2 rows */}
                            <tr>
                                <td rowSpan={2} className="border border-black p-2 align-top">B. Findings and recommendations are based on facts and substantial evidence and in compliance with relevant laws, rules and regulations</td>
                                <td className="border border-black p-2 align-top">Quality of Audit Findings and Audit Recommendations</td>
                                <td className="border border-black p-2 align-top">Average rating of Quality of Audit Findings<br /><span className="italic text-[10px]">[1) completeness; 2) appropriateness; 3) relevance; 4) factual; 5) evidence-based]</span><br /><br />Average rating of Quality of Audit Recommendations<br /><span className="italic text-[10px]">[1) Specific; 2) Measurable; 3) Attainable; 4) Realistic; 5) Time-bound]</span></td>
                                <td className="border border-black p-2 align-top font-bold italic text-gray-700">1. Sum of Ratings per Audit Findings over Total No. of Audit Findings<br /><br />2. Sum of Ratings per Audit Recommendation over Total No. of Recommendations<br /><br />3. Sum of Ratings per Workpaper over Total No. of Workpapers</td>
                                <td rowSpan={2} className="border border-black p-2 text-center text-[11px] align-middle">(SPMS SI rating)<br /><br />Individual Audit Findings<br /><span className="italic text-[10px]">(total average rating of all members)</span><br /><br /><br />Work Papers<br /><span className="italic text-[10px]">(Walkthrough Test and Test of Control)</span></td>
                                <td rowSpan={2} className="border border-black p-1"><textarea className={`${tA} min-h-[130px]`} style={{ fontFamily: 'serif' }} value={formData.qualityFindingsResult} onChange={e => set('qualityFindingsResult', e.target.value)} disabled={ro} /></td>
                                <td rowSpan={2} className="border border-black p-1"><textarea className={`${tA} min-h-[130px]`} style={{ fontFamily: 'serif' }} value={formData.qualityFindingsRemarks} onChange={e => set('qualityFindingsRemarks', e.target.value)} disabled={ro} placeholder="1.&#13;&#10;&#13;&#10;2.&#13;&#10;&#13;&#10;3." /></td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 align-top">Quality of Work Papers</td>
                                <td className="border border-black p-2 align-top">Average percentage of Quality of Work Papers<br />1) correct (accurate); 2) complete; 3) clear; 4) concise; 5) coherent (organized)<br /><br />- averaging per audit findings (no. of WP referred)</td>
                                <td className="border border-black p-2 align-top font-bold italic text-gray-700">Note:<br />Average Rating is 3 or above = Met<br />Below 3 = Unmet</td>
                            </tr>

                            {/* COMPONENT C */}
                            <tr>
                                <td className="border border-black p-2 align-top">C. Internal auditing standards (NGICS, PGIAM and other relevant standards) pursuant to DBM rules and regulations are applied</td>
                                <td className="border border-black p-2 align-top">Compliance to Audit Process/Procedure<br /><br /><span className="italic text-[10px]">(Based on planned arrangements as indicated in the approved Audit Work Program)</span></td>
                                <td className="border border-black p-2 align-top">Percentage of met items in the Audit Work Program</td>
                                <td className="border border-black p-2 align-top font-bold italic text-gray-700">No. of Activities Completed over Total No. of Activities Due x 100<br /><br />Note:<br />80% and above = Met<br />Below 80% = Unmet</td>
                                <td className="border border-black p-2 text-center align-middle">Audit Work Program</td>
                                <td className="border border-black p-1"><textarea className={tA} style={{ fontFamily: 'serif' }} value={formData.auditWorkProgramResult} onChange={e => set('auditWorkProgramResult', e.target.value)} disabled={ro} /></td>
                                <td className="border border-black p-1"><textarea className={tA} style={{ fontFamily: 'serif' }} value={formData.auditWorkProgramRemarks} onChange={e => set('auditWorkProgramRemarks', e.target.value)} disabled={ro} /></td>
                            </tr>

                            {/* COMPONENT D */}
                            <tr>
                                <td className="border border-black p-2 align-top">D. Findings and recommendations promote the adequacy of internal control pursuant to DBM rules and regulations</td>
                                <td className="border border-black p-2 align-top">Findings and recommendations addressed gaps, weaknesses and deficiencies of ICS</td>
                                <td className="border border-black p-2 align-top">No. of audit findings and recommendations on internal control</td>
                                <td className="border border-black p-2 align-top font-bold italic text-gray-700">No. of Control Deficiencies with corresponding Audit Finding and Recommendation/s over Total No. of Control Deficiencies x 100<br /><br />Note:<br />100% = Met<br />Below 100% = Unmet</td>
                                <td className="border border-black p-2 text-center align-middle">IAR/HoAF</td>
                                <td className="border border-black p-1"><textarea className={tA} style={{ fontFamily: 'serif' }} value={formData.internalControlResult} onChange={e => set('internalControlResult', e.target.value)} disabled={ro} /></td>
                                <td className="border border-black p-1"><textarea className={tA} style={{ fontFamily: 'serif' }} value={formData.internalControlRemarks} onChange={e => set('internalControlRemarks', e.target.value)} disabled={ro} /></td>
                            </tr>

                            {/* COMPONENT E */}
                            <tr>
                                <td className="border border-black p-2 align-top">E. High standards of ethics and efficiency of public officials and employees are observed pursuant to CSC rules and regulations.</td>
                                <td className="border border-black p-2 align-top">
                                    <span className="font-bold">On efficiency:</span><br />1. Scope<br />2. Cost and Audit Activities Completed per Audit Work Program<br /><br />
                                    <span className="font-bold">On ethics:</span><br />3. Discharged duties with utmost responsibility, integrity, competence and uphold public interest over personal interest based on RA 6713
                                </td>
                                <td className="border border-black p-2 align-top">Planned vs Actual<br />1. Scope<br />2. Cost<br /><br /><br />3. Rating on Individual Assessment on Demonstration of IA Principles</td>
                                <td className="border border-black p-2 align-top font-bold italic text-gray-700 text-[10px]">
                                    On efficiency:<br />1. No. of Audit Areas and Transactions Covered over Total Planned x 100<br />Note: At least 80% = Met; Below 80% = Unmet<br /><br />
                                    2. Actual Cost over Committed Cost x 100<br />Note: 80-100% = Met<br /><br />
                                    On Ethics:<br />3. Sum of all Ratings of Team Members over 5<br />At least 3 = Met; Below 3 = Unmet
                                </td>
                                <td className="border border-black p-2 text-center text-[11px] align-middle">1. AEP, IAR<br />2. OPB Accomplishment Report<br /><br /><br />3. Individual Assessment on Demonstration of IA Principles (PMES)</td>
                                <td className="border border-black p-1"><textarea className={`${tA} min-h-[130px]`} style={{ fontFamily: 'serif' }} value={formData.ethicsResult} onChange={e => set('ethicsResult', e.target.value)} disabled={ro} /></td>
                                <td className="border border-black p-1"><textarea className={`${tA} min-h-[130px]`} style={{ fontFamily: 'serif' }} value={formData.ethicsRemarks} onChange={e => set('ethicsRemarks', e.target.value)} disabled={ro} placeholder="1.&#13;&#10;&#13;&#10;2.&#13;&#10;&#13;&#10;3." /></td>
                            </tr>

                            {/* Overall Assessment */}
                            <tr>
                                <td colSpan={4} className="border border-black p-4 bg-slate-50">
                                    <p className="font-bold text-sm">OVERALL ASSESSMENT</p>
                                    <p className="italic text-[10px] text-gray-500 mb-2">(Describe results of assessment)</p>
                                    <textarea className={`${tA} min-h-[50px] bg-white border border-slate-200`} style={{ fontFamily: 'serif' }} value={formData.overallAssessment} onChange={e => set('overallAssessment', e.target.value)} disabled={ro} />
                                </td>
                                <td className="border border-black p-2 text-right font-bold align-bottom text-[11px]">Total Met</td>
                                <td className="border border-black p-2 align-bottom">
                                    <input type="text" className="w-full text-center border-b border-black bg-transparent outline-none font-bold" value={formData.totalMet} onChange={e => set('totalMet', e.target.value)} disabled={ro} />
                                </td>
                                <td className="border border-black p-2 text-center font-bold align-bottom text-[11px]">% (X/10 x 100)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Prepared/Reviewed/Approved signatories */}
                <div className="grid grid-cols-3 gap-x-12 text-[12px] font-serif mb-10">
                    {[
                        ['Prepared by:', 'preparedByName', 'preparedByPosition', "Auditor's Name over Signature/Date"],
                        ['Reviewed by:', 'reviewedByName', 'reviewedByPosition', "Team Leader's Name over Signature/Date"],
                        ['Approved by:', 'approvedByName', null, 'Head of Internal Audit Service/Date'],
                    ].map(([heading, nf, pf, lbl]) => (
                        <div key={nf}>
                            <p className="font-bold mb-8">{heading}</p>
                            <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold mb-1"
                                value={formData[nf]} onChange={e => set(nf, e.target.value)} disabled={ro} />
                            <p className="italic text-[10px]">{lbl}</p>
                            {pf && <input type="text" placeholder="Position" className="w-full bg-transparent outline-none text-[11px] mt-1"
                                value={formData[pf]} onChange={e => set(pf, e.target.value)} disabled={ro} />}
                        </div>
                    ))}
                </div>

                <StandardAuditFooter documentId={documentId} history={signatureHistory} onSigned={loadLatest}
                    readOnly={ro} formData={formData} setFormData={set}
                    sections={[{ label: 'Document Control', labelClass: 'bg-indigo-900', signatories: [
                        { label: 'Process Owner', stage: 'Prepared', nameField: 'processOwner', titleField: 'processOwnerTitle' },
                        { label: 'ADC/OIC-Division Chief', stage: 'Reviewed', nameField: 'adcName', titleField: 'adcTitle' },
                        { label: 'IAS Deputy QMR', stage: 'Approved', nameField: 'qmrName', titleField: 'qmrTitle' },
                    ]}]} />
            </div>
        </AuditToolWrapper>
    );
}
