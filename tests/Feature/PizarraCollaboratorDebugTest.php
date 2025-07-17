<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Pizarra;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PizarraCollaboratorDebugTest extends TestCase
{
    use RefreshDatabase;

    public function test_debug_collaborator_creation_issue()
    {
        // Crear usuarios
        $user1 = User::factory()->create(); // ID 1
        $user2 = User::factory()->create(); // ID 2  
        $user3 = User::factory()->create(); // ID 3

        // Activar logging detallado
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time' => $query->time,
            ];
        });

        // Actuar como el usuario 3 (que reporta el error)
        $this->actingAs($user3);

        // Simular exactamente lo que hace el frontend
        echo "\n=== Simulando creación de pizarra por usuario 3 ===\n";

        // 1. Crear pizarra
        $response = $this->withoutMiddleware()->postJson('/pizarra', [
            'name' => 'Test Pizarra Debug',
            'isHome' => true,
        ]);

        echo "Respuesta de creación: " . $response->status() . "\n";
        
        if ($response->status() !== 200) {
            echo "Error en creación: " . $response->content() . "\n";
            return;
        }

        $pizarraData = $response->json();
        $pizarraId = $pizarraData['id'];
        
        echo "Pizarra creada con ID: " . $pizarraId . "\n";

        // 2. Revisar si se crearon colaboradores automáticamente
        $collaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id = ?', [$pizarraId]);
        echo "Colaboradores creados automáticamente: " . count($collaborators) . "\n";

        // 3. Mostrar todas las queries ejecutadas
        echo "\n=== Queries ejecutadas ===\n";
        foreach ($queries as $query) {
            echo "SQL: " . $query['sql'] . "\n";
            echo "Bindings: " . json_encode($query['bindings']) . "\n";
            echo "---\n";
        }

        // 4. Intentar acceder a la página de edición
        echo "\n=== Intentando acceder a edición ===\n";
        $queries = []; // Reset queries
        
        try {
            $editResponse = $this->withoutMiddleware()->get("/pizarra/{$pizarraId}/edit");
            echo "Respuesta de edición: " . $editResponse->status() . "\n";
        } catch (\Exception $e) {
            echo "Error en edición: " . $e->getMessage() . "\n";
        }

        // 5. Mostrar queries de la edición
        if (!empty($queries)) {
            echo "\n=== Queries de edición ===\n";
            foreach ($queries as $query) {
                echo "SQL: " . $query['sql'] . "\n";
                echo "Bindings: " . json_encode($query['bindings']) . "\n";
                echo "---\n";
            }
        }

        // 6. Verificar estado final
        $finalCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id = ?', [$pizarraId]);
        echo "\nColaboradores finales: " . count($finalCollaborators) . "\n";

        // 7. Buscar colaboradores con pizarra_id nulo
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "Colaboradores con pizarra_id nulo: " . count($nullCollaborators) . "\n";
        
        foreach ($nullCollaborators as $collab) {
            echo "Colaborador nulo: ID=" . $collab->id . ", user_id=" . $collab->user_id . ", status=" . $collab->status . "\n";
        }

        // No debe haber colaboradores con pizarra_id nulo
        $this->assertEmpty($nullCollaborators, 'No debe haber colaboradores con pizarra_id nulo');
    }
}
