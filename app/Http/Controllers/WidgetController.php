<?php

namespace App\Http\Controllers;

use App\Models\CategoriaWidget;
use App\Models\Propiedades;
use App\Models\Widget;
use App\Http\Requests\StoreWidgetRequest;
use App\Http\Requests\UpdateWidgetRequest;
use Illuminate\Http\Request;

class WidgetController extends Controller
{
    public function getAllWidgets(Request $request)
    {
        $widgets = Widget::with('categoria')->get();
        return response()->json($widgets);
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $widgets = Widget::with('categoria')->get();
//        return response()->json($widgets);
        return Inertia('Widgets/Index', [
            'widgets' => $widgets,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Not used with API
        return redirect()->route('widget.index');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreWidgetRequest $request)
    {
        $widget = Widget::create($request->validated());
        return response()->json($widget, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Widget $widget)
    {
        return response()->json($widget);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Widget $widget)
    {
        // Not used with API
        $widget = Widget::with('categoria')->findOrFail($widget->id);
        // cargar propiedades
        $widget->load('propiedades');
        $categoria = CategoriaWidget::all();
        $propiedades = Propiedades::all();
        return Inertia('Widgets/Update', [
            'widget' => $widget,
            'categorias' => $categoria,
            'propiedades' => $propiedades,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateWidgetRequest $request, Widget $widget)
    {
        $widget->update($request->validated());
        return response()->json($widget);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Widget $widget)
    {
        $widget->delete();
        return response()->json(null, 204);
    }

    /**
     * Get properties for a specific widget.
     */
    public function getPropiedades(Widget $widget)
    {
        $propiedades = $widget->propiedades()->get();
        return response()->json($propiedades);
    }

    /**
     * Delete all properties for a specific widget.
     */
    public function deletePropiedades(Widget $widget)
    {
        $widget->propiedades()->detach();
        return response()->json(null, 204);
    }
}
