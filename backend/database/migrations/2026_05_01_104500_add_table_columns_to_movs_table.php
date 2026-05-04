<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('movs', function (Blueprint $table) {
            $table->string('drive_link')->nullable()->after('requirement_name');
            $table->string('auditee_response_1')->nullable()->after('status');
            $table->string('auditee_response_2')->nullable()->after('auditee_response_1');
            $table->string('auditee_response_3')->nullable()->after('auditee_response_2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movs', function (Blueprint $table) {
            $table->dropColumn(['drive_link', 'auditee_response_1', 'auditee_response_2', 'auditee_response_3']);
        });
    }
};
