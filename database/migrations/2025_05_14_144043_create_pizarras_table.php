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
            $table->string('name');
            $table->json('users')->nullable();
            $table->boolean('isHome')->default(false);
            $table->json('elements')->nullable();
            $table->json('screens')->nullable()->after('elements');
            $table->enum('type', ['flutter', 'angular', 'unified'])->default('flutter')->after('name');
            $table->enum('framework', ['flutter', 'angular'])->default('flutter')->after('type');
            $table->text('description')->nullable()->after('framework');
            $table->timestamps();
            $table->foreignId('pizarra_id')->nullable()->constrained('pizarras')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->cascadeOnUpdate();
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
