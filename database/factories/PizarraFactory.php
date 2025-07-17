<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pizarra>
 */
class PizarraFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'user_id' => \App\Models\User::factory(),
            'isHome' => true,
            'screens' => json_encode([]),
            'elements' => json_encode([]),
            'room_id' => null,
            'pizarra_id' => null,
            'type' => 'flutter',
            'framework' => 'flutter',
            'description' => $this->faker->text(100),
        ];
    }
}
