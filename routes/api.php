<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


use App\Http\Controllers\{
    AIController,
    CategoriaWidgetController,
    ChatController,
    FigmaController,
    NodeController,
    PizarraController,
    PizarraUnificadaController,
    PizarraWidgetController,
    PropiedadesController,
    SpeechController,
    UserController,
    WhiteboardActivityController,
    WidgetController,
    WidgetsPropiedadesController,
};

$resources = [
    'users' => UserController::class,
    'widgets' => WidgetController::class,
    'widget-propiedades' => WidgetsPropiedadesController::class,
    'categoria-widgets' => CategoriaWidgetController::class,
    'figma' => FigmaController::class,
    'pizarra' => PizarraController::class,
    'pizarra-unificada' => PizarraUnificadaController::class,
    'pizarra-widget' => PizarraWidgetController::class,
    'propiedades' => PropiedadesController::class,
    'node' => NodeController::class,
    'chat' => ChatController::class,
    'whiteboard-activity' => WhiteboardActivityController::class,
    'ai' => AIController::class,
];

// Resource routes with authentication
Route::middleware(['web', 'auth'])->group(function () use ($resources) {
    foreach ($resources as $key => $controller) {
        Route::post("/$key/query", [$controller, 'query'])->name("api.$key.query");
        Route::post("/$key/store", [$controller, 'store'])->name("api.$key.store");
        Route::put("/$key/{".$key."}", [$controller, 'update'])->name("api.$key.update");
        Route::delete("/$key/{".$key."}", [$controller, 'destroy'])->name("api.$key.destroy");
    }
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Speech Service routes
Route::prefix('speech')->group(function () {
    Route::get('/config-status', [SpeechController::class, 'getConfigStatus']);
    Route::get('/test', [SpeechController::class, 'testConfiguration']);
    Route::get('/voices', [SpeechController::class, 'getVoices']);
    Route::get('/auth-token', [SpeechController::class, 'getAuthToken']);
    Route::post('/text-to-speech', [SpeechController::class, 'textToSpeech']);
    Route::post('/speech-to-text', [SpeechController::class, 'speechToText']);
    Route::get('/test-whisper', [SpeechController::class, 'testWhisper']);
});
