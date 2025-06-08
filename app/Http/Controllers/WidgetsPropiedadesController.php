<?php

namespace App\Http\Controllers;

use App\Models\WidgetsPropiedades;
use App\Http\Requests\StoreWidgetsPropiedadesRequest;
use App\Http\Requests\UpdateWidgetsPropiedadesRequest;
use Inertia\Inertia;

class WidgetsPropiedadesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Inertia::render('PropiedadesWidgets/Index', [
            'widgetsPropiedades' => WidgetsPropiedades::all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreWidgetsPropiedadesRequest $request)
    {
        $widgetPropiedad = WidgetsPropiedades::create($request->validated());
        return response()->json($widgetPropiedad, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(WidgetsPropiedades $widgetsPropiedades)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(WidgetsPropiedades $widgetsPropiedades)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateWidgetsPropiedadesRequest $request, WidgetsPropiedades $widgetsPropiedades)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(WidgetsPropiedades $widgetsPropiedades)
    {
        //
    }
}
