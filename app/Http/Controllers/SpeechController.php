<?php

namespace App\Http\Controllers;

use App\Services\AzureSpeechService;
use App\Services\WhisperService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SpeechController extends Controller
{
    protected $speechService;
    protected $whisperService;

    public function __construct(AzureSpeechService $speechService, WhisperService $whisperService)
    {
        $this->speechService = $speechService;
        $this->whisperService = $whisperService;
    }

    /**
     * Get the configuration status of Azure Speech Service
     *
     * @return JsonResponse
     */
    public function getConfigStatus(): JsonResponse
    {
        $status = $this->speechService->getConfigStatus();

        return response()->json([
            'success' => true,
            'data' => $status,
        ]);
    }

    /**
     * Convert text to speech
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function textToSpeech(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'text' => 'required|string|max:5000',
            'voice_name' => 'sometimes|string',
            'rate' => 'sometimes|string|in:x-slow,slow,medium,fast,x-fast',
            'pitch' => 'sometimes|string|in:x-low,low,medium,high,x-high',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $options = $request->only(['voice_name', 'rate', 'pitch']);
        $result = $this->speechService->textToSpeech($request->input('text'), $options);

        if ($result['success']) {
            return response($result['data'])
                ->header('Content-Type', $result['content_type'] ?? 'audio/mpeg')
                ->header('Content-Disposition', 'attachment; filename="speech.mp3"');
        } else {
            return response()->json([
                'success' => false,
                'error' => $result['error'],
                'message' => $result['message'],
            ], 500);
        }
    }

    /**
     * Get available voices
     *
     * @return JsonResponse
     */
    public function getVoices(): JsonResponse
    {
        $result = $this->speechService->getAvailableVoices();

        return response()->json([
            'success' => $result['success'],
            'data' => $result['voices'] ?? [],
            'error' => $result['error'] ?? null,
        ]);
    }

    /**
     * Get authentication token for client-side speech recognition
     *
     * @return JsonResponse
     */
    public function getAuthToken(): JsonResponse
    {
        $result = $this->speechService->getAuthToken();

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'data' => [
                    'token' => $result['token'],
                    'region' => $result['region'],
                    'language' => $result['language'],
                ],
            ]);
        } else {
            return response()->json([
                'success' => false,
                'error' => $result['error'],
                'message' => $result['message'] ?? 'Failed to get authentication token',
            ], 500);
        }
    }

    /**
     * Test the speech service configuration
     *
     * @return JsonResponse
     */
    public function testConfiguration(): JsonResponse
    {
        try {
            // Test basic configuration
            $configStatus = $this->speechService->getConfigStatus();

            if (!$configStatus['configured']) {
                return response()->json([
                    'success' => false,
                    'error' => 'Configuration incomplete',
                    'message' => 'Azure Speech Service is not properly configured',
                    'config_status' => $configStatus,
                ], 500);
            }

            // Test API connectivity with a simple text-to-speech request
            $testResult = $this->speechService->textToSpeech('Hola, esto es una prueba del servicio de voz de Azure.');

            if ($testResult['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Azure Speech Service is working correctly',
                    'config_status' => $configStatus,
                    'test_result' => 'Text-to-speech test passed',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => 'API test failed',
                    'message' => $testResult['message'],
                    'config_status' => $configStatus,
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Speech service test error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'Test failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convert speech to text using Whisper
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function speechToText(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'audio' => 'required|file|mimes:webm,mp3,wav,m4a|max:25000', // 25MB max
            'language' => 'sometimes|string|in:es,en,fr,de,it,pt,ja,ko,zh'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors(),
            ], 400);
        }

        try {
            $audioFile = $request->file('audio');
            $language = $request->get('language', 'es');

            $result = $this->whisperService->transcribeAudio($audioFile, $language);

            if (isset($result['error'])) {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'],
                ], 500);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'text' => $result['text'],
                    'language' => $language,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error en speech-to-text: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * Test OpenAI Whisper API connection
     *
     * @return JsonResponse
     */
    public function testWhisper(): JsonResponse
    {
        try {
            // Test API connectivity
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openai.key'),
            ])->get('https://api.openai.com/v1/models');

            if ($response->successful()) {
                $models = $response->json();
                $whisperModel = collect($models['data'])->firstWhere('id', 'whisper-1');

                return response()->json([
                    'success' => true,
                    'message' => 'OpenAI API connection successful',
                    'data' => [
                        'api_connected' => true,
                        'whisper_available' => $whisperModel ? true : false,
                        'api_key_configured' => config('services.openai.key') ? true : false,
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'OpenAI API connection failed',
                    'error' => $response->body(),
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error testing OpenAI API',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
