<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mov;
use App\Models\Engagement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MovController extends Controller
{
    public function store(Request $request, Engagement $engagement)
    {
        if (Auth::user()->role !== 'auditor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'requirement_name' => 'required|string|max:255',
            'auditee_id' => 'required|exists:users,id',
        ]);

        $mov = $engagement->movs()->create([
            'requirement_name' => $validated['requirement_name'],
            'auditee_id' => $validated['auditee_id'],
            'status' => 'pending'
        ]);

        return response()->json($mov, 201);
    }

    public function updateStatus(Request $request, Mov $mov)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,submitted,approved,returned'
        ]);

        $user = Auth::user();

        // Auditees can only mark as submitted, Auditors can mark anything
        if ($user->role === 'auditee') {
            if ($mov->auditee_id !== $user->id)
                return response()->json(['message' => 'Unauthorized'], 403);
            if ($validated['status'] !== 'submitted')
                return response()->json(['message' => 'Auditees can only submit.'], 403);
        }
        elseif ($user->role !== 'auditor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $mov->update(['status' => $validated['status']]);

        // Auto-update engagement status based on MOV states
        $engagement = $mov->engagement;
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

        return response()->json($mov->fresh());
    }
}
