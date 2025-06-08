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
        Schema::create('pizarra_widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widget_id')
                ->constrained('widgets')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('pizarra_id')
                ->constrained('pizarras')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pizarra_widgets');
    }
};
