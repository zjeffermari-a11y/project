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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('engagement_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('entity_type')->nullable(); // For polymorphic relations
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('action_type'); // created, updated, status_change, deleted
            $table->text('description'); // e.g. "User X uploaded [Tool/MOV Name]"
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
