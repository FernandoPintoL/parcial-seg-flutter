<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Pizarra;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PizarraCreationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test que la creación de una pizarra funciona correctamente.
     */
    public function test_pizarra_creation_works_correctly()
    {
        // Crear un usuario
        $user = User::factory()->create();
        
        // Actuar como el usuario
        $this->actingAs($user);
        
        // Datos de la pizarra
        $pizarraData = [
            'name' => 'Test Pizarra',
            'isHome' => true,
        ];
        
        // Hacer la petición POST usando withoutMiddleware
        $response = $this->withoutMiddleware()->postJson('/pizarra', $pizarraData);
        
        // Verificar que la respuesta es exitosa
        $response->assertStatus(200);
        
        // Verificar que la pizarra fue creada
        $this->assertDatabaseHas('pizarras', [
            'name' => 'Test Pizarra',
            'user_id' => $user->id,
            'isHome' => true,
        ]);
        
        // Verificar que el ID está en la respuesta
        $responseData = $response->json();
        $this->assertArrayHasKey('id', $responseData);
        $this->assertIsInt($responseData['id']);
        
        // Verificar que no se creó ningún colaborador automáticamente
        $this->assertDatabaseMissing('pizarra_collaborators', [
            'pizarra_id' => $responseData['id'],
            'user_id' => $user->id,
        ]);
    }
    
    /**
     * Test que la creación de una pizarra hija funciona correctamente.
     */
    public function test_child_pizarra_creation_works_correctly()
    {
        // Crear un usuario
        $user = User::factory()->create();
        
        // Actuar como el usuario
        $this->actingAs($user);
        
        // Crear una pizarra padre
        $parentPizarra = Pizarra::factory()->create([
            'user_id' => $user->id,
            'isHome' => true,
        ]);
        
        // Datos de la pizarra hija
        $pizarraData = [
            'name' => 'Test Child Pizarra',
            'isHome' => false,
            'pizarra_id' => $parentPizarra->id,
        ];
        
        // Hacer la petición POST usando withoutMiddleware
        $response = $this->withoutMiddleware()->postJson('/pizarra', $pizarraData);
        
        // Verificar que la respuesta es exitosa
        $response->assertStatus(200);
        
        // Verificar que la pizarra fue creada
        $this->assertDatabaseHas('pizarras', [
            'name' => 'Test Child Pizarra',
            'user_id' => $user->id,
            'isHome' => false,
            'pizarra_id' => $parentPizarra->id,
        ]);
        
        // Verificar que el ID está en la respuesta
        $responseData = $response->json();
        $this->assertArrayHasKey('id', $responseData);
        $this->assertIsInt($responseData['id']);
    }
}
