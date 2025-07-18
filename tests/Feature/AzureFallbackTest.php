<?php

namespace Tests\Feature;

use App\Services\AzureService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class AzureFallbackTest extends TestCase
{
    /**
     * Test that the Azure service works correctly when Azure is configured.
     *
     * @return void
     */
    public function test_azure_service_works_when_azure_is_configured()
    {
        // This test assumes that Azure is properly configured in your environment
        // If it's not, the test will be skipped

        $azureService = new AzureService();
        $configStatus = $azureService->getConfigStatus();

        if (!$configStatus['azure']['configured']) {
            $this->markTestSkipped('Azure is not configured. Skipping test.');
        }

        $response = $azureService->generateResponse('Hello, how are you?');

        $this->assertTrue($response['success']);
        $this->assertEquals('azure', $response['provider']);
        $this->assertArrayHasKey('data', $response);
    }

    /**
     * Test that the Azure service falls back to OpenAI when Azure fails.
     *
     * @return void
     */
    public function test_azure_service_falls_back_to_openai_when_azure_fails()
    {
        // This test simulates Azure failing by providing an invalid Azure API key
        // It assumes that OpenAI is properly configured in your environment

        $azureService = new AzureService();
        $configStatus = $azureService->getConfigStatus();

        if (!$configStatus['openai']['configured']) {
            $this->markTestSkipped('OpenAI is not configured. Skipping test.');
        }

        // Temporarily override the Azure API key to force a failure
        Config::set('services.azure.openai.api_key', 'invalid-key');

        $response = $azureService->generateResponse('Hello, how are you?');

        $this->assertTrue($response['success']);
        $this->assertEquals('openai', $response['provider']);
        $this->assertArrayHasKey('data', $response);
    }

    /**
     * Test that the Azure service returns an error when both Azure and OpenAI fail.
     *
     * @return void
     */
    public function test_azure_service_returns_error_when_both_services_fail()
    {
        // This test simulates both Azure and OpenAI failing by providing invalid API keys

        // Temporarily override both API keys to force failures
        Config::set('services.azure.openai.api_key', 'invalid-key');
        Config::set('services.openai.key', 'invalid-key');

        $azureService = new AzureService();
        $response = $azureService->generateResponse('Hello, how are you?');

        $this->assertFalse($response['success']);
        $this->assertEquals('azure', $response['provider']); // Should return Azure error since it tries Azure first
        $this->assertArrayHasKey('error', $response);
    }
}
