<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Pizarra;
use Illuminate\Support\Facades\DB;

class PizarraCreationRaceConditionTest extends TestCase
{
    use RefreshDatabase;

    public function test_pizarra_creation_race_condition()
    {
        // Crear usuarios
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        // Activar logging detallado
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time' => $query->time,
            ];
        });

        // Simular lo que podría estar pasando
        echo "\n=== Simulando creación de pizarra con race condition ===\n";

        // Actuar como usuario 3
        $this->actingAs($user3);

        // Crear una instancia de pizarra sin ID (como en el momento de creación)
        $pizarra = new Pizarra();
        $pizarra->name = 'Test Pizarra';
        $pizarra->user_id = $user3->id;
        $pizarra->isHome = true;
        $pizarra->screens = "[]";
        $pizarra->elements = "[]";

        echo "Pizarra antes de guardar - ID: " . ($pizarra->id ?? 'NULL') . "\n";

        // Intentar acceder a colaboradores ANTES de guardar
        try {
            echo "Intentando acceder a colaboradores antes de guardar...\n";
            $collaborators = $pizarra->collaborators();
            echo "Colaboradores query builder creado\n";
            
            // Esta es la línea que podría causar el problema
            $exists = $collaborators->where('user_id', $user3->id)->exists();
            echo "¿Existe colaborador? " . ($exists ? 'SÍ' : 'NO') . "\n";
            
        } catch (\Exception $e) {
            echo "Error al acceder a colaboradores: " . $e->getMessage() . "\n";
        }

        // Ahora guardar la pizarra
        $pizarra->save();
        echo "Pizarra después de guardar - ID: " . $pizarra->id . "\n";

        // Intentar acceder a colaboradores DESPUÉS de guardar
        try {
            echo "Intentando acceder a colaboradores después de guardar...\n";
            $exists = $pizarra->collaborators()->where('user_id', $user3->id)->exists();
            echo "¿Existe colaborador? " . ($exists ? 'SÍ' : 'NO') . "\n";
            
        } catch (\Exception $e) {
            echo "Error al acceder a colaboradores: " . $e->getMessage() . "\n";
        }

        // Mostrar todas las queries
        echo "\n=== Queries ejecutadas ===\n";
        foreach ($queries as $query) {
            echo "SQL: " . $query['sql'] . "\n";
            echo "Bindings: " . json_encode($query['bindings']) . "\n";
            echo "---\n";
        }

        // Verificar colaboradores con pizarra_id nulo
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "\nColaboradores con pizarra_id nulo: " . count($nullCollaborators) . "\n";
        
        foreach ($nullCollaborators as $collab) {
            echo "Colaborador nulo: ID=" . $collab->id . ", user_id=" . $collab->user_id . ", status=" . $collab->status . "\n";
        }

        $this->assertEmpty($nullCollaborators, 'No debe haber colaboradores con pizarra_id nulo');
    }

    public function test_pizarra_collaborator_access_timing()
    {
        echo "\n=== Test de timing de acceso a colaboradores ===\n";

        // Crear usuario
        $user = User::factory()->create();
        
        // Capturar queries
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
            ];
        });

        // Simular diferentes momentos del ciclo de vida
        echo "1. Creando nueva instancia de Pizarra...\n";
        $pizarra = new Pizarra();
        echo "ID después de new: " . ($pizarra->id ?? 'NULL') . "\n";

        echo "2. Estableciendo atributos...\n";
        $pizarra->name = 'Test';
        $pizarra->user_id = $user->id;
        $pizarra->isHome = true;
        $pizarra->screens = "[]";
        $pizarra->elements = "[]";
        echo "ID después de atributos: " . ($pizarra->id ?? 'NULL') . "\n";

        echo "3. Intentando hacer query de colaboradores antes de save...\n";
        try {
            $collaboratorQuery = $pizarra->collaborators();
            echo "Query builder creado\n";
            echo "Pizarra ID en query: " . ($pizarra->id ?? 'NULL') . "\n";
            
            // Esta línea podría generar el problema
            $result = $collaboratorQuery->where('user_id', $user->id)->exists();
            echo "Resultado: " . ($result ? 'true' : 'false') . "\n";
            
        } catch (\Exception $e) {
            echo "Excepción: " . $e->getMessage() . "\n";
        }

        echo "4. Guardando pizarra...\n";
        $pizarra->save();
        echo "ID después de save: " . $pizarra->id . "\n";

        echo "5. Intentando query de colaboradores después de save...\n";
        $result = $pizarra->collaborators()->where('user_id', $user->id)->exists();
        echo "Resultado: " . ($result ? 'true' : 'false') . "\n";

        // Mostrar queries problemáticas
        echo "\n=== Queries ejecutadas ===\n";
        foreach ($queries as $query) {
            if (strpos($query['sql'], 'pizarra_collaborators') !== false) {
                echo "SQL: " . $query['sql'] . "\n";
                echo "Bindings: " . json_encode($query['bindings']) . "\n";
                echo "---\n";
            }
        }

        // Verificar colaboradores con pizarra_id nulo
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "\nColaboradores con pizarra_id nulo: " . count($nullCollaborators) . "\n";

        $this->assertEmpty($nullCollaborators, 'No debe haber colaboradores con pizarra_id nulo');
    }
}
