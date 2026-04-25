<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()?->approval_status === 'approved') {
            return redirect('/waiting-approval');
        }

        return $next($request);
    }
}