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
        Schema::create('widgets', function (Blueprint $table) {
            $table->id();
            $table->string('type')->unique();
            $table->string('label')->nullable();
            $table->string('icon')->nullable();
            $table->boolean('hasChildren')->default(false);
            $table->timestamps();
            $table->foreignId('categoria_widget_id')->constrained('categoria_widgets')->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('widgets');
    }
};
