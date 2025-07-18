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
    'pizarra_unificada' => PizarraUnificadaController::class,
    'pizarra-widget' => PizarraWidgetController::class,
    'propiedades' => PropiedadesController::class,
    'node' => NodeController::class,
    'chat' => ChatController::class,
    'whiteboard-activity' => WhiteboardActivityController::class,
    'ai' => AIController::class,
];

// Speech API routes
Route::middleware(['web', 'auth'])->prefix('speech')->group(function () {
    Route::post('/speech-to-text', [SpeechController::class, 'speechToText'])->name('api.speech.speech-to-text');
    Route::post('/text-to-speech', [SpeechController::class, 'textToSpeech'])->name('api.speech.text-to-speech');
    Route::get('/voices', [SpeechController::class, 'getVoices'])->name('api.speech.voices');
    Route::get('/auth-token', [SpeechController::class, 'getAuthToken'])->name('api.speech.auth-token');
    Route::get('/config-status', [SpeechController::class, 'getConfigStatus'])->name('api.speech.config-status');
    Route::get('/test', [SpeechController::class, 'testConfiguration'])->name('api.speech.test');
    Route::get('/test-whisper', [SpeechController::class, 'testWhisper'])->name('api.speech.test-whisper');
});

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
