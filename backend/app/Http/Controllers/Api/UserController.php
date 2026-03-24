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
        // Return only approved auditors (including directors and division chiefs)
        $auditors = User::where('role', 'auditor')
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
