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

    /**
     * Display a listing of the Flutter pizarras.
     */
    public function indexFlutter()
    {
        $pizarras = Pizarra::where(function ($query) {
                $query->where('user_id', Auth::id())
                    ->orWhereHas('collaborators', function ($query) {
                        $query->where('user_id', Auth::id())
                            ->where('status', 'accepted');
                    });
            })
            ->get();

        return Inertia::render('PizarraFlutter/Index', [
            'pizarras' => $pizarras
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('PizarraFlutter/Create');
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
        // Check if user is authorized to view this pizarra
        if (!$pizarra->isCollaboratingOrPropietario(Auth::id())) {
            abort(403, 'Unauthorized action.');
        }
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
        // verifica si el usuario esta autenticado redireccionar a la pagina de login
        if (!Auth::check()) {
            return redirect()->route('login')->with('redirect', route('pizarra.edit', $pizarra->id));
        }

        // verifica si no es colaborador o propietario
        if ($pizarra->user_id !== Auth::id() && !$pizarra->collaborators()->where('user_id', Auth::id())->exists()) {
            abort(403, 'Acción no autorizada.');
        }

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
        // Check if user is authorized to update this pizarra
        if ($pizarra->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

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
        // Check if user is authorized to delete this pizarra
        if ($pizarra->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        if ($pizarra->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        Pizarra::where('pizarra_id', $pizarra->id)->delete();
        $pizarra->delete();

        return response()->json(['message' => 'Pizarra deleted successfully'], 200);
    }

    /**
     * Remove the specified child pizarra from storage.
     */
    public function destroyHija(Pizarra $pizarra)
    {
        // Check if user is authorized to delete this pizarra
        if ($pizarra->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

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
        if ($pizarra->user_id !== Auth::id()) {
            return response()->json(['message' => 'No estás autorizado a invitar colaboradores a esta pizarra.'], 403);
        }

        $request->validate([
            'email' => 'required|email|exists:users,email'
        ]);

        $user = User::where('email', $request->email)->first();

        // Comprueba si el usuario ya es colaborador.
        if ($pizarra->collaborators()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'El usuario ya es colaborador'], 422);
        }

        // Crear el registro de colaboración
        $pizarra->collaborators()->attach($user->id, ['status' => 'pending']);

        // Send notification to the user
        $user->notify(new PizarraInvitation($pizarra, Auth::user()));

        return response()->json(['message' => 'Invitación enviada exitosamente']);
    }
    /**
     * Accept an invitation to collaborate on a pizarra.
     */
    public function acceptInvitation(Pizarra $pizarra)
    {
        $collaboration = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->first();

        if (!$collaboration) {
            abort(404, 'Invitación no encontrada.');
        }

        $collaboration->update(['status' => 'accepted']);

        return response()->json(['message' => 'Invitation accepted successfully']);
    }

    /**
     * Reject an invitation to collaborate on a pizarra.
     */
    public function rejectInvitation(Pizarra $pizarra)
    {
        $collaboration = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->first();

        if (!$collaboration) {
            abort(404, 'Invitación no encontrada.');
        }

        $collaboration->delete();

        return response()->json(['message' => 'Invitación rechazada exitosamente']);
    }

    /**
     * Deja una colaboración en una pizarra.
     */
    public function leaveCollaboration(Pizarra $pizarra)
    {
        $collaboration = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->where('user_id', Auth::id())
            ->where('status', 'accepted')
            ->first();

        if (!$collaboration) {
            abort(404, 'Collaboration not found.');
        }

        $collaboration->delete();

        return response()->json(['message' => 'Left collaboration successfully']);
    }

    /**
     * Get the collaborators of a pizarra.
     */
    public function getCollaborators(Pizarra $pizarra){
        // Comprobar si el usuario está autorizado para ver colaboradores
        if (!$pizarra->isCollaboratingOrPropietario(Auth::id())) {
            abort(403, 'Acción no autorizada.');
        }

        $collaborators = $pizarra->collaborators()->with('user')->get();

        return response()->json(['collaborators' => $collaborators]);
    }

    /**
     * Manejar un enlace de invitación.
     */
    public function handleInviteLink(Pizarra $pizarra)
    {
        // Compruebe si el usuario está autenticado
        if (!Auth::check()) {
            // Redirect to login page with a redirect back to this page after login
            return redirect()->route('login')->with('redirect', route('pizarra-flutter.invite-link', $pizarra->id));
        }
        // Comprueba si el usuario ya es colaborador.
        $collaboration = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->where('user_id', Auth::id())
            ->first();

        if ($collaboration) {
            if ($collaboration->status === 'accepted') {
                return redirect()->route('pizarra.index');
            } elseif ($collaboration->status === 'rejected') {
                // Update status to pending
                $collaboration->update(['status' => 'pending']);
            }
        }

        // Create a pending collaboration
        $pizarra->collaborators()->attach(Auth::id(), ['status' => 'pending']);

        // Redirect to pizarra flutter index with the invitation highlighted
        return redirect()->route('pizarra.index')
            ->with('highlight_invitation', $pizarra->id)
            ->with('message', 'Has sido invitado a colaborar en "' . $pizarra->name . '". Por favor revise sus invitaciones pendientes.');
    }

    /**
     * Handle an invitation link for Angular pizarras.
     */
    public function handleInviteLinkAngular(Pizarra $pizarra)
    {
        // Check if user is already a collaborator
        $collaboration = PizarraCollaborator::where('pizarra_id', $pizarra->id)
            ->where('user_id', Auth::id())
            ->first();

        if ($collaboration) {
            if ($collaboration->status === 'accepted') {
                return redirect()->route('pizarra.angular.show', $pizarra);
            } else {
                return Inertia::render('PizarraAngular/InvitationPending', [
                    'pizarra' => $pizarra->load('user')
                ]);
            }
        }

        // Create a pending collaboration
        $pizarra->collaborators()->attach(Auth::id(), ['status' => 'pending']);

        return Inertia::render('PizarraAngular/InvitationPending', [
            'pizarra' => $pizarra->load('user')
        ]);
    }

    /**
     * Scan an image and extract text.
     */
    public function scanImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:2048'
        ]);

        // Process the image and extract text
        // This is a placeholder implementation
        $text = "Extracted text from image";

        return response()->json(['text' => $text]);
    }

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
     * Extract all StatelessWidget classes from Flutter code
     *
     * @param string $code
     * @return array
     */
    private function extractStatelessWidgetClasses($code)
    {
        $classes = [];

        // Regular expression to match class declarations that extend StatelessWidget
        $pattern = '/class\s+(\w+)\s+extends\s+StatelessWidget\s*{([^{}]*({[^{}]*})*[^{}]*)*}/s';

        if (preg_match_all($pattern, $code, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $className = $match[1];
                $classCode = $match[0];
                $classes[$className] = $classCode;
            }
        }

        return $classes;
    }

    /**
     * Extract all Screen classes from Flutter code
     * A Screen class is a StatelessWidget that typically has a Scaffold in its build method
     *
     * @param string $code
     * @return array
     */
    private function extractScreenClasses($code)
    {
        // First, extract all StatelessWidget classes
        $classes = $this->extractStatelessWidgetClasses($code);
        $screenClasses = [];

        // Identify which classes are screens (typically contain Scaffold or are named with "Screen")
        foreach ($classes as $className => $classCode) {
            // Check if the class contains a Scaffold widget or has "Screen" in its name
            if (strpos($classCode, 'Scaffold(') !== false ||
                strpos($className, 'Screen') !== false ||
                $className === 'Home' ||
                $className === 'NavigationDrawer') {
                $screenClasses[$className] = $classCode;
            }
        }

        return $screenClasses;
    }

    /**
     * Convert a string to snake_case
     *
     * @param string $input
     * @return string
     */
    private function toSnakeCase($input)
    {
        // Replace any non-alphanumeric characters with underscores
        $output = preg_replace('/[^a-zA-Z0-9]/', '_', $input);

        // Convert camelCase to snake_case
        $output = preg_replace('/([a-z])([A-Z])/', '$1_$2', $output);

        // Convert to lowercase
        $output = strtolower($output);

        return $output;
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

        // Extract all Screen classes from the code
        $screenClasses = $this->extractScreenClasses($code);

        // Extract all StatelessWidget classes that are not screens
        $allClasses = $this->extractStatelessWidgetClasses($code);
        $otherWidgetClasses = array_diff_key($allClasses, $screenClasses);

        // Find the NavigationDrawer class
        $navigationDrawerClass = null;
        $otherClasses = [];

        foreach ($screenClasses as $className => $classCode) {
            if ($className === 'NavigationDrawer') {
                $navigationDrawerClass = $classCode;
            } else {
                $otherClasses[$className] = $classCode;
            }
        }

        // Create the navigation_drawer.dart file if found
        if ($navigationDrawerClass) {
            $navigationDrawerContent = "import 'package:flutter/material.dart';\n\n" . $navigationDrawerClass;
            file_put_contents($libDir . '/navigation_drawer.dart', $navigationDrawerContent);
        }

        // Create a file for each Screen class
        foreach ($otherClasses as $className => $classCode) {
            // Create file with the same name as the class (snake_case)
            $fileName = $this->toSnakeCase($className) . '.dart';

            // Add necessary imports
            $fileContent = "import 'package:flutter/material.dart';\n";

            // Add import for NavigationDrawer if it's used in the class
            if ($navigationDrawerClass && strpos($classCode, 'NavigationDrawer') !== false) {
                $fileContent .= "import 'navigation_drawer.dart';\n";
            }

            // Add imports for other screens if they're referenced in this screen
            foreach ($otherClasses as $otherClassName => $otherClassCode) {
                if ($otherClassName !== $className && strpos($classCode, $otherClassName) !== false) {
                    $fileContent .= "import '" . $this->toSnakeCase($otherClassName) . ".dart';\n";
                }
            }

            // Add the class code
            $fileContent .= "\n" . $classCode;

            file_put_contents($libDir . '/' . $fileName, $fileContent);
        }

        // Create a file for each non-screen StatelessWidget class
        if (!empty($otherWidgetClasses)) {
            // Create widgets directory if it doesn't exist
            $widgetsDir = $libDir . '/widgets';
            if (!file_exists($widgetsDir)) {
                mkdir($widgetsDir, 0755, true);
            }

            foreach ($otherWidgetClasses as $className => $classCode) {
                // Create file with the same name as the class (snake_case)
                $fileName = $this->toSnakeCase($className) . '.dart';

                // Add necessary imports
                $fileContent = "import 'package:flutter/material.dart';\n";

                // Add import for NavigationDrawer if it's used in the class
                if ($navigationDrawerClass && strpos($classCode, 'NavigationDrawer') !== false) {
                    $fileContent .= "import '../navigation_drawer.dart';\n";
                }

                // Add the class code
                $fileContent .= "\n" . $classCode;

                file_put_contents($widgetsDir . '/' . $fileName, $fileContent);
            }
        }

        // Use the corrected Flutter code from Azure for main.dart
        file_put_contents($libDir . '/main.dart', $code);

        // Create a backup of the full code for reference
        file_put_contents($libDir . '/my_flutter_app_backup.dart', $code);

        // Create standard Flutter project directories
        $directories = [
            $dir . '/android',
            $dir . '/android/app',
            $dir . '/android/app/src',
            $dir . '/android/app/src/main',
            $dir . '/android/app/src/main/res',
            $dir . '/android/app/src/main/res/drawable',
            $dir . '/android/app/src/main/res/values',
            $dir . '/ios',
            $dir . '/ios/Runner',
            $dir . '/ios/Runner/Assets.xcassets',
            $dir . '/web',
            $dir . '/test',
            $dir . '/assets',
            $dir . '/assets/images',
            $dir . '/assets/fonts',
        ];

        foreach ($directories as $directory) {
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
        }

        // Create basic Android files
        $androidManifestContent = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\">\n    <!-- The INTERNET permission is required for development. Specifically,\n         the Flutter tool needs it to communicate with the running application\n         to allow setting breakpoints, to provide hot reload, etc.\n    -->\n    <uses-permission android:name=\"android.permission.INTERNET\"/>\n    <application\n        android:label=\"$projectName\"\n        android:icon=\"@mipmap/ic_launcher\">\n        <activity\n            android:name=\"com.fpl.example.flutterprueba.MainActivity\"\n            android:exported=\"true\"\n            android:launchMode=\"singleTop\"\n            android:theme=\"@style/LaunchTheme\"\n            android:configChanges=\"orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode\"\n            android:hardwareAccelerated=\"true\"\n            android:windowSoftInputMode=\"adjustResize\">\n            <meta-data\n              android:name=\"io.flutter.embedding.android.NormalTheme\"\n              android:resource=\"@style/NormalTheme\"\n              />\n            <intent-filter>\n                <action android:name=\"android.intent.action.MAIN\"/>\n                <category android:name=\"android.intent.category.LAUNCHER\"/>\n            </intent-filter>\n        </activity>\n        <meta-data\n            android:name=\"flutterEmbedding\"\n            android:value=\"2\" />\n    </application>\n</manifest>\n";
        file_put_contents($dir . '/android/app/src/main/AndroidManifest.xml', $androidManifestContent);

        // Create MainActivity.java file with v2 embedding
        $packagePath = str_replace('.', '/', "com.fpl.example.flutterprueba");
        $mainActivityDir = $dir . '/android/app/src/main/java/' . $packagePath;
        if (!file_exists($mainActivityDir)) {
            mkdir($mainActivityDir, 0755, true);
        }

        $mainActivityContent = "package com.fpl.example.flutterprueba;\n\nimport io.flutter.embedding.android.FlutterActivity;\n\npublic class MainActivity extends FlutterActivity {\n}\n";
        file_put_contents($mainActivityDir . '/MainActivity.java', $mainActivityContent);

        $androidStylesContent = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<resources>\n    <style name=\"LaunchTheme\" parent=\"@android:style/Theme.Light.NoTitleBar\">\n        <item name=\"android:windowBackground\">@drawable/launch_background</item>\n    </style>\n    <style name=\"NormalTheme\" parent=\"@android:style/Theme.Light.NoTitleBar\">\n        <item name=\"android:windowBackground\">@android:color/white</item>\n    </style>\n</resources>\n";
        file_put_contents($dir . '/android/app/src/main/res/values/styles.xml', $androidStylesContent);

        $launchBackgroundContent = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<layer-list xmlns:android=\"http://schemas.android.com/apk/res/android\">\n    <item android:drawable=\"@android:color/white\" />\n</layer-list>\n";
        file_put_contents($dir . '/android/app/src/main/res/drawable/launch_background.xml', $launchBackgroundContent);

        // Create basic iOS files
        $infoContent = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n<plist version=\"1.0\">\n<dict>\n\t<key>CFBundleDevelopmentRegion</key>\n\t<string>en</string>\n\t<key>CFBundleExecutable</key>\n\t<string>Runner</string>\n\t<key>CFBundleIdentifier</key>\n\t<string>com.example." . strtolower(str_replace(' ', '_', $projectName)) . "</string>\n\t<key>CFBundleInfoDictionaryVersion</key>\n\t<string>6.0</string>\n\t<key>CFBundleName</key>\n\t<string>$projectName</string>\n\t<key>CFBundlePackageType</key>\n\t<string>APPL</string>\n\t<key>CFBundleShortVersionString</key>\n\t<string>1.0</string>\n\t<key>CFBundleSignature</key>\n\t<string>????</string>\n\t<key>CFBundleVersion</key>\n\t<string>1</string>\n\t<key>LSRequiresIPhoneOS</key>\n\t<true/>\n\t<key>UILaunchStoryboardName</key>\n\t<string>LaunchScreen</string>\n\t<key>UIMainStoryboardFile</key>\n\t<string>Main</string>\n\t<key>UISupportedInterfaceOrientations</key>\n\t<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>\n\t<key>UISupportedInterfaceOrientations~ipad</key>\n\t<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t\t<string>UIInterfaceOrientationPortraitUpsideDown</string>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>\n\t<key>UIViewControllerBasedStatusBarAppearance</key>\n\t<false/>\n</dict>\n</plist>\n";
        file_put_contents($dir . '/ios/Runner/Info.plist', $infoContent);

        // Create web files
        $indexHtmlContent = "<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <meta content=\"IE=Edge\" http-equiv=\"X-UA-Compatible\">\n  <meta name=\"description\" content=\"$projectName\">\n\n  <!-- iOS meta tags & icons -->\n  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n  <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black\">\n  <meta name=\"apple-mobile-web-app-title\" content=\"$projectName\">\n  <link rel=\"apple-touch-icon\" href=\"icons/Icon-192.png\">\n\n  <!-- Favicon -->\n  <link rel=\"icon\" type=\"image/png\" href=\"favicon.png\"/>\n\n  <title>$projectName</title>\n  <link rel=\"manifest\" href=\"manifest.json\">\n</head>\n<body>\n  <script>\n    window.addEventListener('load', function(ev) {\n      // Download main.dart.js\n      _flutter.loader.loadEntrypoint({\n        serviceWorker: {\n          serviceWorkerVersion: serviceWorkerVersion,\n        },\n        onEntrypointLoaded: function(engineInitializer) {\n          engineInitializer.initializeEngine().then(function(appRunner) {\n            appRunner.runApp();\n          });\n        }\n      });\n    });\n  </script>\n</body>\n</html>\n";
        file_put_contents($dir . '/web/index.html', $indexHtmlContent);

        $manifestContent = "{\n    \"name\": \"$projectName\",\n    \"short_name\": \"$projectName\",\n    \"start_url\": \".\",\n    \"display\": \"standalone\",\n    \"background_color\": \"#0175C2\",\n    \"theme_color\": \"#0175C2\",\n    \"description\": \"$projectName\",\n    \"orientation\": \"portrait-primary\",\n    \"prefer_related_applications\": false,\n    \"icons\": [\n        {\n            \"src\": \"icons/Icon-192.png\",\n            \"sizes\": \"192x192\",\n            \"type\": \"image/png\"\n        },\n        {\n            \"src\": \"icons/Icon-512.png\",\n            \"sizes\": \"512x512\",\n            \"type\": \"image/png\"\n        }\n    ]\n}\n";
        file_put_contents($dir . '/web/manifest.json', $manifestContent);

        // Create test file
        $testContent = "import 'package:flutter_test/flutter_test.dart';\n\nvoid main() {\n  testWidgets('Counter increments smoke test', (WidgetTester tester) async {\n    // Build our app and trigger a frame.\n    // await tester.pumpWidget(const MyApp());\n\n    // Verify that our counter starts at 0.\n    // expect(find.text('0'), findsOneWidget);\n    // expect(find.text('1'), findsNothing);\n\n    // Tap the '+' icon and trigger a frame.\n    // await tester.tap(find.byIcon(Icons.add));\n    // await tester.pump();\n\n    // Verify that our counter has incremented.\n    // expect(find.text('0'), findsNothing);\n    // expect(find.text('1'), findsOneWidget);\n  });\n}\n";
        file_put_contents($dir . '/test/widget_test.dart', $testContent);

        // Define the flutter-prueba directory path
        $flutterPruebaDir = 'D:\\proysw\\segundo-parcial-sw\\flutter-prueba';

        // Copy the pubspec.yaml file from flutter-prueba
        $pubspecContent = file_get_contents($flutterPruebaDir . '\\pubspec.yaml');
        // Replace the name with the project name
        $pubspecContent = preg_replace('/^name:.*$/m', 'name: ' . strtolower(str_replace(' ', '_', $projectName)), $pubspecContent);
        file_put_contents($dir . '/pubspec.yaml', $pubspecContent);

        // Project-level build.gradle.kts
        $projectBuildGradleContent = file_get_contents($flutterPruebaDir . '\\android\\build.gradle.kts');
        file_put_contents($dir . '/android/build.gradle.kts', $projectBuildGradleContent);

        // App-level build.gradle.kts
        $appBuildGradleContent = file_get_contents($flutterPruebaDir . '\\android\\app\\build.gradle.kts');
        file_put_contents($dir . '/android/app/build.gradle.kts', $appBuildGradleContent);

        // Create settings.gradle.kts
        $settingsGradleContent = file_get_contents($flutterPruebaDir . '\\android\\settings.gradle.kts');
        file_put_contents($dir . '/android/settings.gradle.kts', $settingsGradleContent);

        // Create gradle.properties
        $gradlePropertiesContent = file_get_contents($flutterPruebaDir . '\\android\\gradle.properties');
        file_put_contents($dir . '/android/gradle.properties', $gradlePropertiesContent);

        // Create local.properties file (copy from flutter-prueba but update project name if needed)
        $localPropertiesContent = file_get_contents($flutterPruebaDir . '\\android\\local.properties');
        file_put_contents($dir . '/android/local.properties', $localPropertiesContent);

        // Copy mipmap resources (app icons)
        $mipmapDirs = [
            'mipmap-hdpi',
            'mipmap-mdpi',
            'mipmap-xhdpi',
            'mipmap-xxhdpi',
            'mipmap-xxxhdpi'
        ];

        foreach ($mipmapDirs as $mipmapDir) {
            // Create the directory if it doesn't exist
            $targetDir = $dir . '/android/app/src/main/res/' . $mipmapDir;
            if (!file_exists($targetDir)) {
                mkdir($targetDir, 0755, true);
            }

            // Copy the ic_launcher.png file
            $sourceFile = $flutterPruebaDir . '\\android\\app\\src\\main\\res\\' . $mipmapDir . '\\ic_launcher.png';
            if (file_exists($sourceFile)) {
                copy($sourceFile, $targetDir . '/ic_launcher.png');
            }
        }

        // Create a detailed README.md file with instructions
        $readmeContent = "# $projectName\n\nA Flutter project generated by Pizarra Flutter.\n\n## Getting Started\n\nThis project contains a Flutter application with the UI you designed in Pizarra Flutter.\n\n### Prerequisites\n\n- Flutter SDK: https://docs.flutter.dev/get-started/install\n- Dart SDK (comes with Flutter)\n- Android Studio or VS Code with Flutter extensions\n- Android SDK (for Android development)\n- Xcode (for iOS development, macOS only)\n\n### Setup Instructions\n\n1. Extract the ZIP file\n2. Open terminal and navigate to project directory: `cd path/to/$projectName`\n3. **Important**: Configure the `android/local.properties` file with your SDK paths:\n   ```properties\n   sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk\n   flutter.sdk=C:\\path\\to\\flutter\n   ```\n   Replace the paths with your actual Android SDK and Flutter SDK paths.\n4. Get dependencies: `flutter pub get`\n5. Run the app: `flutter run`\n\n### Project Structure\n\n- `lib/`: Contains Dart code\n  - `main.dart`: Entry point\n  - `my_flutter_app.dart`: UI code from your design\n- `android/`, `ios/`, `web/`: Platform-specific files\n- `assets/`: Images, fonts, and resources\n- `test/`: Test files\n\n### Troubleshooting\n\nIf you encounter build errors related to Android embedding, ensure that:\n1. Your Flutter SDK is up to date: `flutter upgrade`\n2. The project is using Android v2 embedding (this project is already configured for v2 embedding)\n3. Your Android SDK and Flutter SDK paths are correctly set in `android/local.properties`\n\n#### Java/Gradle Compatibility Issues\n\nIf you encounter an error like this:\n```\nUnsupported class file major version 65\nBUG! exception in phase 'semantic analysis' in source unit '_BuildScript_'\n```\n\nThis indicates a compatibility issue between your Java version and the Gradle version used by the project. To fix this:\n\n1. Check your Java version: `flutter doctor --verbose` or `java -version`\n2. Update the Gradle version in `android/gradle/wrapper/gradle-wrapper.properties`:\n   - For Java 21 (version 65), use Gradle 8.5 or higher\n   - For Java 17 (version 61), use Gradle 7.6 or higher\n   - For Java 11 (version 55), use Gradle 7.0 or higher\n3. Update Java compatibility in `android/app/build.gradle`:\n   ```gradle\n   android {\n       compileOptions {\n           sourceCompatibility JavaVersion.VERSION_17\n           targetCompatibility JavaVersion.VERSION_17\n       }\n       kotlinOptions {\n           jvmTarget = '17'\n       }\n   }\n   ```\n\nFor more help, visit https://docs.flutter.dev/ or https://docs.gradle.org/current/userguide/compatibility.html#java\n";
        file_put_contents($dir . '/README.md', $readmeContent);

        // Create a separate INSTRUCTIONS.md file with Spanish instructions
        $instructionsContent = "# Instrucciones para ejecutar $projectName\n\n## Requisitos previos\n\n- Flutter SDK: https://docs.flutter.dev/get-started/install\n- Dart SDK (viene con Flutter)\n- Android Studio o VS Code con extensiones de Flutter\n- Android SDK (para desarrollo en Android)\n- Xcode (para desarrollo en iOS, solo macOS)\n\n## Pasos para ejecutar\n\n1. Extrae el archivo ZIP\n2. Abre una terminal y navega al directorio del proyecto: `cd ruta/a/$projectName`\n3. **Importante**: Configura el archivo `android/local.properties` con las rutas de tus SDKs:\n   ```properties\n   sdk.dir=C:\\Users\\TuUsuario\\AppData\\Local\\Android\\Sdk\n   flutter.sdk=C:\\ruta\\a\\flutter\n   ```\n   Reemplaza las rutas con las ubicaciones reales de tu Android SDK y Flutter SDK.\n4. Obtén las dependencias: `flutter pub get`\n5. Ejecuta la aplicación: `flutter run`\n\n## Estructura del proyecto\n\n- `lib/`: Contiene el código Dart\n  - `main.dart`: Punto de entrada\n  - `my_flutter_app.dart`: Código UI de tu diseño\n- `android/`, `ios/`, `web/`: Archivos específicos de plataforma\n- `assets/`: Imágenes, fuentes y recursos\n- `test/`: Archivos de prueba\n\n## Solución de problemas\n\nSi encuentras errores de compilación relacionados con el embedding de Android, asegúrate de que:\n1. Tu SDK de Flutter esté actualizado: `flutter upgrade`\n2. El proyecto esté usando Android v2 embedding (este proyecto ya está configurado para v2 embedding)\n3. Las rutas de tu Android SDK y Flutter SDK estén correctamente configuradas en `android/local.properties`\n\n### Problemas de compatibilidad entre Java y Gradle\n\nSi encuentras un error como este:\n```\nUnsupported class file major version 65\nBUG! exception in phase 'semantic analysis' in source unit '_BuildScript_'\n```\n\nEsto indica un problema de compatibilidad entre tu versión de Java y la versión de Gradle utilizada por el proyecto. Para solucionarlo:\n\n1. Verifica tu versión de Java: `flutter doctor --verbose` o `java -version`\n2. Actualiza la versión de Gradle en `android/gradle/wrapper/gradle-wrapper.properties`:\n   - Para Java 21 (versión 65), usa Gradle 8.5 o superior\n   - Para Java 17 (versión 61), usa Gradle 7.6 o superior\n   - Para Java 11 (versión 55), usa Gradle 7.0 o superior\n3. Actualiza la compatibilidad de Java en `android/app/build.gradle`:\n   ```gradle\n   android {\n       compileOptions {\n           sourceCompatibility JavaVersion.VERSION_17\n           targetCompatibility JavaVersion.VERSION_17\n       }\n       kotlinOptions {\n           jvmTarget = '17'\n       }\n   }\n   ```\n\nPara más ayuda, visita https://docs.flutter.dev/ o https://docs.gradle.org/current/userguide/compatibility.html#java\n";
        file_put_contents($dir . '/INSTRUCCIONES.md', $instructionsContent);
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
}
