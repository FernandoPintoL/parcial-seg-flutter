<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PropiedadesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // properties for widgets de flutter
        $propiedades = [
            ['name' => 'key', 'type' => 'String', 'defaultValue' => 'Clave única para el widget'],
            ['name' => 'child', 'type' => 'Widget', 'defaultValue' => 'El widget hijo que se muestra dentro del widget padre'],
            ['name' => 'children', 'type' => 'List<Widget>', 'defaultValue' => 'Lista de widgets hijos para widgets que aceptan múltiples hijos'],
            ['name' => 'color', 'type' => 'Color', 'defaultValue' => 'Color del widget'],
            ['name' => 'width', 'type' => 'double', 'defaultValue' => 'Ancho del widget'],
            ['name' => 'height', 'type' => 'double', 'defaultValue' => 'Altura del widget'],
            ['name' => 'padding', 'type' => 'EdgeInsets', 'defaultValue' => 'Espaciado interno del widget'],
            ['name' => 'margin', 'type' => 'EdgeInsets', 'defaultValue' => 'Margen externo del widget'],
            ['name' => 'alignment', 'type' => 'Alignment', 'defaultValue' => 'Alineación del contenido dentro del widget'],
            ['name' => 'decoration', 'type' => 'BoxDecoration', 'defaultValue' => 'Decoración visual del widget, como bordes y sombras'],
            ['name' => 'onPressed', 'type' => '(BuildContext context) -> void', 'defaultValue' => 'Función que se ejecuta cuando se presiona el widget, común en botones'],
                // defaultValue is a function, so we leave it empty
                // defaultValue is not applicable for this type
                // but we can provide a description
        ];
        foreach ($propiedades as $propiedad) {
            \App\Models\Propiedades::create(
                [
                    'name' => $propiedad['name'],
                    'type' => $propiedad['type'],
                    'defaultValue' => $propiedad['defaultValue']
                ]
            );
        }
    }
}
