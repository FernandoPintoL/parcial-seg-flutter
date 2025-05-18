<?php

namespace App\Http\Controllers;

use App\Models\Pizarra;
use App\Http\Requests\StorePizarraRequest;
use App\Http\Requests\UpdatePizarraRequest;
use Inertia\Inertia;

class PizarraController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Pizarra/Index');
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
    public function store(StorePizarraRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Pizarra $pizarra)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Pizarra $pizarra)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePizarraRequest $request, Pizarra $pizarra)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pizarra $pizarra)
    {
        //
    }
}
