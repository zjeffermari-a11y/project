import { useState, useEffect } from 'react';
import api from '../../api';
import AuditToolWrapper from './AuditToolWrapper';
import StandardAuditFooter from '../common/StandardAuditFooter';

const TOOL_KEY = 'iar';
const eF = () => ({ title: '' });
const eFind = () => ({ conclusion:'', ccRef:'', criteria:'', condition:'', managementComments:'', iasRejoinder:'', causeConsequence:'', recommendations:'' });
const eOther = () => ({ conclusion:'', criteria:'', condition:'', managementComments:'', iasRejoinder:'', causeConsequence:'', recommendations:'' });
const eSRow = () => ({ iamRef:'', gaps:'', recommendation:'', actionsTaken:'', remarks:'' });

export default function InternalAuditReport({ engagement, readOnly = false }) {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [signatureHistory, setSignatureHistory] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(null);
    const [formData, setFormData] = useState({
        engagementTitle: engagement.title || '',
        approvedByName:'', approvedByDate:'',
        tableOfContents:'', introduction:'',
        executiveSummaryIntro:'', auditObjectivesScope:'', executiveOverallConclusion:'', executiveSummaryFindings:'',
        monitoringEvaluation:'', annexes:'',
        overallConclusionCompliance:'', overallConclusionControl:'', overallConclusionOther:'',
        auditorName:'', auditorPosition:'', tlName:'', tlPosition:'', iasHeadName:'',
        favorableObs:[eF()], findings:[eFind()], otherFindings:[eOther()], summaryRows:[eSRow(), eSRow()],
    });

    const fetchVersions = async () => {
        try { const r = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}/versions`); setVersions(r.data); } catch (_) {}
    };
    const loadLatest = async () => {
        try {
            const r = await api.get(`/engagements/${engagement.id}/tools/${TOOL_KEY}`);
            if (r.data?.form_data) {
                setDocumentId(r.data.id); setSignatureHistory(r.data.signatures||[]);
                const fd = r.data.form_data;
                setFormData(p=>({...p,...fd,
                    favorableObs:fd.favorableObs?.length?fd.favorableObs:[eF()],
                    findings:fd.findings?.length?fd.findings:[eFind()],
                    otherFindings:fd.otherFindings?.length?fd.otherFindings:[eOther()],
                    summaryRows:fd.summaryRows?.length?fd.summaryRows:[eSRow(),eSRow()],
                }));
            }
        } catch (_) {}
    };
    useEffect(() => { loadLatest(); fetchVersions(); }, [engagement.id]);

    const handleVersionSelect = v => {
        setCurrentVersion(v); setDocumentId(v.id); setSignatureHistory(v.signatures||[]);
        const fd=v.form_data;
        setFormData(p=>({...p,...fd,
            favorableObs:fd.favorableObs?.length?fd.favorableObs:[eF()],
            findings:fd.findings?.length?fd.findings:[eFind()],
            otherFindings:fd.otherFindings?.length?fd.otherFindings:[eOther()],
            summaryRows:fd.summaryRows?.length?fd.summaryRows:[eSRow(),eSRow()],
        }));
    };

    const set = (k,v) => setFormData(f=>({...f,[k]:v}));
    const upArr = (arrKey,i,field,val) => setFormData(f=>{
        const a=[...f[arrKey]]; a[i]={...a[i],[field]:val}; return {...f,[arrKey]:a};
    });
    const addTo = (arrKey,template) => setFormData(f=>({...f,[arrKey]:[...f[arrKey],template()]}));

    const handleSave = async () => {
        setSaving(true);
        try {
            const r = await api.post(`/engagements/${engagement.id}/tools/${TOOL_KEY}`,
                { form_data:formData, document_type:'Internal Audit Report (IAR)', phase:'execution' });
            setLastSaved(new Date().toLocaleTimeString()); setDocumentId(r.data.tool.id); fetchVersions();
        } catch(e){alert('Save failed: '+e.message);} finally{setSaving(false);}
    };

    const ro = readOnly||!!currentVersion;
    const tA = 'w-full bg-transparent outline-none resize-vertical p-2 text-[13px] leading-relaxed';
    const pageWrap = 'bg-white shadow-2xl w-[1100px] mx-auto my-8 px-24 py-20 font-serif min-h-[1123px] flex flex-col relative overflow-hidden';
    const wm = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-[160px] text-black/[0.03] font-bold font-sans whitespace-nowrap pointer-events-none select-none';

    const FindBlock = ({arrKey,i,showCCRef=false}) => (
        <div className="mb-10 bg-white/50 p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex gap-2 font-bold italic text-base mb-2">
                <span>{arrKey==='otherFindings'?'Other ':''}{arrKey==='favorableObs'?'':'Audit Findings No. '+(i+1)+':'}</span>
                <input type="text" className="flex-1 border-b border-black bg-transparent outline-none"
                    placeholder="(Conclusion)" value={formData[arrKey][i]?.conclusion||''}
                    onChange={e=>upArr(arrKey,i,'conclusion',e.target.value)} disabled={ro} />
            </div>
            {showCCRef && <input type="text" className="w-full bg-transparent outline-none italic text-gray-600 mb-4 text-sm"
                placeholder="(CC/ICC/PPIC Ref. No. and statement)" value={formData[arrKey][i]?.ccRef||''}
                onChange={e=>upArr(arrKey,i,'ccRef',e.target.value)} disabled={ro} />}
            {[['Criteria:','criteria'],["Management's Comments:",'managementComments'],['IAS Rejoinder:','iasRejoinder'],
              ['Condition:','condition'],['Cause and Consequence:','causeConsequence'],['Recommendation/s:','recommendations']
            ].map(([lbl,field])=>(
                <div key={field} className="grid grid-cols-[210px_1fr] gap-4 mb-2 items-start">
                    <div className="italic text-sm pl-4 pt-2">{lbl}</div>
                    <textarea className={`${tA} min-h-[44px] border border-gray-200 bg-white`} style={{fontFamily:'serif'}}
                        value={formData[arrKey][i]?.[field]||''} onChange={e=>upArr(arrKey,i,field,e.target.value)} disabled={ro} />
                </div>
            ))}
        </div>
    );

    return (
        <AuditToolWrapper toolTitle="Internal Audit Report" toolCode="IAR" phase="Audit Execution"
            engagementTitle={engagement.title} onSave={handleSave} isSaving={saving} lastSaved={lastSaved}
            readOnly={ro} versions={versions} currentVersion={currentVersion}
            onVersionSelect={handleVersionSelect} onNewDraft={()=>{setCurrentVersion(null);loadLatest();}}>

            {/* PAGE 1 — Cover */}
            <div className={pageWrap}>
                <div className={wm}>CONFIDENTIAL</div>
                <div className="text-right text-[10px] font-sans text-gray-400 mb-4 z-10 relative">FM-QP-DILG-IAS-33-04 | Rev02 | 10.10.22</div>
                <div className="flex flex-col items-center mb-10 z-10 relative">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Seal_of_the_Department_of_the_Interior_and_Local_Government.svg" className="h-24 w-24 mb-3" alt="DILG Seal"/>
                    <p className="text-sm text-gray-800">Republic of the Philippines</p>
                    <h1 className="text-lg font-black font-sans tracking-wide mt-1">DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT</h1>
                    <p className="text-xs text-gray-600 mt-1">DILG-NAPOLCOM Center, EDSA cor. Quezon Avenue, West Triangle, Quezon City</p>
                    <a href="http://www.dilg.gov.ph" className="text-xs text-blue-600 mt-1">www.dilg.gov.ph</a>
                </div>
                <div className="text-center mb-12 z-10 relative">
                    <h2 className="text-xl font-bold tracking-wide mb-3 uppercase">Internal Audit Report</h2>
                    <div className="flex justify-center items-center gap-1 text-lg font-bold mb-2">
                        <span>(</span><input type="text" className="border-b border-black bg-transparent outline-none text-center w-80 font-bold"
                            placeholder="Audit Engagement Title" value={formData.engagementTitle}
                            onChange={e=>set('engagementTitle',e.target.value)} disabled={ro}/><span>)</span>
                    </div>
                    <div className="flex justify-center items-center gap-1 text-base font-bold">
                        <span>(</span><input type="text" className="border-b border-black bg-transparent outline-none text-center w-48 font-bold"
                            value={engagement.ae_number||''} readOnly/><span>)</span>
                    </div>
                </div>
                <div className="space-y-6 flex-1 z-10 relative">
                    <h3 className="font-bold italic text-lg uppercase">Executive Summary</h3>
                    {[['Introduction','executiveSummaryIntro'],['Audit Objectives, Scope and Methodology','auditObjectivesScope'],
                      ['Overall Conclusion','executiveOverallConclusion'],['Summary of Internal Audit Findings and Recommendations','executiveSummaryFindings']
                    ].map(([lbl,k])=>(
                        <div key={k}><h4 className="font-bold italic text-base mb-1">{lbl}</h4>
                        <textarea className={`${tA} min-h-[80px]`} style={{fontFamily:'serif'}} value={formData[k]||''} onChange={e=>set(k,e.target.value)} disabled={ro}/></div>
                    ))}
                </div>
                <div className="text-center w-full max-w-lg mx-auto mt-12 mb-6 z-10 relative">
                    <p className="font-bold mb-8 text-left pl-12">Approved by:</p>
                    <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold mb-1 text-center text-lg"
                        placeholder="[Name]" value={formData.approvedByName} onChange={e=>set('approvedByName',e.target.value)} disabled={ro}/>
                    <p className="font-bold italic text-sm uppercase">Secretary of the Interior and Local Government</p>
                    <input type="text" className="bg-transparent outline-none border-b border-black font-bold italic text-center text-sm w-48 mt-3"
                        placeholder="Date" value={formData.approvedByDate} onChange={e=>set('approvedByDate',e.target.value)} disabled={ro}/>
                </div>
                <div className="text-right text-sm font-bold z-10 relative">Page 1 of 4</div>
            </div>

            {/* PAGE 2 — TOC + Primary Findings */}
            <div className={pageWrap}>
                <div className={wm}>CONFIDENTIAL</div>
                <div className="z-10 relative flex-1">
                    <h3 className="font-bold italic text-lg uppercase mb-4">Table of Contents</h3>
                    <textarea className={`${tA} min-h-[80px] mb-10`} style={{fontFamily:'serif'}} placeholder="[List contents here...]"
                        value={formData.tableOfContents} onChange={e=>set('tableOfContents',e.target.value)} disabled={ro}/>
                    <div className="flex items-start gap-4 mb-4 font-bold italic text-lg uppercase"><span>I.</span><span>Introduction</span></div>
                    <textarea className={`${tA} min-h-[70px] mb-10 pl-8`} style={{fontFamily:'serif'}}
                        value={formData.introduction} onChange={e=>set('introduction',e.target.value)} disabled={ro}/>
                    <div className="flex items-start gap-4 mb-6 font-bold italic text-lg uppercase"><span>II.</span><span>Audit Findings and Recommendations</span></div>
                    <div className="pl-6">
                        {formData.favorableObs.map((obs,i)=>(
                            <div key={i} className="flex items-center gap-2 mb-3">
                                <span className="font-bold italic text-base whitespace-nowrap">Favorable Observation No. {i+1}:</span>
                                <input type="text" className="flex-1 border-b border-black bg-transparent outline-none italic text-base"
                                    value={obs.title} onChange={e=>upArr('favorableObs',i,'title',e.target.value)} disabled={ro}/>
                            </div>
                        ))}
                        {!ro && <button onClick={()=>addTo('favorableObs',eF)} className="text-indigo-600 font-bold text-xs hover:underline mb-8 block">+ Add Favorable Observation</button>}
                        {formData.findings.map((_,i)=><FindBlock key={i} arrKey="findings" i={i} showCCRef/>)}
                        {!ro && <button onClick={()=>addTo('findings',eFind)} className="text-indigo-600 font-bold text-sm hover:underline mb-8 block">+ Add Primary Audit Finding</button>}
                    </div>
                </div>
                <div className="text-right text-sm font-bold z-10 relative">Page 2 of 4</div>
            </div>

            {/* PAGE 3 — Other Findings + Summary Table + Conclusions */}
            <div className={pageWrap}>
                <div className={wm}>CONFIDENTIAL</div>
                <div className="z-10 relative flex-1 pl-6">
                    {formData.otherFindings.map((_,i)=><FindBlock key={i} arrKey="otherFindings" i={i}/>)}
                    {!ro && <button onClick={()=>addTo('otherFindings',eOther)} className="text-indigo-600 font-bold text-sm hover:underline mb-10 block">+ Add Other Audit Finding</button>}
                    <h4 className="font-bold uppercase text-base mb-4">Summary of Interim Audit Findings <span className="text-sm normal-case">(as applicable)</span></h4>
                    <table className="w-full border-collapse border-2 border-black text-xs text-center mb-2">
                        <thead><tr className="bg-slate-100 font-bold italic">
                            {['Item No.','IAM Ref. No.','Gaps/Absence/Breakdown','Recommendation','Actions Taken','Remarks'].map(h=>(
                                <th key={h} className="border-2 border-black p-2">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{formData.summaryRows.map((row,i)=>(
                            <tr key={i}>
                                <td className="border-2 border-black p-1 font-bold">{i+1}</td>
                                <td className="border-2 border-black p-1"><input type="text" className="w-full text-center outline-none bg-transparent" value={row.iamRef} onChange={e=>upArr('summaryRows',i,'iamRef',e.target.value)} disabled={ro}/></td>
                                {['gaps','recommendation','actionsTaken','remarks'].map(f=>(
                                    <td key={f} className="border-2 border-black p-1">
                                        <textarea className="w-full bg-transparent outline-none resize-vertical p-1 min-h-[36px]" style={{fontFamily:'serif'}} value={row[f]} onChange={e=>upArr('summaryRows',i,f,e.target.value)} disabled={ro}/>
                                    </td>
                                ))}
                            </tr>
                        ))}</tbody>
                    </table>
                    {!ro && <button onClick={()=>addTo('summaryRows',eSRow)} className="text-indigo-600 font-bold text-xs hover:underline mb-10 block">+ Add Summary Row</button>}
                    <h4 className="font-bold italic text-base uppercase mb-4">Overall Conclusion <span className="normal-case">(per objective)</span></h4>
                    <div className="pl-6 space-y-4">
                        {[['On Compliance','overallConclusionCompliance'],['On Control Effectiveness and/or 4Es','overallConclusionControl'],['On other Audit Objective/s','overallConclusionOther']].map(([lbl,k])=>(
                            <div key={k}><h5 className="font-bold italic text-sm mb-1">{lbl}</h5>
                            <textarea className={`${tA} min-h-[60px]`} style={{fontFamily:'serif'}} value={formData[k]} onChange={e=>set(k,e.target.value)} disabled={ro}/></div>
                        ))}
                    </div>
                    <div className="flex items-start gap-4 mb-4 mt-8 font-bold italic text-lg uppercase"><span>III.</span><span>Monitoring and Evaluation</span></div>
                    <textarea className={`${tA} min-h-[70px] mb-8 pl-8`} style={{fontFamily:'serif'}} value={formData.monitoringEvaluation} onChange={e=>set('monitoringEvaluation',e.target.value)} disabled={ro}/>
                    <div className="flex items-start gap-4 mb-4 font-bold italic text-lg uppercase"><span>IV.</span><span>Annexes</span></div>
                    <textarea className={`${tA} min-h-[70px] pl-8`} style={{fontFamily:'serif'}} value={formData.annexes} onChange={e=>set('annexes',e.target.value)} disabled={ro}/>
                </div>
                <div className="text-right text-sm font-bold z-10 relative">Page 3 of 4</div>
            </div>

            {/* PAGE 4 — Signatories */}
            <div className={pageWrap}>
                <div className={wm}>CONFIDENTIAL</div>
                <div className="z-10 relative font-bold text-[15px] space-y-12 w-1/2 mb-auto mt-10">
                    <p>Submitted by:</p>
                    {[['auditorName','auditorPosition',"Auditor's Name over Signature/Date"],
                      ['tlName','tlPosition',"Team Leader's Name over Signature/Date"],
                      ['iasHeadName',null,'Head of Internal Audit Service/Date']
                    ].map(([nf,pf,lbl])=>(
                        <div key={nf}>
                            <input type="text" className="w-full bg-transparent outline-none border-b border-black font-bold mb-1"
                                value={formData[nf]} onChange={e=>set(nf,e.target.value)} disabled={ro}/>
                            <p className="text-sm">{lbl}</p>
                            {pf && <input type="text" placeholder="Position" className="w-full bg-transparent outline-none text-sm mt-1 font-normal"
                                value={formData[pf]} onChange={e=>set(pf,e.target.value)} disabled={ro}/>}
                        </div>
                    ))}
                </div>
                <StandardAuditFooter documentId={documentId} history={signatureHistory} onSigned={loadLatest}
                    readOnly={ro} formData={formData} setFormData={set}
                    className="mt-12 pt-6 border-t-2 border-slate-100"
                    sections={[{label:'Document Control',labelClass:'bg-indigo-900',signatories:[
                        {label:'Process Owner',stage:'Prepared',nameField:'processOwner',titleField:'processOwnerTitle'},
                        {label:'Division Chiefs',stage:'Reviewed',nameField:'divisionChiefs',titleField:'divisionChiefsTitle'},
                        {label:'IAS Deputy QMR',stage:'Approved',nameField:'qmrName',titleField:'qmrTitle'},
                    ]}]}/>
                <div className="text-right text-sm font-bold z-10 relative mt-4">Page 4 of 4</div>
            </div>
        </AuditToolWrapper>
    );
}
