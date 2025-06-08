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
        Schema::create('widgets_propiedades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('widget_id')
                ->constrained('widgets')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->foreignId('propiedad_id')
                ->constrained('propiedades')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();
            $table->string('value')->nullable();
            $table->string('defaultValue')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('widgets_propiedades');
    }
};
