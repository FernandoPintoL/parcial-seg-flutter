<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Pizarra;
use App\Models\PizarraCollaborator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class PizarraCollaboratorBugTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test para detectar el problema específico del colaborador con pizarra_id nulo.
     */
    public function test_no_automatic_collaborator_creation_on_pizarra_store()
    {
        // Crear un usuario
        $user = User::factory()->create();
        
        // Actuar como el usuario
        $this->actingAs($user);
        
        // Activar el listener para queries de base de datos
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time' => $query->time,
            ];
        });
        
        // Datos de la pizarra
        $pizarraData = [
            'name' => 'Test Pizarra para Debug',
            'isHome' => true,
        ];
        
        // Hacer la petición POST
        $response = $this->withoutMiddleware()->postJson('/pizarra', $pizarraData);
        
        // Verificar que la respuesta es exitosa
        $response->assertStatus(200);
        
        // Obtener el ID de la pizarra creada
        $responseData = $response->json();
        $pizarraId = $responseData['id'];
        
        // Verificar que no se ejecutó ninguna query de inserción en pizarra_collaborators
        $collaboratorInsertQueries = collect($queries)->filter(function ($query) {
            return strpos($query['sql'], 'pizarra_collaborators') !== false && 
                   strpos($query['sql'], 'insert') !== false;
        });
        
        $this->assertCount(0, $collaboratorInsertQueries, 
            'No debe haber queries de inserción en pizarra_collaborators durante la creación de pizarra. Queries encontradas: ' . 
            json_encode($collaboratorInsertQueries->toArray()));
        
        // Verificar que no hay colaboradores para esta pizarra
        $this->assertDatabaseMissing('pizarra_collaborators', [
            'pizarra_id' => $pizarraId,
        ]);
        
        // Imprimir todas las queries ejecutadas para debugging
        echo "\n=== Queries ejecutadas durante la creación de pizarra ===\n";
        foreach ($queries as $query) {
            echo "SQL: " . $query['sql'] . "\n";
            echo "Bindings: " . json_encode($query['bindings']) . "\n";
            echo "Time: " . $query['time'] . "ms\n";
            echo "---\n";
        }
        echo "=== Fin de queries ===\n";
    }
    
    /**
     * Test para simular exactamente el flujo completo del frontend.
     */
    public function test_complete_frontend_flow()
    {
        // Crear un usuario
        $user = User::factory()->create();
        
        // Actuar como el usuario
        $this->actingAs($user);
        
        // Activar el listener para queries de base de datos
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time' => $query->time,
            ];
        });
        
        // 1. Crear la pizarra (como lo hace el frontend)
        $pizarraData = [
            'name' => 'Test Pizarra Frontend Flow',
            'isHome' => true,
        ];
        
        $response = $this->withoutMiddleware()->postJson('/pizarra', $pizarraData);
        $response->assertStatus(200);
        
        $responseData = $response->json();
        $pizarraId = $responseData['id'];
        
        // 2. Acceder a la página de edición (como lo hace el frontend después de crear)
        $editResponse = $this->withoutMiddleware()->get("/pizarra/{$pizarraId}/edit");
        
        // Verificar que no hay errores
        $editResponse->assertStatus(200);
        
        // 3. Verificar que no se crearon colaboradores automáticamente
        $this->assertDatabaseMissing('pizarra_collaborators', [
            'pizarra_id' => $pizarraId,
        ]);
        
        // Buscar queries problemáticas
        $collaboratorQueries = collect($queries)->filter(function ($query) {
            return strpos($query['sql'], 'pizarra_collaborators') !== false;
        });
        
        if ($collaboratorQueries->count() > 0) {
            echo "\n=== Queries de pizarra_collaborators encontradas ===\n";
            foreach ($collaboratorQueries as $query) {
                echo "SQL: " . $query['sql'] . "\n";
                echo "Bindings: " . json_encode($query['bindings']) . "\n";
                echo "---\n";
            }
            echo "=== Fin de queries de colaboradores ===\n";
        }
        
        $this->assertCount(0, $collaboratorQueries, 
            'No debe haber queries de pizarra_collaborators durante el flujo normal');
    }
}
