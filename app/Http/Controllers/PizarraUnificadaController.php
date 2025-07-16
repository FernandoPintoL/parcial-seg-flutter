<?php

namespace App\Http\Controllers;

use App\Models\Pizarra;
use App\Models\PizarraCollaborator;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PizarraUnificadaController extends Controller
{
    /**
     * Display a listing of unified pizarras.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Pizarras propias
        $ownedPizarras = Pizarra::where('user_id', $user->id)
            ->where('type', 'unified')
            ->with('user')
            ->orderBy('updated_at', 'desc')
            ->get();

        // Pizarras colaborativas
        $collaboratingPizarras = Pizarra::whereHas('collaborators', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->where('status', 'accepted');
        })
        ->where('type', 'unified')
        ->with('user')
        ->orderBy('updated_at', 'desc')
        ->get();

        // Invitaciones pendientes
        $pendingInvitations = Pizarra::whereHas('collaborators', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->where('status', 'pending');
        })
        ->where('type', 'unified')
        ->with('user')
        ->orderBy('created_at', 'desc')
        ->get();

        return Inertia::render('PizarraUnificada/Index', [
            'ownedPizarras' => $ownedPizarras,
            'collaboratingPizarras' => $collaboratingPizarras,
            'pendingInvitations' => $pendingInvitations,
        ]);
    }

    /**
     * Show the form for creating a new unified pizarra.
     */
    public function create(): Response
    {
        return Inertia::render('PizarraUnificada/Create');
    }

    /**
     * Store a newly created unified pizarra in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'framework' => 'required|in:flutter,angular,both',
            'description' => 'nullable|string|max:1000',
        ]);

        $pizarra = Pizarra::create([
            'name' => $request->name,
            'type' => 'unified',
            'framework' => $request->framework,
            'description' => $request->description,
            'user_id' => Auth::id(),
            'room_id' => 'room-' . Str::random(10),
            'elements' => json_encode([]),
            'screens' => json_encode([
                [
                    'id' => 'screen-' . time(),
                    'name' => 'Pantalla Principal',
                    'elements' => [],
                    'isHome' => true,
                    'isDrawer' => false,
                    'framework' => $request->framework,
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString(),
                ]
            ]),
        ]);

        return redirect()->route('pizarra-unificada.show', $pizarra->id);
    }

    /**
     * Display the specified unified pizarra.
     */
    public function show(Pizarra $pizarra)
    {
        $user = Auth::user();

        // Verificar si el usuario tiene acceso a esta pizarra
        if (!$this->canAccessPizarra($pizarra, $user)) {
            return $this->handleAccessDenied($pizarra, $user);
        }

        // Cargar relaciones necesarias
        $pizarra->load(['user', 'collaborators.user']);

        // Obtener colaboradores
        $colaboradores = $pizarra->collaborators()
            ->where('status', 'accepted')
            ->with('user')
            ->get()
            ->pluck('user');

        // Obtener pantallas
        $screens = json_decode($pizarra->screens, true) ?? [];

        return Inertia::render('PizarraUnificada/PizarraUnificada', [
            'user' => $user,
            'pizarra' => [
                'id' => $pizarra->id,
                'name' => $pizarra->name,
                'type' => $pizarra->framework ?? 'both',
                'elements' => json_decode($pizarra->elements, true) ?? [],
                'screens' => $screens,
                'user_id' => $pizarra->user_id,
                'room_id' => $pizarra->room_id,
                'created_at' => $pizarra->created_at->toISOString(),
                'updated_at' => $pizarra->updated_at->toISOString(),
            ],
            'creador' => $pizarra->user,
            'isCreador' => $pizarra->user_id === $user->id,
            'colaboradores' => $colaboradores,
        ]);
    }

    /**
     * Show the form for editing the specified unified pizarra.
     */
    public function edit(Pizarra $pizarra)
    {
        $this->authorize('update', $pizarra);

        return $this->show($pizarra);
    }

    /**
     * Update the specified unified pizarra in storage.
     */
    public function update(Request $request, Pizarra $pizarra)
    {
        $this->authorize('update', $pizarra);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:flutter,angular,both',
            'elements' => 'sometimes|required|array',
            'screens' => 'sometimes|required|array',
            'description' => 'nullable|string|max:1000',
        ]);

        $updateData = [];

        if ($request->has('name')) {
            $updateData['name'] = $request->name;
        }

        if ($request->has('type')) {
            $updateData['framework'] = $request->type;
        }

        if ($request->has('elements')) {
            $updateData['elements'] = json_encode($request->elements);
        }

        if ($request->has('screens')) {
            $updateData['screens'] = json_encode($request->screens);
        }

        if ($request->has('description')) {
            $updateData['description'] = $request->description;
        }

        $pizarra->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Pizarra actualizada correctamente',
            'pizarra' => $pizarra
        ]);
    }

    /**
     * Remove the specified unified pizarra from storage.
     */
    public function destroy(Pizarra $pizarra)
    {
        $this->authorize('delete', $pizarra);

        // Eliminar colaboradores
        $pizarra->collaborators()->detach();

        // Eliminar pizarra
        $pizarra->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pizarra eliminada correctamente'
        ]);
    }

    /**
     * Invite a collaborator to the unified pizarra.
     */
    public function invite(Request $request, Pizarra $pizarra)
    {
        $this->authorize('update', $pizarra);

        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        if ($user->id === $pizarra->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes invitarte a ti mismo'
            ], 400);
        }

        // Verificar si ya existe la invitación
        $existingInvitation = $pizarra->collaborators()
            ->where('user_id', $user->id)
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario ya ha sido invitado'
            ], 400);
        }

        // Crear invitación
        $pizarra->collaborators()->attach($user->id, [
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invitación enviada correctamente'
        ]);
    }

    /**
     * Accept an invitation to collaborate on a unified pizarra.
     */
    public function acceptInvitation(Pizarra $pizarra)
    {
        $user = Auth::user();

        $collaboration = $pizarra->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$collaboration) {
            return response()->json([
                'success' => false,
                'message' => 'Invitación no encontrada'
            ], 404);
        }

        $collaboration->pivot->status = 'accepted';
        $collaboration->pivot->save();

        return response()->json([
            'success' => true,
            'message' => 'Invitación aceptada correctamente'
        ]);
    }

    /**
     * Reject an invitation to collaborate on a unified pizarra.
     */
    public function rejectInvitation(Pizarra $pizarra)
    {
        $user = Auth::user();

        $collaboration = $pizarra->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$collaboration) {
            return response()->json([
                'success' => false,
                'message' => 'Invitación no encontrada'
            ], 404);
        }

        $pizarra->collaborators()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Invitación rechazada correctamente'
        ]);
    }

    /**
     * Leave collaboration on a unified pizarra.
     */
    public function leaveCollaboration(Pizarra $pizarra)
    {
        $user = Auth::user();

        if ($pizarra->user_id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes abandonar tu propia pizarra'
            ], 400);
        }

        $pizarra->collaborators()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Has abandonado la colaboración correctamente'
        ]);
    }

    /**
     * Generate and download code for the unified pizarra.
     */
    public function downloadCode(Request $request, Pizarra $pizarra)
    {
        $this->authorize('view', $pizarra);

        $request->validate([
            'framework' => 'required|in:flutter,angular,both',
            'format' => 'required|in:zip,individual',
        ]);

        $framework = $request->input('framework');
        $format = $request->input('format');

        // Generar código según el framework
        $codeGenerator = new \App\Services\UnifiedCodeGenerationService();
        $code = $codeGenerator->generateCode($pizarra, [
            'framework' => $framework,
            'format' => 'download',
        ]);

        if ($format === 'zip') {
            // Crear archivo ZIP con estructura de proyecto
            $zipPath = $this->createProjectZip($pizarra, $code, $framework);

            return response()->download($zipPath, "{$pizarra->name}-{$framework}.zip")
                ->deleteFileAfterSend(true);
        } else {
            // Descargar archivo individual
            $fileName = "{$pizarra->name}-{$framework}.txt";

            return response()->streamDownload(function () use ($code) {
                echo $code;
            }, $fileName, [
                'Content-Type' => 'text/plain',
            ]);
        }
    }

    /**
     * Process diagram upload for unified pizarra.
     */
    public function processDiagram(Request $request, Pizarra $pizarra)
    {
        $this->authorize('update', $pizarra);

        $request->validate([
            'type' => 'required|in:image,xml,plantuml,text',
            'file' => 'required_if:type,image|file|mimes:jpeg,png,jpg,gif,svg,xml,txt',
            'content' => 'required_if:type,text|string',
        ]);

        $type = $request->type;
        $diagramProcessor = new \App\Services\DiagramProcessingService();

        try {
            $result = null;

            if ($type === 'image') {
                $result = $diagramProcessor->processImageDiagram($request->file('file'));
            } elseif ($type === 'xml') {
                $content = file_get_contents($request->file('file')->getRealPath());
                $result = $diagramProcessor->processXMLDiagram($content);
            } elseif ($type === 'plantuml') {
                $content = file_get_contents($request->file('file')->getRealPath());
                $result = $diagramProcessor->processPlantUMLDiagram($content);
            } elseif ($type === 'text') {
                $result = $diagramProcessor->processTextDiagram($request->input('content'));
            }

            if ($result && $result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data'],
                    'message' => 'Diagrama procesado correctamente'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Error al procesar el diagrama'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if user can access the pizarra.
     */
    private function canAccessPizarra(Pizarra $pizarra, User $user): bool
    {
        // El creador siempre puede acceder
        if ($pizarra->user_id === $user->id) {
            return true;
        }

        // Los colaboradores aceptados pueden acceder
        $collaboration = $pizarra->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->first();

        return $collaboration !== null;
    }

    /**
     * Handle access denied to pizarra.
     */
    private function handleAccessDenied(Pizarra $pizarra, User $user)
    {
        // Verificar si hay invitación pendiente
        $collaboration = $pizarra->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($collaboration) {
            return Inertia::render('PizarraUnificada/InvitationPending', [
                'pizarra' => $pizarra->load('user')
            ]);
        }

        // Crear invitación pendiente
        $pizarra->collaborators()->attach($user->id, [
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return Inertia::render('PizarraUnificada/InvitationPending', [
            'pizarra' => $pizarra->load('user')
        ]);
    }

    /**
     * Create a project ZIP file.
     */
    private function createProjectZip(Pizarra $pizarra, string $code, string $framework): string
    {
        $projectName = Str::slug($pizarra->name);
        $tempPath = storage_path('app/temp');

        if (!is_dir($tempPath)) {
            mkdir($tempPath, 0755, true);
        }

        $zipPath = $tempPath . "/{$projectName}-{$framework}.zip";
        $zip = new \ZipArchive();

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            // Agregar archivo principal
            $zip->addFromString("main.{$this->getFileExtension($framework)}", $code);

            // Agregar archivos adicionales según el framework
            if ($framework === 'flutter') {
                $zip->addFromString('pubspec.yaml', $this->generatePubspecYaml($pizarra));
                $zip->addFromString('README.md', $this->generateReadme($pizarra, $framework));
            } elseif ($framework === 'angular') {
                $zip->addFromString('package.json', $this->generatePackageJson($pizarra));
                $zip->addFromString('angular.json', $this->generateAngularJson($pizarra));
                $zip->addFromString('README.md', $this->generateReadme($pizarra, $framework));
            }

            $zip->close();
        }

        return $zipPath;
    }

    /**
     * Get file extension for framework.
     */
    private function getFileExtension(string $framework): string
    {
        switch ($framework) {
            case 'flutter':
                return 'dart';
            case 'angular':
                return 'ts';
            default:
                return 'txt';
        }
    }

    /**
     * Generate pubspec.yaml for Flutter.
     */
    private function generatePubspecYaml(Pizarra $pizarra): string
    {
        $projectName = Str::slug($pizarra->name, '_');

        return "name: {$projectName}
description: A Flutter project generated from Pizarra Unificada.
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: '>=3.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true
";
    }

    /**
     * Generate package.json for Angular.
     */
    private function generatePackageJson(Pizarra $pizarra): string
    {
        $projectName = Str::slug($pizarra->name);

        return json_encode([
            'name' => $projectName,
            'version' => '1.0.0',
            'description' => 'An Angular project generated from Pizarra Unificada',
            'scripts' => [
                'ng' => 'ng',
                'start' => 'ng serve',
                'build' => 'ng build',
                'watch' => 'ng build --watch --configuration development',
                'test' => 'ng test'
            ],
            'private' => true,
            'dependencies' => [
                '@angular/animations' => '^15.0.0',
                '@angular/common' => '^15.0.0',
                '@angular/compiler' => '^15.0.0',
                '@angular/core' => '^15.0.0',
                '@angular/forms' => '^15.0.0',
                '@angular/platform-browser' => '^15.0.0',
                '@angular/platform-browser-dynamic' => '^15.0.0',
                '@angular/router' => '^15.0.0',
                'bootstrap' => '^5.3.0',
                'rxjs' => '~7.5.0',
                'tslib' => '^2.3.0',
                'zone.js' => '~0.12.0'
            ],
            'devDependencies' => [
                '@angular-devkit/build-angular' => '^15.0.0',
                '@angular/cli' => '~15.0.0',
                '@angular/compiler-cli' => '^15.0.0',
                '@types/jasmine' => '~4.3.0',
                '@types/node' => '^18.7.0',
                'jasmine-core' => '~4.4.0',
                'karma' => '~6.4.0',
                'karma-chrome-launcher' => '~3.1.0',
                'karma-coverage' => '~2.2.0',
                'karma-jasmine' => '~5.1.0',
                'karma-jasmine-html-reporter' => '~2.0.0',
                'typescript' => '~4.8.0'
            ]
        ], JSON_PRETTY_PRINT);
    }

    /**
     * Generate angular.json for Angular.
     */
    private function generateAngularJson(Pizarra $pizarra): string
    {
        $projectName = Str::slug($pizarra->name);

        return json_encode([
            '$schema' => './node_modules/@angular/cli/lib/config/schema.json',
            'version' => 1,
            'newProjectRoot' => 'projects',
            'projects' => [
                $projectName => [
                    'projectType' => 'application',
                    'schematics' => [
                        '@schematics/angular:component' => [
                            'style' => 'scss'
                        ]
                    ],
                    'root' => '',
                    'sourceRoot' => 'src',
                    'prefix' => 'app',
                    'architect' => [
                        'build' => [
                            'builder' => '@angular-devkit/build-angular:browser',
                            'options' => [
                                'outputPath' => "dist/{$projectName}",
                                'index' => 'src/index.html',
                                'main' => 'src/main.ts',
                                'polyfills' => 'src/polyfills.ts',
                                'tsConfig' => 'tsconfig.app.json',
                                'assets' => [
                                    'src/favicon.ico',
                                    'src/assets'
                                ],
                                'styles' => [
                                    'src/styles.scss'
                                ],
                                'scripts' => []
                            ]
                        ]
                    ]
                ]
            ]
        ], JSON_PRETTY_PRINT);
    }

    /**
     * Generate README.md.
     */
    private function generateReadme(Pizarra $pizarra, string $framework): string
    {
        $frameworkName = ucfirst($framework);

        return "# {$pizarra->name}

Este proyecto fue generado automáticamente usando Pizarra Unificada.

## Framework
{$frameworkName}

## Descripción
{$pizarra->description}

## Instalación y Uso

### Para {$frameworkName}

" . ($framework === 'flutter' ?
"```bash
flutter pub get
flutter run
```" :
"```bash
npm install
npm start
```") . "

## Generado por
Pizarra Unificada - Sistema de generación de código colaborativo

Fecha de generación: " . now()->format('Y-m-d H:i:s') . "
";
    }
}
