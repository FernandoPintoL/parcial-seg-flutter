<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AzureSpeechService
{
    protected $apiKey;
    protected $region;
    protected $language;

    public function __construct()
    {
        $this->apiKey = config('services.azure.speech.api_key');
        $this->region = config('services.azure.speech.region');
        $this->language = config('services.azure.speech.language');
    }

    /**
     * Validate that all required configuration is present
     *
     * @return bool
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->region) && !empty($this->language);
    }

    /**
     * Get the configuration status
     *
     * @return array
     */
    public function getConfigStatus(): array
    {
        return [
            'configured' => $this->isConfigured(),
            'api_key_set' => !empty($this->apiKey),
            'region_set' => !empty($this->region),
            'language_set' => !empty($this->language),
            'region' => $this->region,
            'language' => $this->language,
        ];
    }

    /**
     * Convert text to speech using Azure Speech Services
     *
     * @param string $text The text to convert to speech
     * @param array $options Additional options for the API call
     * @return array The response from the API
     */
    public function textToSpeech(string $text, array $options = []): array
    {
        try {
            if (!$this->isConfigured()) {
                return [
                    'success' => false,
                    'error' => 'Azure Speech Service not configured',
                    'message' => 'Missing API key, region, or language configuration',
                ];
            }

            // Default options
            $defaultOptions = [
                'voice_name' => 'es-ES-ElviraNeural', // Spanish voice
                'output_format' => 'audio-16khz-32kbitrate-mono-mp3',
                'rate' => 'medium',
                'pitch' => 'medium',
            ];

            $requestOptions = array_merge($defaultOptions, $options);

            // Create SSML
            $ssml = $this->createSSML($text, $requestOptions);

            // Azure Speech API endpoint
            $endpoint = "https://{$this->region}.tts.speech.microsoft.com/cognitiveservices/v1";

            $response = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $this->apiKey,
                'Content-Type' => 'application/ssml+xml',
                'X-Microsoft-OutputFormat' => $requestOptions['output_format'],
                'User-Agent' => 'Laravel-AzureSpeech/1.0',
            ])->post($endpoint, $ssml);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->body(),
                    'content_type' => $response->header('Content-Type'),
                ];
            } else {
                Log::error('Azure Speech API error: ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'API request failed: ' . $response->status(),
                    'message' => $response->body(),
                ];
            }
        } catch (\Exception $e) {
            Log::error('Azure Speech service error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Service error',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create SSML markup for text-to-speech
     *
     * @param string $text The text to convert
     * @param array $options Voice options
     * @return string The SSML markup
     */
    protected function createSSML(string $text, array $options): string
    {
        $voiceName = $options['voice_name'] ?? 'es-ES-ElviraNeural';
        $rate = $options['rate'] ?? 'medium';
        $pitch = $options['pitch'] ?? 'medium';

        return sprintf(
            '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="%s">
                <voice name="%s">
                    <prosody rate="%s" pitch="%s">%s</prosody>
                </voice>
            </speak>',
            $this->language,
            $voiceName,
            $rate,
            $pitch,
            htmlspecialchars($text, ENT_XML1, 'UTF-8')
        );
    }

    /**
     * Get available voices for the configured language
     *
     * @return array List of available voices
     */
    public function getAvailableVoices(): array
    {
        try {
            if (!$this->isConfigured()) {
                return [
                    'success' => false,
                    'error' => 'Azure Speech Service not configured',
                    'voices' => [],
                ];
            }

            $endpoint = "https://{$this->region}.tts.speech.microsoft.com/cognitiveservices/voices/list";

            $response = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $this->apiKey,
            ])->get($endpoint);

            if ($response->successful()) {
                $voices = $response->json();
                
                // Filter voices by language
                $filteredVoices = array_filter($voices, function($voice) {
                    return strpos($voice['Locale'], substr($this->language, 0, 2)) === 0;
                });

                return [
                    'success' => true,
                    'voices' => array_values($filteredVoices),
                ];
            } else {
                Log::error('Azure Speech API error getting voices: ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'API request failed: ' . $response->status(),
                    'voices' => [],
                ];
            }
        } catch (\Exception $e) {
            Log::error('Azure Speech service error getting voices: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Service error',
                'voices' => [],
            ];
        }
    }

    /**
     * Get token for client-side speech recognition
     *
     * @return array The token response
     */
    public function getAuthToken(): array
    {
        try {
            if (!$this->isConfigured()) {
                return [
                    'success' => false,
                    'error' => 'Azure Speech Service not configured',
                    'token' => null,
                ];
            }

            $endpoint = "https://{$this->region}.api.cognitive.microsoft.com/sts/v1.0/issueToken";

            $response = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $this->apiKey,
                'Content-Type' => 'application/x-www-form-urlencoded',
            ])->post($endpoint);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'token' => $response->body(),
                    'region' => $this->region,
                    'language' => $this->language,
                ];
            } else {
                Log::error('Azure Speech API error getting token: ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'API request failed: ' . $response->status(),
                    'token' => null,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Azure Speech service error getting token: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Service error',
                'token' => null,
            ];
        }
    }
}
