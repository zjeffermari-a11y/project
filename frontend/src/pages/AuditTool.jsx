import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import api from '../api';

// --- Tool Components ---
import AuditAreaProfile from '../components/audit-tools/AuditAreaProfile';
import InventoryMOVs from '../components/audit-tools/InventoryMOVs';
import ComplianceChecklist from '../components/audit-tools/ComplianceChecklist';
import OperationsAuditChecklist from '../components/audit-tools/OperationsAuditChecklist';
import ManagementAuditChecklist from '../components/audit-tools/ManagementAuditChecklist';
import WalkthroughTest from '../components/audit-tools/WalkthroughTest';
import EntryConferenceBriefer from '../components/audit-tools/EntryConferenceBriefer';
import NoticeConference from '../components/audit-tools/NoticeConference';
import AuditWorkProgram from '../components/audit-tools/AuditWorkProgram';
import InteractiveFlowchart from '../components/audit-tools/InteractiveFlowchart';
import AuditInquiryMemorandum from '../components/audit-tools/AuditInquiryMemorandum';
import HighlightsAuditFindings from '../components/audit-tools/HighlightsAuditFindings';
import IndividualAuditFindings from '../components/audit-tools/IndividualAuditFindings';
import InterimAuditMemorandum from '../components/audit-tools/InterimAuditMemorandum';
import InternalAuditReport from '../components/audit-tools/InternalAuditReport';
import ProgressAssessmentReport from '../components/audit-tools/ProgressAssessmentReport';
import CompletionAssessmentReport from '../components/audit-tools/CompletionAssessmentReport';
import AuditeeActionPlan from '../components/audit-tools/AuditeeActionPlanStatus';
import IAsCARes from '../components/audit-tools/IAsCARes';

/**
 * Maps the URL "tool key" to the corresponding tool component.
 * These keys are set in the AuditWorkspace.jsx DOCUMENTS constant.
 */
const TOOL_MAP = {
    aap:       AuditAreaProfile,
    iom:       InventoryMOVs,
    ccl:       ComplianceChecklist,
    ccl2:      ComplianceChecklist,          // complianceCL.html — same component, different doc label
    oac:       OperationsAuditChecklist,
    mac:       ManagementAuditChecklist,
    wt:        WalkthroughTest,
    ecb:       EntryConferenceBriefer,
    neecm:     NoticeConference,
    awp:       AuditWorkProgram,
    flowchart: InteractiveFlowchart,
    // Execution tools
    ainm:      AuditInquiryMemorandum,
    hoaf:      HighlightsAuditFindings,
    iaf:       IndividualAuditFindings,
    iam:       InterimAuditMemorandum,
    iar:       InternalAuditReport,
    pare:      ProgressAssessmentReport,
    // Follow-Up tools
    comare:    CompletionAssessmentReport,
    aapis:     AuditeeActionPlan,
    iascares:  IAsCARes,
};

/**
 * Phase/tool mapping — mirrors AuditWorkspace.jsx DOCUMENTS constant.
 * Used to determine which phase a toolKey belongs to for gate enforcement.
 */
const PHASE_ORDER = ['planning', 'execution', 'reporting', 'followup'];

const PHASE_TOOLS = {
    // Planning: all tools now live here (Wt, OAC, NEECM, ECB moved from Execution)
    planning:  ['flowchart', 'iom', 'aap', 'awp', 'ccl', 'ccl2', 'mac', 'oac', 'wt', 'neecm', 'ecb'],
    // Execution: new 6-form set
    execution: ['ainm', 'hoaf', 'iaf', 'iam', 'iar', 'pare'],
    reporting: [],
    followup:  ['comare', 'aapis', 'iascares'],
};

const PHASE_DOCS = {
    planning: [
        { label: 'Interactive Flowchart',                         toolKey: 'flowchart' },
        { label: 'Inventory of MOVs (IM)',                        toolKey: 'iom' },
        { label: 'Audit Area Profile (AAP)',                      toolKey: 'aap' },
        { label: 'Audit Work Program (AWP)',                      toolKey: 'awp' },
        { label: 'Compliance Checklist (CC)',                     toolKey: 'ccl' },
        { label: 'Compliance Checklist (Compliance CL)',          toolKey: 'ccl2' },
        { label: 'Management Audit Checklist (MAC)',              toolKey: 'mac' },
        { label: 'Operations Audit Checklist (OAC)',              toolKey: 'oac' },
        { label: 'Walkthrough Test Work Paper (WT)',              toolKey: 'wt' },
        { label: 'Notice of Entry/Exit Conference (NEECM)',       toolKey: 'neecm' },
        { label: 'Entry Conference Briefer (ECB)',                toolKey: 'ecb' },
    ],
    execution: [
        { label: 'Audit Inquiry Memorandum (AINM)',               toolKey: 'ainm' },
        { label: 'Highlights of Audit Findings (HOAF)',           toolKey: 'hoaf' },
        { label: 'Individual Audit Findings (IAF)',               toolKey: 'iaf' },
        { label: 'Interim Audit Memorandum (IAM)',                toolKey: 'iam' },
        { label: 'Internal Audit Report (IAR)',                   toolKey: 'iar' },
        { label: 'Progress Assessment Report (PARE)',             toolKey: 'pare' },
    ],
    followup: [
        { label: 'Completion Assessment Report (ComARe)',         toolKey: 'comare' },
        { label: "Auditee's Action Plan and Implementation Status (AAPIS)", toolKey: 'aapis' },
        { label: 'Internal Assessment of Compliance with Audit Recommendation/s (IAsCARes)', toolKey: 'iascares' },
    ],
};


/** Returns true if a document record has an approval signal. */
function docIsApproved(doc) {
    if (!doc) return false;
    if (doc.approved_by_id != null) return true;
    if (doc.status === 'approved') return true;
    return doc.history?.some(h => {
        const s = (h.stage || '').toLowerCase().replace(/\s+/g, '_');
        return s === 'approved_by' || s === 'approved';
    }) ?? false;
}

/** Returns true if all tool docs in `phaseId` are approved. */
function isPhaseApproved(phaseId, allDocuments) {
    const gateDocs = PHASE_DOCS[phaseId] || [];
    const toolGateDocs = gateDocs.filter(d => d.toolKey);
    if (toolGateDocs.length === 0) return true;
    return toolGateDocs.every(docDef => {
        const matches = allDocuments.filter(
            d => d.phase === phaseId && d.document_type === docDef.label
        );
        if (matches.length === 0) return false;
        const latest = matches.sort((a, b) => b.id - a.id)[0];
        return docIsApproved(latest);
    });
}

/** Given a toolKey, find which phase it belongs to. */
function getPhaseForTool(toolKey) {
    for (const [phase, keys] of Object.entries(PHASE_TOOLS)) {
        if (keys.includes(toolKey)) return phase;
    }
    return null;
}

/**
 * AuditTool page — renders the correct interactive audit tool
 * based on the URL params: /workspace/:id/tool/:toolKey
 *
 * The `readOnly` prop is computed from the logged-in user's designation.
 * Auditee users always get read-only access.
 */
export default function AuditTool() {
    const { id, toolKey } = useParams();
    const navigate = useNavigate();
    const [engagement, setEngagement] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get the current user from localStorage (consistent with the rest of the app)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAuditee = user.role === 'auditee';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [engRes, docsRes] = await Promise.all([
                    api.get(`/engagements/${id}`),
                    api.get(`/engagements/${id}/documents`),
                ]);
                setEngagement(engRes.data);
                setDocuments(docsRes.data?.data || docsRes.data || []);
            } catch (e) {
                setError('Failed to load engagement details. Please go back and try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Audit Tool...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center bg-slate-800 border border-red-800 p-8 rounded-2xl max-w-sm">
                    <p className="text-red-400 font-bold text-sm mb-2">⚠ Error Loading Tool</p>
                    <p className="text-slate-400 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const ToolComponent = TOOL_MAP[toolKey];

    if (!ToolComponent) {
        return (
            <div className="h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-sm">
                    <p className="text-slate-300 font-bold text-sm mb-2">Unknown Tool</p>
                    <p className="text-slate-500 text-sm">No tool found for key: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400">{toolKey}</code></p>
                </div>
            </div>
        );
    }

    // --- Phase Gate Enforcement ---
    // Determine which phase this tool belongs to. If it's not planning (always open),
    // verify that the preceding phase has all its tool documents fully approved.
    const toolPhase = getPhaseForTool(toolKey);
    const phaseIdx = PHASE_ORDER.indexOf(toolPhase);
    if (phaseIdx > 0) {
        const prevPhase = PHASE_ORDER[phaseIdx - 1];
        if (!isPhaseApproved(prevPhase, documents)) {
            const prevPhaseLabel = prevPhase.charAt(0).toUpperCase() + prevPhase.slice(1);
            return (
                <div className="h-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
                    <div className="text-center bg-slate-800 border border-amber-800/60 p-10 rounded-2xl max-w-md shadow-2xl">
                        <div className="w-16 h-16 bg-amber-900/40 border border-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <Lock className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-white font-black text-lg mb-2 uppercase tracking-wider">Phase Locked</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            This tool belongs to the <span className="text-amber-400 font-bold capitalize">{toolPhase}</span> phase.
                            All <span className="text-amber-400 font-bold">{prevPhaseLabel}</span> interactive documents
                            must be fully approved before proceeding.
                        </p>
                        <button
                            onClick={() => navigate(`/auditor/workspace/${id}`)}
                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Workspace
                        </button>
                    </div>
                </div>
            );
        }
    }

    return (
        <ToolComponent
            engagement={engagement}
            engagementId={id}
            user={user}
            readOnly={isAuditee}
        />
    );
}
