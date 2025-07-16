<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestAzureKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'azure:test-keys';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test all Azure API keys configuration';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Testing Azure API Keys Configuration...');
        $this->newLine();

        // Test Azure OpenAI configuration
        $this->info('Azure OpenAI Configuration:');
        $this->table(
            ['Setting', 'Status', 'Value'],
            [
                ['API Key Set', env('AZURE_API_KEY') ? '✓ Yes' : '✗ No', env('AZURE_API_KEY') ? 'Set (length: ' . strlen(env('AZURE_API_KEY')) . ')' : 'Not set'],
                ['API URL Set', env('AZURE_API_URL') ? '✓ Yes' : '✗ No', env('AZURE_API_URL') ?: 'Not set'],
                ['Model Name', env('AZURE_MODEL_NAME') ? '✓ Yes' : '✗ No', env('AZURE_MODEL_NAME') ?: 'Not set'],
                ['Deployment Name', env('AZURE_DEPLOYMENT_NAME') ? '✓ Yes' : '✗ No', env('AZURE_DEPLOYMENT_NAME') ?: 'Not set'],
            ]
        );

        $this->newLine();
        
        // Test Azure Speech configuration
        $this->info('Azure Speech Configuration:');
        $this->table(
            ['Setting', 'Status', 'Value'],
            [
                ['Speech Key Set', env('AZURE_SPEECH_KEY') ? '✓ Yes' : '✗ No', env('AZURE_SPEECH_KEY') ? 'Set (length: ' . strlen(env('AZURE_SPEECH_KEY')) . ')' : 'Not set'],
                ['Speech Region', env('AZURE_SPEECH_REGION') ? '✓ Yes' : '✗ No', env('AZURE_SPEECH_REGION') ?: 'Not set'],
                ['Speech Language', env('AZURE_SPEECH_LANGUAGE') ? '✓ Yes' : '✗ No', env('AZURE_SPEECH_LANGUAGE') ?: 'Not set'],
            ]
        );

        $this->newLine();
        
        // Test Frontend (Vite) configuration
        $this->info('Frontend (Vite) Configuration:');
        $this->table(
            ['Setting', 'Status', 'Value'],
            [
                ['Vite Azure API Key', env('VITE_AZURE_API_KEY') ? '✓ Yes' : '✗ No', env('VITE_AZURE_API_KEY') ? 'Set (length: ' . strlen(env('VITE_AZURE_API_KEY')) . ')' : 'Not set'],
                ['Vite Azure API URL', env('VITE_AZURE_API_URL') ? '✓ Yes' : '✗ No', env('VITE_AZURE_API_URL') ?: 'Not set'],
                ['Vite Speech Key', env('VITE_AZURE_SPEECH_KEY') ? '✓ Yes' : '✗ No', env('VITE_AZURE_SPEECH_KEY') ? 'Set (length: ' . strlen(env('VITE_AZURE_SPEECH_KEY')) . ')' : 'Not set'],
                ['Vite Speech Region', env('VITE_AZURE_SPEECH_REGION') ? '✓ Yes' : '✗ No', env('VITE_AZURE_SPEECH_REGION') ?: 'Not set'],
                ['Vite Speech Language', env('VITE_AZURE_SPEECH_LANGUAGE') ? '✓ Yes' : '✗ No', env('VITE_AZURE_SPEECH_LANGUAGE') ?: 'Not set'],
            ]
        );

        $this->newLine();
        
        // Check if keys match
        $this->info('Key Consistency Check:');
        $azureKeyMatch = env('AZURE_API_KEY') === env('VITE_AZURE_API_KEY');
        $speechKeyMatch = env('AZURE_SPEECH_KEY') === env('VITE_AZURE_SPEECH_KEY');
        $speechRegionMatch = env('AZURE_SPEECH_REGION') === env('VITE_AZURE_SPEECH_REGION');
        $speechLanguageMatch = env('AZURE_SPEECH_LANGUAGE') === env('VITE_AZURE_SPEECH_LANGUAGE');
        
        $this->table(
            ['Check', 'Status'],
            [
                ['Azure API Key Match', $azureKeyMatch ? '✓ Match' : '✗ Mismatch'],
                ['Speech Key Match', $speechKeyMatch ? '✓ Match' : '✗ Mismatch'],
                ['Speech Region Match', $speechRegionMatch ? '✓ Match' : '✗ Mismatch'],
                ['Speech Language Match', $speechLanguageMatch ? '✓ Match' : '✗ Mismatch'],
            ]
        );

        $this->newLine();
        
        // Summary
        $allConfigured = env('AZURE_API_KEY') && env('AZURE_API_URL') && env('AZURE_MODEL_NAME') && env('AZURE_DEPLOYMENT_NAME') &&
                        env('AZURE_SPEECH_KEY') && env('AZURE_SPEECH_REGION') && env('AZURE_SPEECH_LANGUAGE') &&
                        env('VITE_AZURE_API_KEY') && env('VITE_AZURE_API_URL') &&
                        env('VITE_AZURE_SPEECH_KEY') && env('VITE_AZURE_SPEECH_REGION') && env('VITE_AZURE_SPEECH_LANGUAGE');
        
        $allMatching = $azureKeyMatch && $speechKeyMatch && $speechRegionMatch && $speechLanguageMatch;
        
        if ($allConfigured && $allMatching) {
            $this->info('🎉 All Azure API keys are properly configured and synchronized!');
            $this->info('✓ Backend Azure OpenAI: Configured');
            $this->info('✓ Backend Azure Speech: Configured');
            $this->info('✓ Frontend Azure OpenAI: Configured');
            $this->info('✓ Frontend Azure Speech: Configured');
            $this->info('✓ All keys are synchronized between backend and frontend');
        } else {
            $this->error('❌ Configuration issues found:');
            if (!$allConfigured) {
                $this->error('• Some API keys are missing');
            }
            if (!$allMatching) {
                $this->error('• Backend and frontend keys don\'t match');
            }
        }
        
        $this->newLine();
        $this->info('Notes:');
        $this->warn('• Azure OpenAI and Azure Speech are separate services and may use different API keys');
        $this->warn('• VITE_ prefixed variables are used by the frontend (Vue.js)');
        $this->warn('• Non-prefixed variables are used by the backend (Laravel)');
        $this->warn('• For security, frontend variables are exposed to the client');
        
        return $allConfigured && $allMatching ? 0 : 1;
    }
}
