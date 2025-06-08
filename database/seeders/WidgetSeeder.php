<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class WidgetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // widgets de flutter
        $widgets = [
            ['type' => 'SafeArea', 'label' => 'SafeArea', 'icon' => 'safe_area', 'hasChildren' => false, 'categoria_widget_id' => 1],
            ['type' => 'Scaffold', 'label' => 'Scaffold', 'icon' => 'scaffold', 'hasChildren' => true, 'categoria_widget_id' => 1],
            ['type' => 'AppBar', 'label' => 'AppBar', 'icon' => 'app_bar', 'hasChildren' => false, 'categoria_widget_id' => 1],
            ['type' => 'BottomNavigationBar', 'label' => 'BottomNavigationBar', 'icon' => 'bottom_navigation_bar', 'hasChildren' => false, 'categoria_widget_id' => 1],
            ['type' => 'Drawer', 'label' => 'Drawer', 'icon' => 'drawer', 'hasChildren' => false, 'categoria_widget_id' => 1],
            ['type' => 'TabBar', 'label' => 'TabBar', 'icon' => 'tab_bar', 'hasChildren' => false, 'categoria_widget_id' => 1],
            ['type' => 'FloatingActionButton', 'label' => 'FloatingActionButton', 'icon' => 'floating_action_button', 'hasChildren' => false, 'categoria_widget_id' => 1],
            ['type' => 'TextField', 'label' => 'TextField', 'icon' => '', 'hasChildren' => false, 'categoria_widget_id' => 3],
            ['type' => "Checkbox", "label" => "Checkbox", "icon" => "", "hasChildren" => false, "categoria_widget_id" => 3],
            ['type' => "Radio", "label" => "Radio", "icon" => "", "hasChildren" => false, "categoria_widget_id" => 3],
            ['type' => "Switch", "label" => "Switch", "icon" => "", "hasChildren" => false, "categoria_widget_id" => 3],
            ['type' => "Slider", "label" => "Slider", "icon" => "", "hasChildren" => false, "categoria_widget_id" => 3],
            ['type' =>'DropdownButton',  "label" =>'DropdownButton',  "icon"=>'',  "hasChildren"=>false,  "categoria_widget_id"=>3],
            ['type' => 'ListView', 'label' => 'ListView', 'icon' => 'list_view', 'hasChildren' => true, 'categoria_widget_id' => 1],
            ['type' => 'GridView', 'label' => 'GridView', 'icon' => 'grid_view', 'hasChildren' => true, 'categoria_widget_id' => 1],
            ['type' => 'Column', 'label' => 'Column', 'icon' => '', 'hasChildren' => true, 'categoria_widget_id' => 2],
            ['type' => 'Row', 'label' => 'Row', 'icon' => '', 'hasChildren' => true, 'categoria_widget_id' => 2],
            ['type' => 'Container', 'label' => 'Container', 'icon' => '', 'hasChildren' => false, 'categoria_widget_id' => 5],
            ['type' => 'Padding', 'label' => 'Padding', 'icon' => '', 'hasChildren' => false, 'categoria_widget_id' => 5],
            ['type' => "Align", "label" =>'Align', "icon"=>'', "hasChildren"=>false, "categoria_widget_id"=>5],
            ['type' =>'Center',  "label" =>'Center',  "icon"=>'',  "hasChildren"=>false,  "categoria_widget_id"=>5],
            ['type'=>'Stack',   "label"=>'Stack',   "icon"=>'',   "hasChildren"=>true,   "categoria_widget_id"=>2],
            ['type'=>'Positioned',   "label"=>'Positioned',   "icon"=>'',   "hasChildren"=>false,   "categoria_widget_id"=>2],
            ['type'=>'Expanded',   "label"=>'Expanded',   "icon"=>'',   "hasChildren"=>false,   "categoria_widget_id"=>2],
            ['type'=>'Flexible',   "label"=>'Flexible',   "icon"=>'',   "hasChildren"=>false,   "categoria_widget_id"=>2],
            ['type' => 'Navigator', 'label' => 'Navigator', 'icon' => '', 'hasChildren' => true, 'categoria_widget_id' => 6],
            ['type' => 'PageView', 'label' => 'PageView', 'icon' => '', 'hasChildren' => true, 'categoria_widget_id' => 6],
        ];
        // Insert widgets into the database
        foreach ($widgets as $widget) {
            \App\Models\Widget::create($widget);
        }
    }
}
