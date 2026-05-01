<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add sign-off workflow columns to document_histories.
     * stage: 'prepared_by' | 'reviewed_by' | 'approved_by'
     * designation: the role label recorded at sign-off time
     */
    public function up(): void
    {
        Schema::table('document_histories', function (Blueprint $table) {
            $table->string('stage')->nullable()->after('action'); // prepared_by | reviewed_by | approved_by
            $table->string('designation')->nullable()->after('stage'); // role label at time of sign-off
            $table->string('signer_name')->nullable()->after('designation'); // name at time of sign-off
        });
    }

    public function down(): void
    {
        Schema::table('document_histories', function (Blueprint $table) {
            $table->dropColumn(['stage', 'designation', 'signer_name']);
        });
    }
};
