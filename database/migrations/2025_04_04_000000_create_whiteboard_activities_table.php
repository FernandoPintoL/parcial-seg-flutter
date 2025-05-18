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
        Schema::create('whiteboard_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained('form_builders')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('action_type'); // 'add', 'remove', 'update', 'join', etc.
            $table->json('action_data')->nullable(); // Details of the action
            $table->text('description')->nullable(); // Human-readable description of the action
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whiteboard_activities');
    }
};
