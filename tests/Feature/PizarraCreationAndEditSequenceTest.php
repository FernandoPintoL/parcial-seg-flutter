<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Pizarra;
use Illuminate\Support\Facades\DB;

class PizarraCreationAndEditSequenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_pizarra_creation_and_immediate_edit_access()
    {
        // Crear usuario
        $user = User::factory()->create();
        
        // Activar logging detallado
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time' => $query->time,
            ];
        });

        // Actuar como el usuario
        $this->actingAs($user);

        echo "\n=== Simulando secuencia completa: Crear -> Editar inmediatamente ===\n";

        // 1. Crear pizarra (simular la petición POST)
        $response = $this->withoutMiddleware()
            ->postJson('/pizarra', [
                'name' => 'Test Pizarra Sequence',
                'isHome' => true,
            ]);

        echo "1. Creación - Status: " . $response->status() . "\n";
        $this->assertEquals(200, $response->status());

        $pizarraData = $response->json();
        $pizarraId = $pizarraData['id'];
        echo "   Pizarra ID: " . $pizarraId . "\n";

        // 2. Inmediatamente intentar acceder a la edición (simular window.location.href)
        echo "\n2. Acceso inmediato a edición...\n";
        $editResponse = $this->get("/pizarra/{$pizarraId}/edit");
        echo "   Edit - Status: " . $editResponse->status() . "\n";

        // 3. Mostrar queries ejecutadas
        echo "\n=== Queries ejecutadas en la secuencia ===\n";
        foreach ($queries as $index => $query) {
            if (strpos($query['sql'], 'pizarra_collaborators') !== false) {
                echo "Query #{$index}: " . $query['sql'] . "\n";
                echo "Bindings: " . json_encode($query['bindings']) . "\n";
                echo "---\n";
            }
        }

        // 4. Verificar colaboradores con pizarra_id nulo
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "\nColaboradores con pizarra_id nulo: " . count($nullCollaborators) . "\n";
        
        foreach ($nullCollaborators as $collab) {
            echo "Colaborador nulo: ID=" . $collab->id . ", user_id=" . $collab->user_id . ", status=" . $collab->status . "\n";
        }

        // 5. Verificar que la pizarra existe correctamente
        $pizarra = Pizarra::find($pizarraId);
        echo "\nPizarra final:\n";
        echo "  ID: " . $pizarra->id . "\n";
        echo "  user_id: " . $pizarra->user_id . "\n";
        echo "  name: " . $pizarra->name . "\n";

        $this->assertEmpty($nullCollaborators, 'No debe haber colaboradores con pizarra_id nulo');
    }

    public function test_potential_race_condition_with_delayed_access()
    {
        // Crear usuario
        $user = User::factory()->create();
        
        // Activar logging detallado
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
            ];
        });

        // Actuar como el usuario
        $this->actingAs($user);

        echo "\n=== Simulando posible race condition ===\n";

        // 1. Crear pizarra
        $response = $this->withoutMiddleware()
            ->postJson('/pizarra', [
                'name' => 'Test Race Condition',
                'isHome' => true,
            ]);

        $pizarraId = $response->json()['id'];
        echo "Pizarra creada con ID: " . $pizarraId . "\n";

        // 2. Hacer múltiples accesos simultáneos (simular condición de carrera)
        echo "\nHaciendo múltiples accesos...\n";
        
        for ($i = 0; $i < 3; $i++) {
            $queries = []; // Reset queries for each iteration
            
            try {
                $editResponse = $this->get("/pizarra/{$pizarraId}/edit");
                echo "Acceso #{$i}: Status " . $editResponse->status() . "\n";
                
                // Mostrar queries de colaboradores
                foreach ($queries as $query) {
                    if (strpos($query['sql'], 'pizarra_collaborators') !== false) {
                        echo "  Query: " . $query['sql'] . "\n";
                        echo "  Bindings: " . json_encode($query['bindings']) . "\n";
                    }
                }
                
            } catch (\Exception $e) {
                echo "Acceso #{$i}: Error " . $e->getMessage() . "\n";
            }
        }

        // 3. Verificar colaboradores con pizarra_id nulo
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "\nColaboradores con pizarra_id nulo: " . count($nullCollaborators) . "\n";

        $this->assertEmpty($nullCollaborators, 'No debe haber colaboradores con pizarra_id nulo');
    }
}
