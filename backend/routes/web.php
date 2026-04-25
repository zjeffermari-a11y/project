<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Redirect root to the React app
Route::get('/', function () {
    return redirect('/app');
});

// Serve the React SPA for all /app routes (catch-all for client-side routing)
Route::get('/app/{any?}', function () {
    $appPath = public_path('app/index.html');
    if (file_exists($appPath)) {
        return file_get_contents($appPath);
    }
    return view('welcome');
})->where('any', '.*');

/*
|--------------------------------------------------------------------------
| Shared Tools Hub (Accessible by All Roles)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified.email', 'approved'])->group(function () {
    Route::get('/tools', function () {
        return view('tools');
    });
    // ... all your tools routes ...
});

/*
|--------------------------------------------------------------------------
| Role-Specific Dashboards & Actions
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified.email', 'approved'])->group(function () {
    Route::get('/director_dashboard', function () {
        // ...
    });
    Route::get('/auditor_portal', function () {
        // ...
    });
    // ... all your dashboard routes ...
});