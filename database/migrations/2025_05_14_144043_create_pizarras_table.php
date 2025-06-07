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
        Schema::create('pizarras', function (Blueprint $table) {
            $table->id();
            $table->string('room_id')->nullable()->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('name');
            $table->json('elements')->nullable();
            $table->json('users')->nullable();
            $table->json('screens')->nullable()->after('elements');
            $table->foreignId('pizarra_id')->nullable()->constrained('pizarras')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pizarras');
    }
};
