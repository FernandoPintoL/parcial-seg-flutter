<?php

namespace App\Http\Controllers;

use App\Models\CategoriaWidget;
use App\Models\Pizarra;
use App\Http\Requests\StorePizarraRequest;
use App\Http\Requests\UpdatePizarraRequest;
use App\Models\PizarraCollaborator;
use App\Models\User;
use App\Models\Widget;
use App\Notifications\PizarraInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PizarraController extends Controller
{
    /**
     * Generate and download a complete Flutter project
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function downloadFlutterProject(Request $request)
    {
        // Validate the request
        /*$validated = $request->validate([
            'code' => 'required|string',
            'project_name' => 'required|string|max:255',
            'id' => 'id:nullable|exists:pizarras,id',
        ]);*/

        // For GET requests, the parameters are in the query string

        try {
            // Get required data with memory efficiency
            $projectName = $request->input('project_name', 'flutter_project');
            $code = $request->input('code', '');
            $downloadType = $request->input('download_type', 'complete'); // 'complete' or 'individual'

            // If downloading individual files, create a single file and return it
            if ($downloadType === 'individual') {
                // Extract class name from the code to use as filename
                $className = $this->extractClassName($code);
                $fileName = $className ? $className . '.dart' : $projectName . '.dart';

                // Create a temporary file
                $filePath = storage_path('app/temp/' . $fileName);
                file_put_contents($filePath, $code);

                // Return the file for download
                return response()->download($filePath, $fileName, [
                    'Content-Type' => 'text/plain',
                ])->deleteFileAfterSend(true);
            }

            // For complete download, create the full project structure
            // Create a temporary directory to store the project
            $tempDir = storage_path('app/temp/' . uniqid('flutter_project_'));
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            // Create the project structure with memory efficiency
            $this->createFlutterProjectStructure($tempDir, $projectName, $code);

            // Create a zip file
            $zipFileName = $projectName . '.zip';
            $zipFilePath = storage_path('app/temp/' . $zipFileName);

            // Create the zip archive with memory efficiency
            $zip = new \ZipArchive();
            if ($zip->open($zipFilePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
                $this->addDirToZip($zip, $tempDir, '');
                $zip->close();

                // Clean up the temporary directory to free memory
                $this->deleteDirectory($tempDir);

                // Return the zip file for download
                return response()->download($zipFilePath, $zipFileName, [
                    'Content-Type' => 'application/zip',
                ])->deleteFileAfterSend(true);
            } else {
                // Clean up on error
                $this->deleteDirectory($tempDir);
                return response()->json(['error' => 'Failed to create zip file'], 500);
            }
        } catch (\Exception $e) {
            // Log the error
            \Log::error('Error creating Flutter project: ' . $e->getMessage());

            // Clean up any temporary files that might have been created
            if (isset($tempDir) && file_exists($tempDir)) {
                $this->deleteDirectory($tempDir);
            }

            return response()->json([
                'error' => 'Failed to create Flutter project',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract class name from Flutter code
     *
     * @param string $code
     * @return string|null
     */
    private function extractClassName($code)
    {
        // Match class declaration pattern
        if (preg_match('/class\s+(\w+)\s+extends/', $code, $matches)) {
            return $matches[1];
        }

        // If no class found, try to extract a meaningful name from the code
        if (preg_match('/\/\/\s*(\w+)/', $code, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Create the Flutter project structure
     *
     * @param string $dir
     * @param string $projectName
     * @param string $code
     * @return void
     */
    private function createFlutterProjectStructure($dir, $projectName, $code)
    {
        // Create the lib directory
        $libDir = $dir . '/lib';
        if (!file_exists($libDir)) {
            mkdir($libDir, 0755, true);
        }

        // Create the main.dart file
        $mainDartContent = "import 'package:flutter/material.dart';\nimport 'my_flutter_app.dart';\n\nvoid main() {\n  runApp(MaterialApp(\n    title: '$projectName',\n    theme: ThemeData(\n      primarySwatch: Colors.blue,\n    ),\n    home: const MyFlutterApp(),\n  ));\n}\n";
        file_put_contents($libDir . '/main.dart', $mainDartContent);

        // Create the my_flutter_app.dart file with the generated code
        file_put_contents($libDir . '/my_flutter_app.dart', $code);

        // Create the pubspec.yaml file
        $pubspecContent = "name: " . strtolower(str_replace(' ', '_', $projectName)) . "\ndescription: A new Flutter project.\n\npublish_to: 'none'\n\nversion: 1.0.0+1\n\nenvironment:\n  sdk: '>=3.0.0 <4.0.0'\n\ndependencies:\n  flutter:\n    sdk: flutter\n  cupertino_icons: ^1.0.2\n\ndev_dependencies:\n  flutter_test:\n    sdk: flutter\n  flutter_lints: ^2.0.0\n\nflutter:\n  uses-material-design: true\n";
        file_put_contents($dir . '/pubspec.yaml', $pubspecContent);

        // Create the README.md file
        $readmeContent = "# $projectName\n\nA Flutter project generated by Pizarra Flutter.\n";
        file_put_contents($dir . '/README.md', $readmeContent);
    }

    /**
     * Add a directory to a zip file
     *
     * @param \ZipArchive $zip
     * @param string $dir
     * @param string $basePath
     * @return void
     */
    private function addDirToZip($zip, $dir, $basePath)
    {
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file == '.' || $file == '..') continue;

            $filePath = $dir . '/' . $file;
            $relativePath = $basePath . ($basePath ? '/' : '') . $file;

            if (is_dir($filePath)) {
                $zip->addEmptyDir($relativePath);
                $this->addDirToZip($zip, $filePath, $relativePath);
            } else {
                $zip->addFile($filePath, $relativePath);
            }
        }
    }

    /**
     * Delete a directory and its contents
     *
     * @param string $dir
     * @return bool
     */
    private function deleteDirectory($dir)
    {
        if (!file_exists($dir)) {
            return true;
        }

        if (!is_dir($dir)) {
            return unlink($dir);
        }

        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') {
                continue;
            }

            if (!$this->deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
                return false;
            }
        }

        return rmdir($dir);
    }

    /**
     * Process an uploaded image and generate Flutter UI using ROBOFLOW
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function scanImage(Request $request)
    {
        // Validate the request
        $request->validate([
            'image' => 'required|image|max:5120', // Max 5MB
        ]);

        // Variables to track resources for cleanup
        $tempDir = null;
        $imagePath = null;

        try {
            // Get the uploaded image
            $image = $request->file('image');

            // Create a temporary directory to store the image
            $tempDir = storage_path('app/temp/' . uniqid('image_'));
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            // Save the image to the temporary directory
            $imagePath = $tempDir . '/' . $image->getClientOriginalName();
            move_uploaded_file($image->getPathname(), $imagePath);

            // Get ROBOFLOW credentials from environment
            $roboflowApiKey = env('ROBOFLOW_API_KEY');
            $modelId = env('ROBFLOW_MODEL_ID');

            if (!$roboflowApiKey || !$modelId) {
                // Clean up resources before returning
                if ($tempDir && file_exists($tempDir)) {
                    $this->deleteDirectory($tempDir);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'ROBOFLOW API key or model ID not configured',
                ], 500);
            }

            // Prepare the image for ROBOFLOW - read in chunks to reduce memory usage
            $imageData = '';
            $handle = fopen($imagePath, 'rb');
            while (!feof($handle)) {
                $imageData .= fread($handle, 8192); // Read in 8KB chunks
            }
            fclose($handle);

            $base64Image = base64_encode($imageData);

            // Free up memory
            $imageData = null;

            // Call ROBOFLOW API
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://detect.roboflow.com/v1/detect/{$modelId}?api_key={$roboflowApiKey}", [
                'image' => $base64Image
            ]);

            if (!$response->successful()) {
                \Log::error('ROBOFLOW API error: ' . $response->body());

                // Clean up resources before returning
                if ($tempDir && file_exists($tempDir)) {
                    $this->deleteDirectory($tempDir);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Error al procesar la imagen con ROBOFLOW: ' . $response->body(),
                ], 500);
            }

            // Process ROBOFLOW response
            $roboflowData = $response->json();

            // Convert ROBOFLOW predictions to Flutter widgets
            $widgets = $this->convertRoboflowToFlutterWidgets($roboflowData);

            // Generate a URL for the original image
            $imageUrl = 'data:image/' . $image->getClientOriginalExtension() . ';base64,' . $base64Image;

            // Generate a URL for the processed image (if ROBOFLOW returns one)
            $processedImageUrl = $roboflowData['image'] ?? $imageUrl;

            // Clean up the temporary directory to free memory
            if ($tempDir && file_exists($tempDir)) {
                $this->deleteDirectory($tempDir);
            }

            // Free up large variables
            $base64Image = null;

            // Return the response with both the original image, processed image, and widgets
            return response()->json([
                'success' => true,
                'widgets' => $widgets,
                'originalImage' => $imageUrl,
                'processedImage' => $processedImageUrl,
                'rawData' => $roboflowData,
                'rawCode' => $this->generateFlutterCodeFromWidgets($widgets),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error scanning image: ' . $e->getMessage());

            // Clean up resources in case of error
            if ($tempDir && file_exists($tempDir)) {
                $this->deleteDirectory($tempDir);
            }

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar la imagen: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convert ROBOFLOW predictions to Flutter widgets
     *
     * @param array $roboflowData
     * @return array
     */
    private function convertRoboflowToFlutterWidgets($roboflowData)
    {
        $widgets = [];
        $predictions = $roboflowData['predictions'] ?? [];

        foreach ($predictions as $prediction) {
            $widgetType = $prediction['class'] ?? 'Container';
            $confidence = $prediction['confidence'] ?? 0;

            // Skip low confidence predictions
            if ($confidence < 0.5) {
                continue;
            }

            // Get bounding box coordinates
            $x = $prediction['x'] ?? 0;
            $y = $prediction['y'] ?? 0;
            $width = $prediction['width'] ?? 100;
            $height = $prediction['height'] ?? 100;

            // Create a Flutter widget based on the prediction class
            $widget = [
                'id' => 'widget-' . uniqid(),
                'type' => $this->mapRoboflowClassToFlutterWidget($widgetType),
                'props' => $this->getDefaultPropsForWidgetType($widgetType, $width, $height),
                'children' => [],
                'metadata' => [
                    'roboflow' => [
                        'class' => $widgetType,
                        'confidence' => $confidence,
                        'x' => $x,
                        'y' => $y,
                        'width' => $width,
                        'height' => $height
                    ]
                ]
            ];

            $widgets[] = $widget;
        }

        return $widgets;
    }

    /**
     * Map ROBOFLOW class to Flutter widget type
     *
     * @param string $roboflowClass
     * @return string
     */
    private function mapRoboflowClassToFlutterWidget($roboflowClass)
    {
        $mapping = [
            'button' => 'FloatingActionButton',
            'text' => 'Text',
            'image' => 'Image',
            'container' => 'Container',
            'row' => 'Row',
            'column' => 'Column',
            'appbar' => 'AppBar',
            'textfield' => 'TextField',
            'card' => 'Card',
            'icon' => 'Icon',
            'checkbox' => 'Checkbox',
            'dropdown' => 'DropdownButton',
            'scaffold' => 'Scaffold',
            'center' => 'Center',
            'sizedbox' => 'SizedBox',
            'padding' => 'Padding',
            'form' => 'Form',
            'drawer' => 'Drawer',
            'listtitle' => 'ListTitle',
            'cardtext' => 'CardText',
        ];

        return $mapping[strtolower($roboflowClass)] ?? 'Container';
    }

    /**
     * Get default properties for a widget type
     *
     * @param string $widgetType
     * @param float $width
     * @param float $height
     * @return array
     */
    private function getDefaultPropsForWidgetType($widgetType, $width, $height)
    {
        $widgetType = strtolower($widgetType);

        $props = [
            'width' => $width,
            'height' => $height,
        ];

        switch ($widgetType) {
            case 'button':
                $props['child'] = 'Text("Button")';
                $props['backgroundColor'] = '#2196F3';
                $props['foregroundColor'] = '#FFFFFF';
                break;
            case 'text':
                $props['data'] = 'Text Content';
                $props['style'] = 'TextStyle(fontSize: 16.0)';
                break;
            case 'image':
                $props['src'] = 'https://via.placeholder.com/150';
                $props['fit'] = 'BoxFit.cover';
                break;
            case 'container':
                $props['color'] = '#FFFFFF';
                $props['padding'] = 'EdgeInsets.all(16.0)';
                break;
            case 'textfield':
                $props['decoration'] = 'InputDecoration(labelText: "Label")';
                $props['controller'] = 'TextEditingController()';
                break;
            case 'appbar':
                $props['title'] = 'AppBar Title';
                $props['backgroundColor'] = '#2196F3';
                break;
            default:
                // Default properties for other widget types
                break;
        }

        return $props;
    }

    /**
     * Generate Flutter code from widgets
     *
     * @param array $widgets
     * @return string
     */
    private function generateFlutterCodeFromWidgets($widgets)
    {
        $code = "import 'package:flutter/material.dart';\n\n";
        $code .= "class MyFlutterApp extends StatelessWidget {\n";
        $code .= "  const MyFlutterApp({Key? key}) : super(key: key);\n\n";
        $code .= "  @override\n";
        $code .= "  Widget build(BuildContext context) {\n";
        $code .= "    return Scaffold(\n";
        $code .= "      appBar: AppBar(\n";
        $code .= "        title: const Text(\"Flutter UI from ROBOFLOW\"),\n";
        $code .= "      ),\n";
        $code .= "      body: Center(\n";
        $code .= "        child: Column(\n";
        $code .= "          mainAxisAlignment: MainAxisAlignment.center,\n";
        $code .= "          children: [\n";

        foreach ($widgets as $widget) {
            $code .= "            // " . ($widget['metadata']['roboflow']['class'] ?? 'Widget') . " (confidence: " . ($widget['metadata']['roboflow']['confidence'] ?? 'N/A') . ")\n";
            $code .= "            " . $this->generateWidgetCode($widget) . ",\n";
        }

        $code .= "          ],\n";
        $code .= "        ),\n";
        $code .= "      ),\n";
        $code .= "    );\n";
        $code .= "  }\n";
        $code .= "}\n";

        return $code;
    }

    /**
     * Generate code for a single widget
     *
     * @param array $widget
     * @return string
     */
    private function generateWidgetCode($widget)
    {
        $type = $widget['type'];
        $props = $widget['props'];

        switch ($type) {
            case 'Container':
                return "Container(\n" .
                       "              width: " . $props['width'] . ",\n" .
                       "              height: " . $props['height'] . ",\n" .
                       "              color: Color(0xFF" . substr($props['color'] ?? '#FFFFFF', 1) . "),\n" .
                       "              padding: " . ($props['padding'] ?? 'EdgeInsets.zero') . ",\n" .
                       "            )";
            case 'Text':
                return "Text(\n" .
                       "              \"" . ($props['data'] ?? 'Text Content') . "\",\n" .
                       "              style: " . ($props['style'] ?? 'null') . ",\n" .
                       "            )";
            case 'Image':
                return "Image.network(\n" .
                       "              '" . ($props['src'] ?? 'https://via.placeholder.com/150') . "',\n" .
                       "              width: " . $props['width'] . ",\n" .
                       "              height: " . $props['height'] . ",\n" .
                       "              fit: " . ($props['fit'] ?? 'BoxFit.cover') . ",\n" .
                       "            )";
            case 'FloatingActionButton':
                return "FloatingActionButton(\n" .
                       "              onPressed: () {},\n" .
                       "              child: " . ($props['child'] ?? 'const Icon(Icons.add)') . ",\n" .
                       "              backgroundColor: Color(0xFF" . substr($props['backgroundColor'] ?? '#2196F3', 1) . "),\n" .
                       "            )";
            default:
                return "$type(\n" .
                       "              // Default widget properties\n" .
                       "            )";
        }
    }

    /**
     * Get a description of an image using Azure AI Vision
     *
     * @param string $imageData Base64 encoded image data
     * @return string|null Description of the image
     */
    private function getImageDescription($imageData)
    {
        try {
            // Get Azure credentials from environment
            $azureApiKey = env('AZURE_API_KEY');
            $azureApiUrl = env('AZURE_API_URL');

            // Create a request to Azure AI Vision
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Content-Type' => 'application/json',
                'api-key' => $azureApiKey,
            ])->post(rtrim($azureApiUrl, '/') . '/openai/deployments/' . env('AZURE_DEPLOYMENT_NAME', 'gpt-4.1') . '/chat/completions?api-version=2023-05-15', [
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an AI assistant that helps describe images for UI development. Provide detailed descriptions of UI elements, layouts, and design patterns you see in the image.'
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => 'Describe this UI mockup or sketch in detail, focusing on layout, components, and structure:'
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => 'data:image/jpeg;base64,' . $imageData
                                ]
                            ]
                        ]
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 800,
            ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'] ?? '';
                return $content;
            } else {
                \Log::error('Azure Vision API error: ' . $response->body());
                return null;
            }
        } catch (\Exception $e) {
            \Log::error('Error getting image description: ' . $e->getMessage());
            return null;
        }
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();

        // Get pizarras created by the user
        $ownedPizarras = Pizarra::where('user_id', $user->id)
                        ->where('isHome', true)->get();

        // Get pizarras the user is collaborating on (with accepted status)
        $collaboratingPizarras = $user->collaborating()
            ->wherePivot('status', 'accepted')
            ->get();

        // Get pending invitations
        $pendingInvitations = $user->collaborating()
            ->wherePivot('status', 'pending')
            ->get();

        return Inertia::render('PizarraFlutter/Index', [
            'ownedPizarras' => $ownedPizarras,
            'collaboratingPizarras' => $collaboratingPizarras,
            'pendingInvitations' => $pendingInvitations
        ]);
    }
    public function indexAngular(){
        return Inertia::render('FormBuilder/Index');
    }
    public function indexFlutter(){

//        return Inertia::render('Pizarra/Index');
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
        $isHome = $request->isHome ?? false;
        $pizarra = null;
        if($isHome){
            $pizarra = Pizarra::create([
                'name' => $request->name,
                'user_id' => auth()->id(),
                'isHome' => $request->isHome,
                'screens' => $request->screen ?? json_encode([]),
                'elements' => $request->elements ?? json_encode([]),
            ]);
            $pizarra->update([
                'room_id' => 'room_'.$pizarra->id,
            ]);
            // a esta pizarra le asignamos un scaffold y un appbar por defecto
            // creamos el Drawer asignado a la pizarra como una pantalla hija
            /*$drawer = Pizarra::create([
                'name' => 'Drawer',
                'user_id' => auth()->id(),
                'isHome' => false,
                'pizarra_id' => $pizarra->id, // id de la pizarra padre
            ]);*/
        }else{
            $pizarra = Pizarra::create([
                'name' => $request->name,
                'user_id' => auth()->id(),
                'isHome' => false,
                'pizarra_id' => $request->pizarra_id, // id de la pizarra padre
                'screens' => $request->screen ?? json_encode([]),
                'elements' => $request->elements ?? json_encode([]),
            ]);
        }

        return response()->json($pizarra, 200);
    }

    /**
     * Display the specified resource.
     */
    public function show(Pizarra $pizarra)
    {
        return Inertia::render('PizarraFlutter/Index', [
            'user' => auth()->user(),
            'pizarra' => $pizarra,
            'isCreador' => $pizarra->user_id === auth()->id(),
            'creador' => $pizarra->user,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Pizarra $pizarra)
    {
        return Inertia::render('PizarraFlutter/PizarraFlutter', [
            'user' => auth()->user(),
            'pizarra' => $pizarra,
            'isCreador' => $pizarra->user_id === auth()->id(),
            'creador' => $pizarra->user,
            'collaborators' => $pizarra->collaborators(),
            'screens' => $pizarra->pizarraHijas()->get(),
            'widgets' => Widget::with('categoria')->get(),
            'categoriasWidget' => CategoriaWidget::all(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePizarraRequest $request, Pizarra $pizarra)
    {
        $pizarra->name = $request->name;

        // Update elements (legacy support) - handle large data more efficiently
        if ($request->has('elements')) {
            // Store elements directly without additional processing
            $pizarra->elements = $request->input('elements');
        }

        // Handle screens data efficiently
        if ($request->has('screens')) {
            // Store screens directly without additional processing
            $pizarra->screens = $request->input('screens');
        }

        if($pizarra->id === null){
            return response()->json(['error' => 'Pizarra not found'], 404);
        }else{
            $pizarra->pizarra_id = $pizarra->id;
        }

        // Save with reduced memory usage
        $pizarra->save();

        // Return minimal response to reduce memory usage
        return response()->json([
            'id' => $pizarra->id,
            'name' => $pizarra->name,
            'updated_at' => $pizarra->updated_at
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pizarra $pizarra)
    {
        if ($pizarra->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        Pizarra::where('pizarra_id', $pizarra->id)->delete();
        $pizarra->delete();

        return response()->json(['message' => 'Pizarra deleted successfully'], 200);
    }
    // destroy pizarra hija
    public function destroyHija(Pizarra $pizarra)
    {
        // Check if user is authorized to delete this pizarra
        if ($pizarra->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        $pizarra_hija = Pizarra::where('pizarra_id', $pizarra->id)->first();
        $pizarra_hija->delete();

        return redirect()->route('pizarra.edit', $pizarra->id)
            ->with('message', 'Pizarra hija eliminada con éxito');
    }


    /**
     * Invite a user to collaborate on a pizarra.
     */
    public function inviteCollaborator(Request $request, Pizarra $pizarra)
    {
        // Validate the request
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Get the pizarra and ensure the current user is the owner
//        $pizarra = Pizarra::findOrFail($id);

        if ($pizarra->user_id !== Auth::id()) {
            return response()->json(['message' => 'No estás autorizado a invitar colaboradores a esta pizarra.'], 403);
        }

        // Find the user to invite
        $userToInvite = User::where('email', $validated['email'])->first();

        // Check if the user is already a collaborator
        $existingCollaboration = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->where('user_id', $userToInvite->id)
            ->first();

        if ($existingCollaboration) {
            return response()->json(['message' => 'This user is already a collaborator or has a pending invitation'], 422);
        }

        // Create the collaboration
        $collaboration = PizarraCollaborator::create([
            'pizarra_id' => $pizarra->id,
            'user_id' => $userToInvite->id,
            'status' => 'pending',
        ]);

        // Send notification to the invited user
        if (class_exists('App\Notifications\PizarraInvitation')) {
            $userToInvite->notify(new PizarraInvitation($pizarra, Auth::user()));
        }

        return response()->json($collaboration, 201);
    }

    /**
     * Accept a collaboration invitation.
     */
    public function acceptInvitation(Pizarra $pizarra)
    {
        // Find the collaboration and ensure it belongs to the current user
        $collaboration = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        // Update the status
        $collaboration->update(['status' => 'accepted']);

        // Get the pizarra and the user who accepted the invitation
//        $pizarra = Pizarra::findOrFail($id);
        $user = Auth::user();

        // Create a socket.io client to emit an event
        $socketUrl = env('SOCKET_SERVER_URL', 'http://localhost:4000');
        $ch = curl_init($socketUrl . '/emit-event');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'event' => 'collaboratorAccepted',
            'data' => [
                'pizarraId' => $pizarra->id,
                'roomId' => 'flutter-room-' . $pizarra->id,
                'user' => $user->name,
                'userId' => $user->id,
                'email' => $user->email,
                'timestamp' => now()->timestamp,
            ]
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        $response = curl_exec($ch);
        curl_close($ch);

        return response()->json($collaboration, 200);
    }

    /**
     * Reject a collaboration invitation.
     */
    public function rejectInvitation(Pizarra $pizarra)
    {
        // Find the collaboration and ensure it belongs to the current user
        $collaboration = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        // Update the status
        $collaboration->update(['status' => 'rejected']);

        return response()->json($collaboration, 200);
    }

    /**
     * Leave a collaboration.
     */
    public function leaveCollaboration(Pizarra $pizarra)
    {
        // Find the collaboration and ensure it belongs to the current user
        $collaboration = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Delete the collaboration
        $collaboration->delete();

        return response()->json(['message' => 'Has abandonado la colaboración con éxito'], 200);
    }

    /**
     * Get collaborators for a pizarra.
     */
    public function getCollaborators(Pizarra $pizarra)
    {
        // Check if the user is the owner or a collaborator
        $user = Auth::user();
        $isOwner = $pizarra->user_id === $user->id;
        $isCollaborator = $user->isColaborator($pizarra->id);

        if (!$isOwner && !$isCollaborator) {
            return response()->json(['message' => 'No estás autorizado a ver los colaboradores de esta pizarra.'], 403);
        }
        $collaboradores = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->with('user:id,name,email')
            ->get()
            ->map(function ($collaborator) {
                return [
                    'id' => $collaborator->user->id,
                    'name' => $collaborator->user->name,
                    'email' => $collaborator->user->email,
                    'status' => $collaborator->status,
                ];
            });
        return response()->json($collaboradores, 200);
    }

    /**
     * Handle invitation link To Flutter.
     */
    public function handleInviteLink(Pizarra $form)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            // Redirect to login page with a redirect back to this page after login
            return redirect()->route('login')->with('redirect', route('pizarra-flutter.invite-link', $form->id));
        }

        $user = Auth::user();

        // Check if user is already the owner
        if ($form->user_id === $user->id) {
            return redirect()->route('pizarra.index')
                ->with('message', 'Usted ya es el propietario de esta pizarra.');
        }

        // Check if user is already a collaborator
        $existingCollaboration = PizarraCollaborator::where('pizarra_id', $form->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingCollaboration) {
            if ($existingCollaboration->status === 'accepted') {
                return redirect()->route('pizarra-flutter.index')
                    ->with('message', 'Ya eres colaborador en esta pizarra.');
            } elseif ($existingCollaboration->status === 'rejected') {
                // Update status to pending
                $existingCollaboration->update(['status' => 'pending']);
            }
            // If status is pending, show the invitation page
        } else {
            // Create a new collaboration with pending status
            PizarraCollaborator::create([
                'pizarra_id' => $form->id,
                'user_id' => $user->id,
                'status' => 'pending',
            ]);
        }

        // Redirect to pizarra flutter index with the invitation highlighted
        return redirect()->route('pizarra-flutter.index')
            ->with('highlight_invitation', $form->id)
            ->with('message', 'Has sido invitado a colaborar en "' . $form->name . '". Por favor revise sus invitaciones pendientes.');
    }
}
