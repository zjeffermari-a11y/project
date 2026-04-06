<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Stores the full JSON form data for interactive audit tools
            $table->json('form_data')->nullable()->after('phase');
            // Tracks the tool key (e.g. 'aap', 'oac', 'wt') for quick lookup
            $table->string('tool_key')->nullable()->after('form_data');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['form_data', 'tool_key']);
        });
    }
};
