<?php

namespace App\Http\Controllers;

use App\Models\CategoriaWidget;
use App\Http\Requests\StoreCategoriaWidgetRequest;
use App\Http\Requests\UpdateCategoriaWidgetRequest;

class CategoriaWidgetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categorias = CategoriaWidget::all();
        return Inertia('CategoriaWidget/Index', [
            'categorias' => $categorias,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia('CategoriaWidget/CreateUpdate', [
            'isEditing' => false,
            'categoria' => null,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCategoriaWidgetRequest $request)
    {
        $categoria = CategoriaWidget::create($request->validated());
        return redirect()->route('categoria-widget.index')->with('success', 'Categoría creada exitosamente');
    }

    /**
     * Display the specified resource.
     */
    public function show(CategoriaWidget $categoriaWidget)
    {
        return response()->json($categoriaWidget);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(CategoriaWidget $categoriaWidget)
    {
        return Inertia('CategoriaWidget/CreateUpdate', [
            'isEditing' => true,
            'categoria' => $categoriaWidget,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCategoriaWidgetRequest $request, CategoriaWidget $categoriaWidget)
    {
        $categoriaWidget->update($request->validated());
        return redirect()->route('categoria-widget.index')->with('success', 'Categoría actualizada exitosamente');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CategoriaWidget $categoriaWidget)
    {
        $categoriaWidget->delete();
        return redirect()->route('categoria-widget.index')->with('success', 'Categoría eliminada exitosamente');
    }
}
