<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a JSON column to engagements to track which audit phases have been
     * explicitly marked as complete by a Team Leader.
     *
     * Example value: {"planning": "2026-05-09T12:00:00Z", "execution": null, ...}
     */
    public function up(): void
    {
        Schema::table('engagements', function (Blueprint $table) {
            $table->json('phase_completions')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('engagements', function (Blueprint $table) {
            $table->dropColumn('phase_completions');
        });
    }
};
