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
            // Verificar si las columnas no existen antes de crearlas
            if (!Schema::hasColumn('pizarras', 'type')) {
                $table->enum('type', ['flutter', 'angular', 'unified'])->default('flutter')->after('name');
            }
            if (!Schema::hasColumn('pizarras', 'framework')) {
                $table->enum('framework', ['flutter', 'angular'])->default('flutter')->after('type');
            }
            if (!Schema::hasColumn('pizarras', 'description')) {
                $table->text('description')->nullable()->after('framework');
            }
            if (!Schema::hasColumn('pizarras', 'elements')) {
                $table->json('elements')->nullable()->after('screens');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pizarras', function (Blueprint $table) {
            // Verificar si las columnas existen antes de eliminarlas
            if (Schema::hasColumn('pizarras', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('pizarras', 'framework')) {
                $table->dropColumn('framework');
            }
            if (Schema::hasColumn('pizarras', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('pizarras', 'elements')) {
                $table->dropColumn('elements');
            }
        });
    }
};
