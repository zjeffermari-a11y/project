<?php

use Illuminate\Support\Facades\Route;

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
