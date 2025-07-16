<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhisperService
{
    private $apiKey;
    private $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.openai.key');
        $this->baseUrl = 'https://api.openai.com/v1';
    }

    public function transcribeAudio($audioFile, $language = 'es')
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->attach(
                'file', 
                file_get_contents($audioFile),
                'audio.webm'
            )->post($this->baseUrl . '/audio/transcriptions', [
                'model' => 'whisper-1',
                'language' => $language,
                'response_format' => 'json'
            ]);

            if ($response->successful()) {
                return $response->json();
            } else {
                Log::error('Whisper API Error: ' . $response->body());
                return ['error' => 'Error al transcribir audio'];
            }
        } catch (\Exception $e) {
            Log::error('Whisper Service Error: ' . $e->getMessage());
            return ['error' => 'Error en el servicio de transcripción'];
        }
    }
}
