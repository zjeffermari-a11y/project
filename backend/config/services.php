<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | SSO Providers — Google Workspace for Government + Microsoft 365
    |--------------------------------------------------------------------------
    */

    // Google Workspace for Government
    // Set GOOGLE_REDIRECT_URI to: https://<your-backend>/api/auth/google/callback
    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT_URI', env('APP_URL', 'http://localhost:8000') . '/api/auth/google/callback'),
    ],

    // Microsoft 365 / Outlook (via SocialiteProviders/MicrosoftAzure)
    // Set AZURE_TENANT_ID to your agency's Microsoft tenant ID (or 'organizations' for multi-tenant)
    'azure' => [
        'client_id'     => env('AZURE_CLIENT_ID'),
        'client_secret' => env('AZURE_CLIENT_SECRET'),
        'redirect'      => env('AZURE_REDIRECT_URI', env('APP_URL', 'http://localhost:8000') . '/api/auth/azure/callback'),
        'tenant'        => env('AZURE_TENANT_ID', 'organizations'),
    ],

];
