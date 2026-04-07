<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/login', [AuthController::class , 'login']);
Route::post('/register', [AuthController::class , 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/pending', [App\Http\Controllers\Api\UserController::class, 'pending']);
    Route::get('/users/auditors', [App\Http\Controllers\Api\UserController::class, 'auditors']);
    Route::patch('/users/{id}/approve', [App\Http\Controllers\Api\UserController::class, 'approve']);

    Route::get('/user', [AuthController::class , 'user']);
    Route::get('/auditees', function () {
            return response()->json(\App\Models\User::where('role', 'auditee')->get());
        }
        );
        Route::post('/logout', [AuthController::class , 'logout']);

        // Engagements
        Route::apiResource('engagements', App\Http\Controllers\Api\EngagementController::class);

        // MOVs
        Route::post('/engagements/{engagement}/movs', [App\Http\Controllers\Api\MovController::class , 'store']);
        Route::patch('/movs/{mov}/status', [App\Http\Controllers\Api\MovController::class , 'updateStatus']);

        // Documents
        Route::get('/engagements/{engagement}/documents', [App\Http\Controllers\Api\DocumentController::class , 'index']);
        Route::get('/documents/{document}/download', [App\Http\Controllers\Api\DocumentController::class , 'download']);
        Route::post('/documents/upload', [App\Http\Controllers\Api\DocumentController::class , 'upload']);
        Route::post('/documents/{document}/sign', [App\Http\Controllers\Api\DocumentController::class , 'sign']);
        Route::patch('/documents/{document}/assign', [App\Http\Controllers\Api\DocumentController::class , 'assignReviewer']);

        // Audit Tool Data (JSON form data)
        Route::post('/engagements/{engagement}/tools/{toolKey}', [App\Http\Controllers\Api\DocumentController::class , 'saveToolData']);
        Route::get('/engagements/{engagement}/tools/{toolKey}', [App\Http\Controllers\Api\DocumentController::class , 'getToolData']);
        
        // Audit Trail
        Route::get('/engagements/{engagement}/activity-logs', [App\Http\Controllers\Api\EngagementController::class , 'activityLogs']);
    });

