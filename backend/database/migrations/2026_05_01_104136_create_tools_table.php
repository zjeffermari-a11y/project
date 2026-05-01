<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tools', function (Blueprint $table) {
            $table->id();
            $table->foreignId('engagement_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('tool_type'); // awp, movs, survey, flowchart, planning
            $table->timestamps();

            $table->unique(['engagement_id', 'tool_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tools');
    }
};