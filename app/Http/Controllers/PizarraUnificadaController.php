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
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class PizarraUnificadaController extends Controller
{
    use AuthorizesRequests;
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

        return redirect()->route('pizarra_unificada.show', $pizarra->id);
    }

    /**
     * Display the specified unified pizarra.
     */
    public function show(Pizarra $pizarra_unificada)
    {
        // return $pizarra_unificada;
        $user = Auth::user();
        // Verificar si el usuario tiene acceso a esta pizarra
        if (!$this->canAccessPizarra($pizarra_unificada, $user)) {
            return $this->handleAccessDenied($pizarra_unificada, $user);
        }

        // Cargar relaciones necesarias
        $pizarra_unificada->load(['user', 'collaborators']);
        // Obtener colaboradores
        $colaboradores = $pizarra_unificada->collaborators()
            ->where('status', 'accepted')
            ->get();
        // Obtener pantallas
        $screens = json_decode($pizarra_unificada->screens, true) ?? [];

        return Inertia::render('PizarraUnificada/components/PizarraUnificadaCore', [
            'user' => $user,
            'pizarra' => [
                'id' => $pizarra_unificada->id,
                'name' => $pizarra_unificada->name,
                'type' => $pizarra_unificada->framework ?? 'both',
                'elements' => json_decode($pizarra_unificada->elements, true) ?? [],
                'screens' => $screens,
                'user_id' => $pizarra_unificada->user_id,
                'room_id' => $pizarra_unificada->room_id,
                'created_at' => $pizarra_unificada->created_at->toISOString(),
                'updated_at' => $pizarra_unificada->updated_at->toISOString(),
            ],
            'creador' => $pizarra_unificada->user,
            'isCreador' => $pizarra_unificada->user_id === $user->id,
            'colaboradores' => $colaboradores,
        ]);
    }

    /**
     * Show the form for editing the specified unified pizarra.
     */
    public function edit(Pizarra $pizarra_unificada)
    {
        $this->authorize('update', $pizarra_unificada);

        return $this->show($pizarra_unificada);
    }

    /**
     * Update the specified unified pizarra in storage.
     */
    public function update(Request $request, Pizarra $pizarra_unificada)
    {
        try {
            $this->authorize('update', $pizarra_unificada);

            $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|in:flutter,angular,both',
                //'elements' => 'sometimes|required|array', // acepta array vacío
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

            $pizarra_unificada->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Pizarra actualizada correctamente',
                'pizarra' => $pizarra_unificada
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para actualizar esta pizarra'
            ], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la pizarra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified unified pizarra from storage.
     */
    public function destroy(Pizarra $pizarra_unificada)
    {
        try {
            $this->authorize('delete', $pizarra_unificada);

            // Eliminar colaboradores
            $pizarra_unificada->collaborators()->detach();

            // Eliminar pizarra
            $pizarra_unificada->delete();

            return response()->json([
                'success' => true,
                'message' => 'Pizarra eliminada correctamente'
            ]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para eliminar esta pizarra'
            ], 403);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la pizarra: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Invite a collaborator to the unified pizarra.
     */
    public function invite(Request $request, Pizarra $pizarra_unificada)
    {
        $this->authorize('update', $pizarra_unificada);

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

        if ($user->id === $pizarra_unificada->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes invitarte a ti mismo'
            ], 400);
        }

        // Verificar si ya existe la invitación
        $existingInvitation = $pizarra_unificada->collaborators()
            ->where('user_id', $user->id)
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario ya ha sido invitado'
            ], 400);
        }

        // Crear invitación
        $pizarra_unificada->collaborators()->attach($user->id, [
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
    public function acceptInvitation(Pizarra $pizarra_unificada)
    {
        $user = Auth::user();

        $collaboration = $pizarra_unificada->collaborators()
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
    public function rejectInvitation(Pizarra $pizarra_unificada)
    {
        $user = Auth::user();

        $collaboration = $pizarra_unificada->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$collaboration) {
            return response()->json([
                'success' => false,
                'message' => 'Invitación no encontrada'
            ], 404);
        }

        $pizarra_unificada->collaborators()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Invitación rechazada correctamente'
        ]);
    }

    /**
     * Leave collaboration on a unified pizarra.
     */
    public function leaveCollaboration(Pizarra $pizarra_unificada)
    {
        $user = Auth::user();

        if ($pizarra_unificada->user_id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes abandonar tu propia pizarra'
            ], 400);
        }

        $pizarra_unificada->collaborators()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Has abandonado la colaboración correctamente'
        ]);
    }

    /**
     * Generate and download code for the unified pizarra.
     */
    public function downloadCode(Request $request, Pizarra $pizarra_unificada)
    {
        $this->authorize('view', $pizarra_unificada);

        $request->validate([
            'framework' => 'required|in:flutter,angular,both',
            'format' => 'required|in:zip,individual',
        ]);

        $framework = $request->input('framework');
        $format = $request->input('format');

        // Generar código según el framework
        $codeGenerator = new \App\Services\UnifiedCodeGenerationService();
        $code = $codeGenerator->generateCode($pizarra_unificada, [
            'framework' => $framework,
            'format' => 'download',
        ]);

        if ($format === 'zip') {
            // Crear archivo ZIP con estructura de proyecto
            $zipPath = $this->createProjectZip($pizarra_unificada, $code, $framework);

            return response()->download($zipPath, "{$pizarra_unificada->name}-{$framework}.zip")
                ->deleteFileAfterSend(true);
        } else {
            // Descargar archivo individual
            $fileName = "{$pizarra_unificada->name}-{$framework}.txt";

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
    public function processDiagram(Request $request, Pizarra $pizarra_unificada)
    {
        $this->authorize('update', $pizarra_unificada);

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
    private function canAccessPizarra(Pizarra $pizarra_unificada, User $user): bool
    {
        // El creador siempre puede acceder
        if ($pizarra_unificada->user_id === $user->id) {
            return true;
        }

        // Los colaboradores aceptados pueden acceder
        $collaboration = $pizarra_unificada->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->first();

        return $collaboration !== null;
    }

    /**
     * Handle access denied to pizarra.
     */
    private function handleAccessDenied(Pizarra $pizarra_unificada, User $user)
    {
        // Verificar si hay invitación pendiente
        $collaboration = $pizarra_unificada->collaborators()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($collaboration) {
            return Inertia::render('PizarraUnificada/InvitationPending', [
                'pizarra' => $pizarra_unificada->load('user')
            ]);
        }

        // Crear invitación pendiente
        $pizarra_unificada->collaborators()->attach($user->id, [
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return Inertia::render('PizarraUnificada/InvitationPending', [
            'pizarra' => $pizarra_unificada->load('user')
        ]);
    }

    /**
     * Create a project ZIP file.
     */
    private function createProjectZip(Pizarra $pizarra_unificada, string $code, string $framework): string
    {
        $projectName = Str::slug($pizarra_unificada->name);
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
                $zip->addFromString('pubspec.yaml', $this->generatePubspecYaml($pizarra_unificada));
                $zip->addFromString('README.md', $this->generateReadme($pizarra_unificada, $framework));
            } elseif ($framework === 'angular') {
                $zip->addFromString('package.json', $this->generatePackageJson($pizarra_unificada));
                $zip->addFromString('angular.json', $this->generateAngularJson($pizarra_unificada));
                $zip->addFromString('README.md', $this->generateReadme($pizarra_unificada, $framework));
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
    private function generatePubspecYaml(Pizarra $pizarra_unificada): string
    {
        $projectName = Str::slug($pizarra_unificada->name, '_');

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
    private function generatePackageJson(Pizarra $pizarra_unificada): string
    {
        $projectName = Str::slug($pizarra_unificada->name);

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
    private function generateAngularJson(Pizarra $pizarra_unificada): string
    {
        $projectName = Str::slug($pizarra_unificada->name);

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
    private function generateReadme(Pizarra $pizarra_unificada, string $framework): string
    {
        $frameworkName = ucfirst($framework);

        return "# {$pizarra_unificada->name}

Este proyecto fue generado automáticamente usando Pizarra Unificada.

## Framework
{$frameworkName}

## Descripción
{$pizarra_unificada->description}

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
