<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mov;
use App\Models\Engagement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MovController extends Controller
{
    public function index(Engagement $engagement)
    {
        $user = Auth::user();
        $movs = $engagement->movs()->with('auditee')->get();

        if ($user->role === 'auditee') {
            $movs = $movs->where('auditee_id', $user->id)->values();
        }

        return response()->json($movs);
    }

    public function store(Request $request, Engagement $engagement)
    {
        // Both auditors and executives can add MOVs (though usually auditors)
        if (!in_array(Auth::user()->role, ['auditor', 'team_leader', 'division_chief', 'director'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'requirement_name' => 'required|string|max:255',
            'drive_link' => 'nullable|url',
            'auditee_id' => 'required|exists:users,id',
        ]);

        $mov = $engagement->movs()->create([
            'requirement_name' => $validated['requirement_name'],
            'drive_link' => $validated['drive_link'] ?? null,
            'auditee_id' => $validated['auditee_id'],
            'status' => 'pending'
        ]);

        return response()->json($mov, 201);
    }

    public function update(Request $request, Mov $mov)
    {
        $user = Auth::user();
        
        $rules = [
            'status' => 'nullable|in:pending,submitted,approved,returned',
            'management_comment' => 'nullable|string|max:2000',
        ];

        // Role-based rules
        if (in_array($user->role, ['auditor', 'team_leader', 'division_chief', 'director'])) {
            $rules['requirement_name'] = 'nullable|string|max:255';
            $rules['drive_link'] = 'nullable|url';
            $rules['auditee_id'] = 'nullable|exists:users,id';
        }

        if ($user->role === 'auditee') {
            $rules['auditee_response_1'] = 'nullable|string|max:255';
            $rules['auditee_response_2'] = 'nullable|string|max:255';
            $rules['auditee_response_3'] = 'nullable|string|max:255';
        }

        $validated = $request->validate($rules);

        // Security Check
        if ($user->role === 'auditee') {
            if ($mov->auditee_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            // Auditees cannot change auditor fields
            unset($validated['requirement_name'], $validated['drive_link'], $validated['auditee_id']);
        }

        $mov->update($validated);

        // Auto-update engagement status logic (same as before)
        $this->syncEngagementStatus($mov->engagement);

        return response()->json($mov->fresh());
    }

    public function updateStatus(Request $request, Mov $mov)
    {
        return $this->update($request, $mov);
    }

    private function syncEngagementStatus(Engagement $engagement)
    {
        $allMovs = $engagement->movs()->get();
        $total = $allMovs->count();

        if ($total > 0) {
            $approvedCount = $allMovs->where('status', 'approved')->count();
            $returnedCount = $allMovs->where('status', 'returned')->count();
            $submittedCount = $allMovs->where('status', 'submitted')->count();

            if ($approvedCount === $total) {
                $engagement->update(['status' => 'completed']);
            }
            elseif ($returnedCount > 0) {
                $engagement->update(['status' => 'returned']);
            }
            elseif ($submittedCount > 0 || $approvedCount > 0) {
                $engagement->update(['status' => 'in_review']);
            }
            else {
                $engagement->update(['status' => 'planning']);
            }
        }
    }

    public function destroy(Mov $mov)
    {
        if (!in_array(Auth::user()->role, ['auditor', 'team_leader', 'division_chief', 'director'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $engagement = $mov->engagement;
        $mov->delete();
        $this->syncEngagementStatus($engagement);

        return response()->json(['message' => 'Deleted successfully']);
    }
}
