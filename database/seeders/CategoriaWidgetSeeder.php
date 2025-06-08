<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategoriaWidgetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categorias = [
            ['category' => 'widgets', 'label' => 'Widgets Basicos'],
            ['category' => 'layout', 'label' => 'Layouts y Organización'],
            ['category' => 'input', 'label' => 'Entrada de Datos (Formularios)'],
            ['category' => 'plataforma', 'label' => 'Especificos de Plataforma'],
            ['category' => 'containers', 'label' => 'Contenedores y Decoración'],
            ['category' => 'navegation', 'label' => 'Navegación y Rutas'],
            ['category' => 'material-cupertino', 'label' => 'Material Design y Cupertino (iOS)'],
        ];
        foreach ($categorias as $categoria) {
            \App\Models\CategoriaWidget::create(
                [
                    'category' => $categoria['category'],
                    'label' => $categoria['label']
                ]
            );
        }
    }
}
