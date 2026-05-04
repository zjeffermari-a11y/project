<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class SocialAuthController extends Controller
{
    /**
     * Supported SSO providers and their human-readable labels.
     * 'google' → Google Workspace for Government
     * 'azure'  → Microsoft 365 / Outlook (via SocialiteProviders/MicrosoftAzure)
     */
    private array $allowedProviders = ['google', 'azure'];

    /**
     * Redirect the user to the OAuth provider's login page.
     * GET /auth/{provider}/redirect
     */
    public function redirect(string $provider)
    {
        if (!in_array($provider, $this->allowedProviders)) {
            return response()->json(['message' => 'Unsupported SSO provider.'], 400);
        }

        $socialite = Socialite::driver($provider)->stateless();

        // For Google: restrict sign-in to .gov.ph hosted domain accounts only.
        // This shows only gov workspace accounts in the picker and rejects personal Gmail.
        if ($provider === 'google') {
            $socialite = $socialite->with(['hd' => 'gov.ph']);
        }

        return $socialite->redirect();
    }

    /**
     * Handle the OAuth provider callback and issue a Sanctum token.
     * GET /auth/{provider}/callback
     *
     * On success → redirects frontend to /sso-callback?token=...&user=...
     * On failure → redirects frontend to /login?sso_error=...
     */
    public function callback(string $provider)
    {
        if (!in_array($provider, $this->allowedProviders)) {
            return redirect(config('app.frontend_url') . '/login?sso_error=unsupported_provider');
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            Log::error("SSO callback error [{$provider}]: " . $e->getMessage());
            return redirect(config('app.frontend_url') . '/login?sso_error=auth_failed');
        }

        $email = $socialUser->getEmail();

        // Enforce .gov.ph domain regardless of provider
        if (!$email || !str_ends_with(strtolower($email), '.gov.ph')) {
            return redirect(config('app.frontend_url') . '/login?sso_error=invalid_domain');
        }

        // Find existing user or create one with default pending state
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name'            => $socialUser->getName() ?? $socialUser->getNickname() ?? $email,
                'email'           => $email,
                'password'        => bcrypt(Str::random(32)), // unusable random password
                'designation'     => 'auditor',               // default — admin promotes later
                'role'            => 'auditor',
                'agency_name'     => 'DILG',
                'approval_status' => 'pending',               // director must still approve
                'email_verified_at' => now(),                 // SSO = email already verified
            ]
        );

        // Mark email as verified if not already (covers returning users who registered manually)
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        // SSO users still require director approval
        if ($user->approval_status !== 'approved') {
            return redirect(config('app.frontend_url') . '/login?sso_error=pending_approval');
        }

        $token = $user->createToken('sso_token')->plainTextToken;

        // Pass token + serialized user back to the SPA via URL params.
        // The frontend SPA reads these in /sso-callback and stores them.
        $userJson = urlencode(json_encode($user));

        return redirect(config('app.frontend_url') . "/sso-callback?token={$token}&user={$userJson}");
    }
}
