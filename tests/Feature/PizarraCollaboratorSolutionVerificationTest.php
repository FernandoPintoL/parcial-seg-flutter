<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Pizarra;
use Illuminate\Support\Facades\DB;

class PizarraCollaboratorSolutionVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_solution_verification_no_null_pizarra_id_queries()
    {
        // Crear usuario
        $user = User::factory()->create();
        
        // Capturar queries con pizarra_id nulo
        $nullPizarraQueries = [];
        DB::listen(function ($query) use (&$nullPizarraQueries) {
            if (strpos($query->sql, 'pizarra_collaborators') !== false && 
                strpos($query->sql, 'pizarra_id" is null') !== false) {
                $nullPizarraQueries[] = $query;
            }
        });

        // Actuar como el usuario
        $this->actingAs($user);

        echo "\n=== Verificación de la solución implementada ===\n";

        // 1. Crear pizarra
        $pizarra = Pizarra::create([
            'name' => 'Test Solution Verification',
            'user_id' => $user->id,
            'isHome' => true,
            'screens' => json_encode([]),
            'elements' => json_encode([]),
        ]);

        // Asegurar que tiene room_id
        $pizarra->update(['room_id' => 'room_'.$pizarra->id]);

        echo "1. Pizarra creada con ID: " . $pizarra->id . "\n";

        // 2. Probar el método isCollaboratingOrPropietario DESPUÉS de guardar
        $isCollaborating = $pizarra->isCollaboratingOrPropietario($user->id);
        echo "2. ¿Es colaborador o propietario? " . ($isCollaborating ? 'SÍ' : 'NO') . "\n";

        // 3. Probar consulta de colaboradores directa
        $collaboratorExists = $pizarra->collaborators()->where('user_id', $user->id)->exists();
        echo "3. ¿Existe como colaborador? " . ($collaboratorExists ? 'SÍ' : 'NO') . "\n";

        // 4. Probar con pizarra sin ID (caso problemático)
        $pizarraSinId = new Pizarra();
        $pizarraSinId->name = 'Test Sin ID';
        $pizarraSinId->user_id = $user->id;
        // NO guardamos, para que no tenga ID

        echo "4. Pizarra sin ID - ID: " . ($pizarraSinId->id ?? 'NULL') . "\n";
        $isCollaboratingSinId = $pizarraSinId->isCollaboratingOrPropietario($user->id);
        echo "5. ¿Es colaborador (sin ID)? " . ($isCollaboratingSinId ? 'SÍ' : 'NO') . "\n";

        // 5. Verificar que NO hay queries problemáticas
        echo "\n=== Resultado de la verificación ===\n";
        echo "Queries con pizarra_id nulo: " . count($nullPizarraQueries) . "\n";
        
        foreach ($nullPizarraQueries as $query) {
            echo "Query problemática: " . $query->sql . "\n";
            echo "Bindings: " . json_encode($query->bindings) . "\n";
        }

        // 6. Verificar colaboradores en DB
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "Colaboradores con pizarra_id nulo en DB: " . count($nullCollaborators) . "\n";

        // Assertions principales
        $this->assertTrue($isCollaborating, 'El usuario debe ser propietario de su pizarra');
        $this->assertFalse($isCollaboratingSinId, 'La pizarra sin ID debe retornar false');
        $this->assertEmpty($nullPizarraQueries, 'NO debe haber queries con pizarra_id nulo');
        $this->assertEmpty($nullCollaborators, 'NO debe haber colaboradores con pizarra_id nulo');

        echo "\n✅ SOLUCIÓN VERIFICADA EXITOSAMENTE\n";
        echo "   - No hay queries con pizarra_id nulo\n";
        echo "   - No hay colaboradores con pizarra_id nulo\n";
        echo "   - La protección contra pizarra sin ID funciona\n";
    }

    public function test_previous_problem_reproduction()
    {
        // Crear usuario
        $user = User::factory()->create();
        
        // Capturar queries problemáticas
        $nullPizarraQueries = [];
        DB::listen(function ($query) use (&$nullPizarraQueries) {
            if (strpos($query->sql, 'pizarra_collaborators') !== false && 
                strpos($query->sql, 'pizarra_id" is null') !== false) {
                $nullPizarraQueries[] = $query;
            }
        });

        echo "\n=== Reproducción del problema anterior (ya resuelto) ===\n";

        // Simular el problema original: pizarra sin ID
        $pizarra = new Pizarra();
        $pizarra->name = 'Test Problema Original';
        $pizarra->user_id = $user->id;
        $pizarra->isHome = true;
        $pizarra->screens = "[]";
        $pizarra->elements = "[]";
        // NO guardamos para que no tenga ID

        echo "Pizarra sin ID - ID: " . ($pizarra->id ?? 'NULL') . "\n";

        // Antes de la solución, esto generaba una query con pizarra_id IS NULL
        // Ahora debe retornar false sin generar la query problemática
        $result = $pizarra->isCollaboratingOrPropietario($user->id);
        echo "¿Es colaborador o propietario? " . ($result ? 'SÍ' : 'NO') . "\n";

        // Verificar que NO se generó la query problemática
        echo "Queries con pizarra_id nulo: " . count($nullPizarraQueries) . "\n";

        // Verificar que no hay colaboradores problemáticos
        $nullCollaborators = DB::select('SELECT * FROM pizarra_collaborators WHERE pizarra_id IS NULL');
        echo "Colaboradores con pizarra_id nulo: " . count($nullCollaborators) . "\n";

        // Assertions
        $this->assertFalse($result, 'Debe retornar false para pizarra sin ID');
        $this->assertEmpty($nullPizarraQueries, 'NO debe generar queries con pizarra_id nulo');
        $this->assertEmpty($nullCollaborators, 'NO debe crear colaboradores con pizarra_id nulo');

        echo "\n✅ PROBLEMA ORIGINAL RESUELTO\n";
        echo "   - Antes: Se generaba query con pizarra_id IS NULL\n";
        echo "   - Ahora: Se retorna false sin generar query problemática\n";
    }
}
