<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Pizarra;
use Illuminate\Support\Facades\DB;

class PizarraModelBindingDeepTest extends TestCase
{
    use RefreshDatabase;

    public function test_model_binding_investigation()
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

        echo "\n=== Investigación profunda del model binding ===\n";

        // 1. Crear pizarra
        $response = $this->withoutMiddleware()
            ->postJson('/pizarra', [
                'name' => 'Test Model Binding',
                'isHome' => true,
            ]);

        echo "1. Creación - Status: " . $response->status() . "\n";
        $pizarraData = $response->json();
        $pizarraId = $pizarraData['id'];
        echo "   Pizarra ID: " . $pizarraId . "\n";

        // 2. Verificar que la pizarra existe en la DB
        $pizarraFromDB = Pizarra::find($pizarraId);
        echo "\n2. Pizarra desde DB:\n";
        echo "   Existe: " . ($pizarraFromDB ? 'SÍ' : 'NO') . "\n";
        if ($pizarraFromDB) {
            echo "   ID: " . $pizarraFromDB->id . "\n";
            echo "   Name: " . $pizarraFromDB->name . "\n";
            echo "   User ID: " . $pizarraFromDB->user_id . "\n";
        }

        // 3. Probar el route con parámetros específicos
        echo "\n3. Probando rutas específicas:\n";
        
        // Ruta con GET directo
        $directResponse = $this->withoutMiddleware()
            ->get("/pizarra/{$pizarraId}/edit");
        echo "   GET directo - Status: " . $directResponse->status() . "\n";

        // 4. Verificar queries ejecutadas
        echo "\n4. Queries ejecutadas:\n";
        foreach ($queries as $index => $query) {
            echo "Query #{$index}: " . $query['sql'] . "\n";
            echo "Bindings: " . json_encode($query['bindings']) . "\n";
            echo "---\n";
        }

        // 5. Verificar si hay pizarra_id nulo en queries
        $nullPizarraQueries = [];
        foreach ($queries as $query) {
            if (strpos($query['sql'], 'pizarra_collaborators') !== false && 
                strpos($query['sql'], 'pizarra_id" is null') !== false) {
                $nullPizarraQueries[] = $query;
            }
        }

        echo "\n5. Queries con pizarra_id nulo: " . count($nullPizarraQueries) . "\n";
        
        // 6. Verificar colaboradores con pizarra_id nulo
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "\n6. Colaboradores con pizarra_id nulo: " . count($nullCollaborators) . "\n";

        // Assertions principales
        $this->assertNotNull($pizarraFromDB, 'La pizarra debe existir en la DB');
        $this->assertEmpty($nullPizarraQueries, 'No debe haber queries con pizarra_id nulo');
        $this->assertEmpty($nullCollaborators, 'No debe haber colaboradores con pizarra_id nulo');

        echo "\n✅ Test de investigación completado\n";
    }
}
