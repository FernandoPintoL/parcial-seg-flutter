<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WhisperService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class TestWhisperTranscriptionCommand extends Command
{
    protected $signature = 'test:whisper-transcription';
    protected $description = 'Test OpenAI Whisper transcription with a sample audio file';

    public function handle()
    {
        $this->info('Testing OpenAI Whisper transcription...');
        
        $whisperService = app(WhisperService::class);
        
        // Download a sample audio file for testing
        $this->info('Downloading sample audio file...');
        
        try {
            // Create a simple text-to-speech request to get an audio file
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openai.key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/audio/speech', [
                'model' => 'tts-1',
                'input' => 'Hola, esta es una prueba de transcripción de audio.',
                'voice' => 'alloy',
                'response_format' => 'mp3'
            ]);
            
            if ($response->successful()) {
                // Save the audio file temporarily
                $audioPath = storage_path('app/temp_audio_test.mp3');
                file_put_contents($audioPath, $response->body());
                
                $this->info('✓ Sample audio file created');
                
                // Test transcription
                $this->info('Testing transcription...');
                
                $result = $whisperService->transcribeAudio($audioPath);
                
                if (isset($result['text'])) {
                    $this->info('✓ Transcription successful!');
                    $this->line('Transcribed text: ' . $result['text']);
                    
                    // Clean up
                    unlink($audioPath);
                    
                    return 0;
                } else {
                    $this->error('✗ Transcription failed: ' . json_encode($result));
                    return 1;
                }
            } else {
                $this->error('✗ Failed to create sample audio: ' . $response->status());
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('✗ Error: ' . $e->getMessage());
            return 1;
        }
    }
}
