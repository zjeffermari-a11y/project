<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\Api\ToolController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Fallback for unauthenticated API requests to prevent "Route [login] not defined" 500 errors
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// Emergency Migration Route for Render Free Tier
Route::get('/system/migrate', function () {
    try {
        Artisan::call('migrate', ['--force' => true]);
        return response()->json([
            'message' => 'Migrations executed successfully.',
            'output' => Artisan::output()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Migration failed',
            'message' => $e->getMessage()
        ], 500);
    }
});

// Emergency Diagnostic Route for Render Debugging (reads the last 100 lines of laravel.log)
Route::get('/system/logs', function () {
    $logFile = storage_path('logs/laravel.log');
    if (!file_exists($logFile)) {
        return response()->json(['message' => 'Log file does not exist.'], 404);
    }

    // Read the last 100 lines
    $file = new \SplFileObject($logFile, 'r');
    $file->seek(PHP_INT_MAX);
    $last_line = $file->key();
    $lines = new \LimitIterator($file, max(0, $last_line - 100));
    $output = [];
    foreach ($lines as $line) {
        $output[] = $line;
    }

    return response()->json([
        'logs' => $output
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/pending', [UserController::class, 'pending']);
    Route::get('/users/auditors', [UserController::class, 'auditors']);
    Route::patch('/users/{id}/approve', [UserController::class, 'approve']);

    Route::get('/user', [AuthController::class, 'user']);
    Route::get(
        '/auditees',
        function () {
            return response()->json(\App\Models\User::where('role', 'auditee')->get());
        }
    );
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Engagements
    Route::apiResource('engagements', App\Http\Controllers\Api\EngagementController::class);

    // MOVs
    Route::post('/engagements/{engagement}/movs', [App\Http\Controllers\Api\MovController::class, 'store']);
    Route::patch('/movs/{mov}/status', [App\Http\Controllers\Api\MovController::class, 'updateStatus']);

    // Documents
    Route::get('/engagements/{engagement}/documents', [App\Http\Controllers\Api\DocumentController::class, 'index']);
    Route::get('/documents/{document}/download', [App\Http\Controllers\Api\DocumentController::class, 'download']);
    Route::post('/documents/upload', [App\Http\Controllers\Api\DocumentController::class, 'upload']);
    Route::post('/documents/{document}/sign', [App\Http\Controllers\Api\DocumentController::class, 'sign']);
    Route::post('/documents/{document}/sign-off', [App\Http\Controllers\Api\DocumentController::class, 'signOff']);
    Route::patch('/documents/{document}/assign', [App\Http\Controllers\Api\DocumentController::class, 'assignReviewer']);

    // Audit Tool Data (JSON form data)
    Route::post('/engagements/{engagement}/tools/{toolKey}', [App\Http\Controllers\Api\DocumentController::class, 'saveToolData']);
    Route::get('/engagements/{engagement}/tools/{toolKey}', [App\Http\Controllers\Api\DocumentController::class, 'getToolData']);
    Route::get('/engagements/{engagement}/tools/{toolKey}/versions', [App\Http\Controllers\Api\DocumentController::class, 'getToolVersions']);

    // Audit Trail
    Route::get('/engagements/{engagement}/activity-logs', [App\Http\Controllers\Api\EngagementController::class, 'activityLogs']);
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/engagements/{id}/tools', [ToolController::class, 'index']);
    Route::get('/engagements/{id}/tools/{type}', [ToolController::class, 'show']);
    Route::post('/engagements/{id}/tools', [ToolController::class, 'store']);
});