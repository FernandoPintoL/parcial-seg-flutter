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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('room_id')->unique();
            $table->json('users')->default('[]');
            $table->timestamp('last_activity')->nullable();
            $table->timestamps();
        });

        Schema::create('form_data', function (Blueprint $table) {
            $table->id();
            $table->string('room_id')->unique();
            $table->jsonb('elements')->default('[]');
            $table->string('name')->default('');
            $table->timestamp('last_updated')->nullable();
            $table->string('last_updated_by')->default('system');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_data');
        Schema::dropIfExists('rooms');
    }
}; 