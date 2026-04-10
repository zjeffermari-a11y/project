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

            if ($user->role === 'auditor') {
                return response()->json(Engagement::with(['movs.auditee', 'documents.uploader', 'users'])->get());
            } else {
                // Auditees only see engagements they are involved in (via MOVs)
                $engagements = Engagement::whereHas('movs', function ($q) use ($user) {
                    $q->where('auditee_id', $user->id);
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
        // Only auditors can create
        if (Auth::user()->role !== 'auditor') {
            return response()->json(['message' => 'Unauthorized'], 403);
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
                $engagement->users()->attach($userId, ['role_in_engagement' => 'lead_auditor']);
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
        if (Auth::user()->role !== 'auditor') {
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
            'members' => 'nullable|array',
            'members.*' => 'exists:users,id'
        ]);

        $engagement->update($request->only(['title', 'description', 'status', 'start_date', 'end_date']));

        if ($request->has('leadAuditors') || $request->has('members')) {
            $syncData = [];
            if ($request->has('leadAuditors')) {
                foreach ($request->input('leadAuditors') as $userId) {
                    $syncData[$userId] = ['role_in_engagement' => 'lead_auditor'];
                }
            }
            if ($request->has('members')) {
                foreach ($request->input('members') as $userId) {
                    // Only add if not already a lead
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
        if (Auth::user()->role !== 'auditor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $engagement = Engagement::findOrFail($id);
        $engagement->delete();

        return response()->json(['message' => 'Engagement deleted successfully']);
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
