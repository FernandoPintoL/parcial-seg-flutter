<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class WidgetsPropiedadesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // propiedades asignadas a cada widgets especificas de cada widget
        $widgetsPropiedades = [
            // Ejemplo de widget con propiedades
            [
                'widget_id' => 1, // ID del widget
                'propiedad_id' => 1, // ID de la propiedad
                'value' => 'Valor personalizado',
                'defaultValue' => 'Valor por defecto',
            ],
            // Agrega más widgets y sus propiedades según sea necesario
        ];
        foreach ($widgetsPropiedades as $widgetPropiedad) {
            \App\Models\WidgetsPropiedades::create(
                [
                    'widget_id' => $widgetPropiedad['widget_id'],
                    'propiedad_id' => $widgetPropiedad['propiedad_id'],
                    'value' => $widgetPropiedad['value'],
                    'defaultValue' => $widgetPropiedad['defaultValue']
                ]
            );
        }

    }
}
