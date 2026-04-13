import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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

/**
 * Maps the URL "tool key" to the corresponding tool component.
 * These keys are set in the AuditWorkspace.jsx DOCUMENTS constant.
 */
const TOOL_MAP = {
    aap:   AuditAreaProfile,
    iom:   InventoryMOVs,
    ccl:   ComplianceChecklist,
    oac:   OperationsAuditChecklist,
    mac:   ManagementAuditChecklist,
    wt:    WalkthroughTest,
    ecb:   EntryConferenceBriefer,
    neecm: NoticeConference,
    awp:   AuditWorkProgram,
};

/**
 * AuditTool page — renders the correct interactive audit tool
 * based on the URL params: /workspace/:id/tool/:toolKey
 *
 * The `readOnly` prop is computed from the logged-in user's designation.
 * Auditee users always get read-only access.
 */
export default function AuditTool() {
    const { id, toolKey } = useParams();
    const [engagement, setEngagement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get the current user from localStorage (consistent with the rest of the app)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAuditee = user.role === 'auditee';

    useEffect(() => {
        const fetchEngagement = async () => {
            try {
                const res = await api.get(`/engagements/${id}`);
                setEngagement(res.data);
            } catch (e) {
                setError('Failed to load engagement details. Please go back and try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchEngagement();
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

    return (
        <ToolComponent
            engagement={engagement}
            engagementId={id}
            readOnly={isAuditee}
        />
    );
}
