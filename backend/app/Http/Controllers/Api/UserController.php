<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function pending()
    {
        try {
            // Defensive check for Render users without terminal access
            if (!Schema::hasColumn('users', 'approval_status')) {
                return response()->json([]);
            }

            $users = User::where('approval_status', 'pending')->get();
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error("Failed to fetch pending users: " . $e->getMessage());
            return response()->json(['error' => 'Database error'], 500);
        }
    }

    public function auditors()
    {
        try {
            // Defensive check for missing columns (common on fresh Render deploys)
            if (!Schema::hasColumn('users', 'approval_status') || !Schema::hasColumn('users', 'role')) {
                Log::warning("Required columns missing in users table. Returning empty list.");
                return response()->json([]);
            }

            // Return all approved internal users (Auditors, Chiefs, Directors) 
            // who can be part of an audit team, excluding Auditees.
            $query = User::where('approval_status', 'approved');
            
            if (Schema::hasColumn('users', 'role')) {
                $query->where('role', '!=', 'auditee');
            }

            $results = $query->get(['id', 'name', 'email', 'agency_name', 'designation']);
            return response()->json($results);
        } catch (\Exception $e) {
            Log::error("Failed to fetch auditors: " . $e->getMessage());
            // Return empty array instead of 500 to keep UI functional
            return response()->json([]);
        }
    }

    public function approve(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $user = User::findOrFail($id);
        $user->approval_status = $validated['status'];
        $user->save();

        return response()->json(['message' => "User {$validated['status']} successfully", 'user' => $user]);
    }
}
