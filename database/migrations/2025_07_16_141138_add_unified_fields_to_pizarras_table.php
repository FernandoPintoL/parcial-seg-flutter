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
        Schema::table('pizarras', function (Blueprint $table) {
            $table->enum('type', ['flutter', 'angular', 'unified'])->default('flutter')->after('name');
            $table->enum('framework', ['flutter', 'angular'])->default('flutter')->after('type');
            $table->text('description')->nullable()->after('framework');
            $table->json('screens')->nullable()->after('description');
            $table->json('elements')->nullable()->after('screens');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pizarras', function (Blueprint $table) {
            $table->dropColumn(['type', 'framework', 'description', 'screens', 'elements']);
        });
    }
};
