<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WhisperService;
use Illuminate\Support\Facades\Storage;

class TestWhisperCommand extends Command
{
    protected $signature = 'test:whisper';
    protected $description = 'Test OpenAI Whisper API connection';

    public function handle()
    {
        $this->info('Testing OpenAI Whisper API connection...');
        
        // Check if API key is configured
        if (!config('services.openai.key')) {
            $this->error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
            return 1;
        }
        
        $this->info('✓ OpenAI API key found');
        
        // Test with a simple HTTP request to OpenAI
        $whisperService = app(WhisperService::class);
        
        // Create a simple test to verify API connectivity
        $this->info('Testing API connectivity...');
        
        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openai.key'),
            ])->get('https://api.openai.com/v1/models');
            
            if ($response->successful()) {
                $this->info('✓ OpenAI API connection successful');
                
                // Check if whisper model is available
                $models = $response->json();
                $whisperModel = collect($models['data'])->firstWhere('id', 'whisper-1');
                
                if ($whisperModel) {
                    $this->info('✓ Whisper model available');
                } else {
                    $this->warn('⚠ Whisper model not found in available models');
                }
                
                return 0;
            } else {
                $this->error('✗ OpenAI API connection failed: ' . $response->status());
                $this->error('Response: ' . $response->body());
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('✗ Error testing API: ' . $e->getMessage());
            return 1;
        }
    }
}
