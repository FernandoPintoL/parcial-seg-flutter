<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SpeechController;

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
