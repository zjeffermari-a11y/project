<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    public function pending()
    {
        // Only return users who are pending approval
        $users = User::where('approval_status', 'pending')->get();
        return response()->json($users);
    }

    public function auditors()
    {
        // Return all approved internal users (Auditors, Chiefs, Directors) 
        // who can be part of an audit team, excluding Auditees.
        $auditors = User::where('role', '!=', 'auditee')
            ->where('approval_status', 'approved')
            ->get(['id', 'name', 'email', 'agency_name', 'designation']);
        return response()->json($auditors);
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
