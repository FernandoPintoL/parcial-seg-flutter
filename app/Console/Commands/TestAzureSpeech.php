<?php

namespace App\Console\Commands;

use App\Services\AzureSpeechService;
use Illuminate\Console\Command;

class TestAzureSpeech extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'azure:test-speech {--test-tts : Test text-to-speech functionality}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Azure Speech Service configuration and connectivity';

    protected $speechService;

    /**
     * Create a new command instance.
     *
     * @param AzureSpeechService $speechService
     */
    public function __construct(AzureSpeechService $speechService)
    {
        parent::__construct();
        $this->speechService = $speechService;
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Testing Azure Speech Service Configuration...');
        $this->newLine();

        // Test configuration
        $configStatus = $this->speechService->getConfigStatus();
        
        $this->info('Configuration Status:');
        $this->table(
            ['Setting', 'Status'],
            [
                ['API Key Set', $configStatus['api_key_set'] ? '✓ Yes' : '✗ No'],
                ['Region Set', $configStatus['region_set'] ? '✓ Yes' : '✗ No'],
                ['Language Set', $configStatus['language_set'] ? '✓ Yes' : '✗ No'],
                ['Region', $configStatus['region'] ?? 'Not set'],
                ['Language', $configStatus['language'] ?? 'Not set'],
                ['Overall Status', $configStatus['configured'] ? '✓ Configured' : '✗ Not Configured'],
            ]
        );

        if (!$configStatus['configured']) {
            $this->error('Azure Speech Service is not properly configured!');
            $this->warn('Please check your .env file and ensure the following variables are set:');
            $this->warn('- AZURE_SPEECH_KEY');
            $this->warn('- AZURE_SPEECH_REGION');
            $this->warn('- AZURE_SPEECH_LANGUAGE');
            return 1;
        }

        $this->newLine();
        $this->info('Testing API connectivity...');

        // Test getting auth token
        $tokenResult = $this->speechService->getAuthToken();
        
        if ($tokenResult['success']) {
            $this->info('✓ Authentication token retrieved successfully');
        } else {
            $this->error('✗ Failed to get authentication token: ' . $tokenResult['error']);
            return 1;
        }

        // Test getting voices
        $voicesResult = $this->speechService->getAvailableVoices();
        
        if ($voicesResult['success']) {
            $this->info('✓ Available voices retrieved successfully');
            $this->info('Found ' . count($voicesResult['voices']) . ' voices for the configured language');
            
            if (count($voicesResult['voices']) > 0) {
                $this->newLine();
                $this->info('Available voices:');
                $voiceData = [];
                foreach (array_slice($voicesResult['voices'], 0, 5) as $voice) {
                    $voiceData[] = [
                        $voice['Name'] ?? 'Unknown',
                        $voice['DisplayName'] ?? 'Unknown',
                        $voice['Gender'] ?? 'Unknown',
                        $voice['Locale'] ?? 'Unknown',
                    ];
                }
                $this->table(['Name', 'Display Name', 'Gender', 'Locale'], $voiceData);
                
                if (count($voicesResult['voices']) > 5) {
                    $this->info('... and ' . (count($voicesResult['voices']) - 5) . ' more voices');
                }
            }
        } else {
            $this->error('✗ Failed to get available voices: ' . $voicesResult['error']);
            return 1;
        }

        // Test text-to-speech if requested
        if ($this->option('test-tts')) {
            $this->newLine();
            $this->info('Testing text-to-speech functionality...');
            
            $testText = 'Hola, esto es una prueba del servicio de voz de Azure desde Laravel.';
            $ttsResult = $this->speechService->textToSpeech($testText);
            
            if ($ttsResult['success']) {
                $this->info('✓ Text-to-speech test successful');
                $this->info('Audio data length: ' . strlen($ttsResult['data']) . ' bytes');
                $this->info('Content type: ' . ($ttsResult['content_type'] ?? 'unknown'));
            } else {
                $this->error('✗ Text-to-speech test failed: ' . $ttsResult['error']);
                return 1;
            }
        }

        $this->newLine();
        $this->info('🎉 All tests passed! Azure Speech Service is working correctly.');
        $this->info('You can now use the speech service in your application.');
        
        return 0;
    }
}
