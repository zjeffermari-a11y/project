<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Engagement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EngagementController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Diagnostic logging for Render
            \Illuminate\Support\Facades\Log::info("Fetching engagements for user", [
                'user_id' => $user->id,
                'role' => $user->role
            ]);

            // Ensure the engagements table exists before querying
            if (!\Illuminate\Support\Facades\Schema::hasTable('engagements')) {
                \Illuminate\Support\Facades\Log::warning("Engagements table missing on Render.");
                return response()->json([]);
            }

            $executiveRoles = ['director', 'division_chief', 'assistant_division_chief'];

            if ($user->role === 'auditor' || in_array($user->designation, $executiveRoles)) {
                // Auditors and executives see all engagements
                return response()->json(Engagement::with(['movs.auditee', 'documents.uploader', 'users'])->get());
            } else {
                // Auditees only see engagements they are involved in (via MOVs or enrollment)
                $engagements = Engagement::where(function ($q) use ($user) {
                    $q->whereHas('movs', function ($mq) use ($user) {
                        $mq->where('auditee_id', $user->id);
                    })->orWhereHas('users', function ($uq) use ($user) {
                        $uq->where('users.id', $user->id);
                    });
                })->with([
                    'movs' => function ($q) use ($user) {
                        $q->where('auditee_id', $user->id);
                    },
                    'users'
                ])->get();
                return response()->json($engagements);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("CRITICAL: Failed to fetch engagements in production: " . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            // Return empty array instead of 500 to maintain UX
            return response()->json([]);
        }
    }

    public function store(Request $request)
    {
        // Executives (director, division_chief, assistant_division_chief) and lead auditors can create engagements
        $user = Auth::user();
        $allowedDesignations = ['director', 'division_chief', 'assistant_division_chief', 'lead_auditor'];
        if ($user->role !== 'auditor' && !in_array($user->designation, $allowedDesignations)) {
            return response()->json(['message' => 'Unauthorized. Only Directors, Division Chiefs, and Lead Auditors may register audit engagements.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'offices' => 'nullable|array',
            'offices.*' => 'exists:users,id',
            'leadAuditors' => 'nullable|array',
            'leadAuditors.*' => 'exists:users,id',
            'assistantLeaders' => 'nullable|array',
            'assistantLeaders.*' => 'exists:users,id',
            'members' => 'nullable|array',
            'members.*' => 'exists:users,id'
        ]);

        // Generate AE Number: AE-YYYY-XXX
        $year = date('Y');
        $count = Engagement::whereYear('created_at', $year)->count() + 1;
        $aeNumber = "AE-{$year}-" . str_pad($count, 3, '0', STR_PAD_LEFT);
        $validated['ae_number'] = $aeNumber;

        $engagement = Engagement::create($validated);

        if (!empty($validated['leadAuditors'])) {
            foreach ($validated['leadAuditors'] as $userId) {
                $engagement->users()->attach($userId, ['role_in_engagement' => 'team_leader']);
            }
        }
        if (!empty($validated['assistantLeaders'])) {
            foreach ($validated['assistantLeaders'] as $userId) {
                $engagement->users()->attach($userId, ['role_in_engagement' => 'assistant_leader']);
            }
        }
        if (!empty($validated['members'])) {
            foreach ($validated['members'] as $userId) {
                $engagement->users()->attach($userId, ['role_in_engagement' => 'member']);
            }
        }

        if (!empty($validated['offices'])) {
            // Generate a default tracking MOV for each auditee
            foreach ($validated['offices'] as $auditee_id) {
                \App\Models\Mov::create([
                    'engagement_id' => $engagement->id,
                    'auditee_id' => $auditee_id,
                    'requirement_name' => 'Initial Compliance Requirements',
                    'status' => 'pending'
                ]);
            }
        }

        return response()->json($engagement, 201);
    }

    public function show($id)
    {
        return response()->json(Engagement::with(['movs.auditee', 'documents', 'users'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $allowedDesignations = ['director', 'division_chief', 'assistant_division_chief', 'lead_auditor'];
        if ($user->role !== 'auditor' && !in_array($user->designation, $allowedDesignations)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $engagement = Engagement::findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'leadAuditors' => 'nullable|array',
            'leadAuditors.*' => 'exists:users,id',
            'assistantLeaders' => 'nullable|array',
            'assistantLeaders.*' => 'exists:users,id',
            'members' => 'nullable|array',
            'members.*' => 'exists:users,id'
        ]);

        $engagement->update($request->only(['title', 'description', 'status', 'start_date', 'end_date']));

        if ($request->has('leadAuditors') || $request->has('assistantLeaders') || $request->has('members')) {
            $syncData = [];
            if ($request->has('leadAuditors')) {
                foreach ($request->input('leadAuditors') as $userId) {
                    $syncData[$userId] = ['role_in_engagement' => 'team_leader'];
                }
            }
            if ($request->has('assistantLeaders')) {
                foreach ($request->input('assistantLeaders') as $userId) {
                    // Only add if not already a team leader
                    if (!isset($syncData[$userId])) {
                        $syncData[$userId] = ['role_in_engagement' => 'assistant_leader'];
                    }
                }
            }
            if ($request->has('members')) {
                foreach ($request->input('members') as $userId) {
                    // Only add if not already a leader
                    if (!isset($syncData[$userId])) {
                        $syncData[$userId] = ['role_in_engagement' => 'member'];
                    }
                }
            }
            $engagement->users()->sync($syncData);
        }

        return response()->json($engagement->load('users'));
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $allowedDesignations = ['director', 'division_chief', 'assistant_division_chief', 'lead_auditor'];
        if ($user->role !== 'auditor' && !in_array($user->designation, $allowedDesignations)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $engagement = Engagement::findOrFail($id);
        $engagement->delete();

        return response()->json(['message' => 'Engagement deleted successfully']);
    }

    /**
     * Mark an audit phase as explicitly completed by a Team Leader.
     * Only users with the 'team_leader' role in the engagement are permitted.
     * PATCH /engagements/{id}/complete-phase
     */
    public function completePhase(Request $request, $id)
    {
        $user    = Auth::user();
        $engagement = Engagement::findOrFail($id);

        // Authorise: must be team_leader for this engagement, or a director/division chief
        $executiveDesignations = ['director', 'division_chief', 'assistant_division_chief'];
        $pivot = $engagement->users()->where('users.id', $user->id)->first();
        $roleInEngagement = $pivot?->pivot?->role_in_engagement;

        $isTeamLeader = $roleInEngagement === 'team_leader';
        $isExecutive  = in_array($user->designation, $executiveDesignations);

        if (!$isTeamLeader && !$isExecutive) {
            return response()->json(['message' => 'Only Team Leaders or Executives may mark a phase as complete.'], 403);
        }

        $request->validate([
            'phase' => 'required|in:planning,execution,reporting,followup',
        ]);

        $phase = $request->phase;
        $current = $engagement->phase_completions ?? [];
        $current[$phase] = now()->toISOString();
        $engagement->update(['phase_completions' => $current]);

        // Auto-advance the engagement status to the next phase
        $phaseOrder  = ['planning', 'execution', 'reporting', 'followup'];
        $currentIdx  = array_search($phase, $phaseOrder);
        if ($currentIdx !== false && isset($phaseOrder[$currentIdx + 1])) {
            $engagement->update(['status' => $phaseOrder[$currentIdx + 1]]);
        }

        return response()->json([
            'message'           => ucfirst($phase) . ' phase marked as complete.',
            'phase_completions' => $engagement->fresh()->phase_completions,
            'status'            => $engagement->fresh()->status,
        ]);
    }

    /**
     * Static helper — returns true if `$phase` is accessible for `$engagement`.
     * Planning is always open. Every other phase requires the previous phase to be
     * in phase_completions OR all its interactive tool documents to be approved.
     */
    public static function isPhaseUnlocked(Engagement $engagement, string $phase): bool
    {
        $phaseOrder = ['planning', 'execution', 'reporting', 'followup'];
        $idx = array_search($phase, $phaseOrder);
        if ($idx <= 0) return true; // planning always open

        $prevPhase = $phaseOrder[$idx - 1];

        // Check persisted completion flag first (fastest)
        $completions = $engagement->phase_completions ?? [];
        if (!empty($completions[$prevPhase])) return true;

        // Fallback: derive from document approvals (mirrors frontend logic)
        $toolDocLabels = [
            'planning'  => [
                'Interactive Flowchart', 'Inventory of MOVs (IM)', 'Audit Area Profile (AAP)',
                'Audit Work Program (AWP)', 'Compliance Checklist (CC)', 'Management Audit Checklist',
            ],
            'execution' => [
                'Notice of Entry/Exit Conference (ECM)', 'Entry Conference Briefer (ECB)',
                'Operations Audit Checklist (OAC)', 'Walkthrough Test Work Paper (WT)',
            ],
            'reporting' => [],
            'followup'  => [],
        ];

        $requiredLabels = $toolDocLabels[$prevPhase] ?? [];
        if (empty($requiredLabels)) return true;

        foreach ($requiredLabels as $label) {
            $doc = \App\Models\Document::where('engagement_id', $engagement->id)
                ->where('phase', $prevPhase)
                ->where('document_type', $label)
                ->latest()
                ->first();

            if (!$doc) return false;

            // Check approval signal (mirrors frontend docIsApproved)
            $approved = $doc->approved_by_id !== null
                || $doc->status === 'approved'
                || $doc->history()->whereIn('stage', ['approved_by', 'Approved'])->exists();

            if (!$approved) return false;
        }

        return true;
    }

    public function activityLogs($id)
    {

        $engagement = Engagement::findOrFail($id);

        // Allowed users: Auditors + Auditees involved
        $user = Auth::user();
        if ($user->role !== 'auditor') {
            $isInvolved = $engagement->movs()->where('auditee_id', $user->id)->exists();
            if (!$isInvolved)
                return response()->json(['message' => 'Unauthorized'], 403);
        }

        $logs = \App\Models\ActivityLog::with('user')
            ->where('engagement_id', $id)
            ->latest()
            ->get();

        return response()->json($logs);
    }
}
