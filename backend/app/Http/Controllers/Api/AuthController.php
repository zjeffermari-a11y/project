<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'designation' => 'required|in:director,division_chief,assistant_division_chief,lead_auditor,auditor,assistant_auditor,auditee',
            'agency_name' => 'nullable|string|max:255',
        ]);

        $role = $validated['designation'] === 'auditee' ? 'auditee' : 'auditor';

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'designation' => $validated['designation'],
            'role' => $role,
            'agency_name' => $validated['agency_name'] ?? 'DILG Compliance Office',
            'approval_status' => 'pending',
        ]);

        return response()->json(['message' => 'Registration successful. Waiting for Director approval.'], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            if ($user->approval_status !== 'approved') {
                Auth::guard('web')->logout();
                return response()->json(['message' => 'Your account is currently pending Director approval.'], 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user
            ]);
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
