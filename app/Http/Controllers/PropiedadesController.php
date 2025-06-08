<?php

namespace App\Http\Controllers;

use App\Models\Propiedades;
use App\Http\Requests\StorePropiedadesRequest;
use App\Http\Requests\UpdatePropiedadesRequest;

class PropiedadesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $propiedades = Propiedades::all();
        return Inertia('PropiedadesWidgets/Index', [
            'propiedades' => $propiedades,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia('PropiedadesWidgets/CreateUpdate', [
            'isEditing' => false,
            'propiedad' => null,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePropiedadesRequest $request)
    {
        $propiedad = Propiedades::create($request->validated());
        return redirect()->route('propiedad-widget.index')->with('success', 'Propiedad creada exitosamente');
    }

    /**
     * Display the specified resource.
     */
    public function show(Propiedades $propiedades)
    {
        return response()->json($propiedades);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Propiedades $propiedades)
    {
        return Inertia('PropiedadesWidgets/CreateUpdate', [
            'isEditing' => true,
            'propiedad' => $propiedades,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePropiedadesRequest $request, Propiedades $propiedades)
    {
        $propiedades->update($request->validated());
        return redirect()->route('propiedad-widget.index')->with('success', 'Propiedad actualizada exitosamente');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Propiedades $propiedades)
    {
        $propiedades->delete();
        return redirect()->route('propiedad-widget.index')->with('success', 'Propiedad eliminada exitosamente');
    }
}
