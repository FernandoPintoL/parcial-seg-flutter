<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Pizarra;
use Illuminate\Support\Facades\DB;

class PizarraModelBindingTest extends TestCase
{
    use RefreshDatabase;

    public function test_model_binding_issue()
    {
        // Crear usuarios
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        // Crear una pizarra con el usuario 1
        $pizarra = Pizarra::factory()->create([
            'user_id' => $user1->id,
            'name' => 'Test Pizarra'
        ]);

        echo "\n=== Información de la pizarra creada ===\n";
        echo "Pizarra ID: {$pizarra->id}\n";
        echo "Pizarra user_id: {$pizarra->user_id}\n";
        echo "Pizarra name: {$pizarra->name}\n";

        // Capturar todas las queries
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time' => $query->time,
            ];
        });

        // Intentar acceder como usuario 3
        $this->actingAs($user3);

        echo "\n=== Intentando acceder a edición de pizarra con ID {$pizarra->id} ===\n";

        // 1. Probar el route model binding directamente
        $response = $this->get("/pizarra/{$pizarra->id}/edit");
        
        echo "Status de respuesta: {$response->status()}\n";
        
        // 2. Mostrar queries ejecutadas
        echo "\n=== Queries ejecutadas durante model binding ===\n";
        foreach ($queries as $query) {
            echo "SQL: " . $query['sql'] . "\n";
            echo "Bindings: " . json_encode($query['bindings']) . "\n";
            echo "---\n";
        }

        // 3. Verificar que no hay colaboradores con pizarra_id nulo
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "\nColaboradores con pizarra_id nulo: " . count($nullCollaborators) . "\n";
        
        // 4. Verificar estado de la pizarra después del intento de acceso
        $pizarraAfter = Pizarra::find($pizarra->id);
        echo "Pizarra después del acceso - ID: {$pizarraAfter->id}, user_id: {$pizarraAfter->user_id}\n";

        // 5. Intentar recrear la query problemática manualmente
        echo "\n=== Recreando query problemática ===\n";
        $problemQuery = DB::select('
            SELECT EXISTS(
                SELECT * FROM "users" 
                INNER JOIN "pizarra_collaborators" ON "users"."id" = "pizarra_collaborators"."user_id" 
                WHERE "pizarra_collaborators"."pizarra_id" IS NULL 
                AND "user_id" = ?
            ) as "exists"
        ', [$user3->id]);
        
        echo "Resultado de query problemática: " . json_encode($problemQuery) . "\n";

        // 6. Verificar si existe algún collaborator con pizarra_id nulo
        $this->assertEmpty($nullCollaborators, 'No debe haber colaboradores con pizarra_id nulo');
    }

    public function test_direct_collaborator_query()
    {
        // Crear usuarios
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Crear una pizarra
        $pizarra = Pizarra::factory()->create([
            'user_id' => $user1->id,
            'name' => 'Test Pizarra'
        ]);

        echo "\n=== Test directo de query de colaboradores ===\n";

        // Probar la query directamente
        $collaboratorExists = $pizarra->collaborators()
            ->where('user_id', $user2->id)
            ->exists();

        echo "¿Existe colaborador? " . ($collaboratorExists ? 'SÍ' : 'NO') . "\n";

        // Verificar que la pizarra tiene ID válido
        echo "Pizarra ID: {$pizarra->id}\n";
        echo "Pizarra user_id: {$pizarra->user_id}\n";

        // Verificar que no hay colaboradores con pizarra_id nulo
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "Colaboradores con pizarra_id nulo: " . count($nullCollaborators) . "\n";

        $this->assertEmpty($nullCollaborators, 'No debe haber colaboradores con pizarra_id nulo');
    }
}
