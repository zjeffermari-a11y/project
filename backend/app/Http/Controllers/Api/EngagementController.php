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
        $user = Auth::user();
        if ($user->role === 'auditor') {
            return response()->json(Engagement::with(['movs.auditee', 'documents.uploader', 'users'])->get());
        }
        else {
            // Auditees only see engagements they are involved in (via MOVs)
            $engagements = Engagement::whereHas('movs', function ($q) use ($user) {
                $q->where('auditee_id', $user->id);
            })->with(['movs' => function ($q) use ($user) {
                $q->where('auditee_id', $user->id);
            }, 'users'])->get();
            return response()->json($engagements);
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
        $engagement->update($request->only(['title', 'description', 'status', 'start_date', 'end_date']));

        return response()->json($engagement);
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
}
