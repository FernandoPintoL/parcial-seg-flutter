<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AzureService
{
    protected $apiKey;
    protected $apiUrl;
    protected $modelName;
    protected $deploymentName;

    public function __construct()
    {
        $this->apiKey = env('AZURE_API_KEY');
        $this->apiUrl = env('AZURE_API_URL');
        $this->modelName = env('AZURE_MODEL_NAME', 'gpt-4.1');
        $this->deploymentName = env('AZURE_DEPLOYMENT_NAME', 'gpt-4.1');
    }

    /**
     * Validate that all required configuration is present
     *
     * @return bool
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->apiUrl) && !empty($this->modelName) && !empty($this->deploymentName);
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
            'api_url_set' => !empty($this->apiUrl),
            'model_name_set' => !empty($this->modelName),
            'deployment_name_set' => !empty($this->deploymentName),
            'model_name' => $this->modelName,
            'deployment_name' => $this->deploymentName,
        ];
    }

    /**
     * Generate a response from Azure OpenAI
     *
     * @param string $prompt The prompt to send to the AI
     * @param array $options Additional options for the API call
     * @return array The response from the AI
     */
    public function generateResponse(string $prompt, array $options = [])
    {
        try {
            if (!$this->isConfigured()) {
                return [
                    'success' => false,
                    'error' => 'Azure OpenAI Service not configured',
                    'message' => 'Missing API key, URL, model name, or deployment name configuration',
                ];
            }

            $defaultOptions = [
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ];

            $requestOptions = array_merge($defaultOptions, $options);

            // Azure OpenAI API endpoint format
            $endpoint = rtrim($this->apiUrl, '/') . '/openai/deployments/' . $this->deploymentName . '/chat/completions?api-version=2023-05-15';

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'api-key' => $this->apiKey
            ])->post($endpoint, $requestOptions);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            } else {
                Log::error('Azure OpenAI API error: ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'API request failed: ' . $response->status(),
                    'message' => $response->json()['error']['message'] ?? 'Unknown error',
                ];
            }
        } catch (\Exception $e) {
            Log::error('Azure service error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Service error',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Generate Flutter UI code based on a prompt
     *
     * @param string $prompt The prompt describing the UI to generate
     * @return array The response containing Flutter code
     */
    public function generateFlutterUI(string $prompt)
    {
        $enhancedPrompt = "Generate Flutter UI code for the following description. The code should be a complete StatelessWidget class that can be directly copied and pasted into a Dart file. Include necessary imports and make sure the code is properly formatted with correct indentation. The StatelessWidget should have a build method that returns a Scaffold with an AppBar and the described UI in the body. Description: " . $prompt;

        return $this->generateResponse($enhancedPrompt, [
            'temperature' => 0.5, // Lower temperature for more deterministic code generation
            'max_tokens' => 2000, // Allow more tokens for code generation
        ]);
    }

    /**
     * Parse Flutter code from AI response
     *
     * @param array $response The response from the AI
     * @return array The parsed Flutter widgets
     */
    public function parseFlutterWidgets(array $response)
    {
        if (!isset($response['success']) || !$response['success']) {
            return [
                'success' => false,
                'error' => $response['error'] ?? 'Unknown error',
                'message' => $response['message'] ?? 'Failed to parse Flutter widgets',
            ];
        }

        try {
            // Extract the content from the response
            // Azure OpenAI response format is different from Gemini
            $content = $response['data']['choices'][0]['message']['content'] ?? '';

            // Extract code blocks from markdown
            preg_match_all('/```dart\s*([\s\S]*?)\s*```/', $content, $matches);

            if (empty($matches[1])) {
                // If no dart code blocks, try to extract any code blocks
                preg_match_all('/```\s*([\s\S]*?)\s*```/', $content, $matches);
            }

            $code = implode("\n", $matches[1] ?? []);

            if (empty($code)) {
                // If still no code blocks, use the entire content
                $code = $content;
            }

            // Convert the Flutter code to a format compatible with our Pizarra component
            $widgets = $this->convertFlutterCodeToWidgets($code);

            return [
                'success' => true,
                'widgets' => $widgets,
                'rawCode' => $code,
            ];
        } catch (\Exception $e) {
            Log::error('Error parsing Flutter widgets: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Parsing error',
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Convert Flutter code to widgets compatible with Pizarra
     *
     * @param string $code The Flutter code
     * @return array The widgets
     */
    protected function convertFlutterCodeToWidgets(string $code)
    {
        // This is a simplified implementation
        // In a real-world scenario, you would need a more sophisticated parser

        $widgets = [];
        $widgetId = 1;

        // Extract basic widgets
        if (preg_match('/Scaffold\s*\(/i', $code)) {
            $widgets[] = [
                'id' => 'widget-' . $widgetId++,
                'type' => 'Container',
                'props' => [
                    'width' => 300,
                    'height' => 500,
                    'color' => '#FFFFFF',
                ],
                'children' => [],
            ];
        }

        // Extract Text widgets
        preg_match_all('/Text\s*\(\s*[\'"]([^\'"]*)[\'"]/', $code, $textMatches);
        foreach ($textMatches[1] as $text) {
            $widgets[] = [
                'id' => 'widget-' . $widgetId++,
                'type' => 'Text',
                'props' => [
                    'data' => $text,
                    'style' => 'TextStyle(fontSize: 16.0)',
                ],
            ];
        }

        // Extract TextField widgets
        if (preg_match_all('/TextField\s*\(/i', $code, $matches)) {
            for ($i = 0; $i < count($matches[0]); $i++) {
                $widgets[] = [
                    'id' => 'widget-' . $widgetId++,
                    'type' => 'TextField',
                    'props' => [
                        'decoration' => 'InputDecoration(labelText: "Input Field")',
                        'controller' => 'TextEditingController()',
                    ],
                ];
            }
        }

        // Extract Button widgets
        if (preg_match_all('/ElevatedButton|TextButton|OutlinedButton/i', $code, $matches)) {
            for ($i = 0; $i < count($matches[0]); $i++) {
                $widgets[] = [
                    'id' => 'widget-' . $widgetId++,
                    'type' => 'Container',
                    'props' => [
                        'width' => 150,
                        'height' => 50,
                        'color' => '#2196F3',
                        'padding' => 'EdgeInsets.all(8.0)',
                    ],
                    'children' => [
                        [
                            'id' => 'widget-' . $widgetId++,
                            'type' => 'Text',
                            'props' => [
                                'data' => 'Button',
                                'style' => 'TextStyle(fontSize: 16.0, color: Colors.white)',
                            ],
                        ],
                    ],
                ];
            }
        }

        // If no widgets were extracted, create a default Text widget with the code
        if (empty($widgets)) {
            $widgets[] = [
                'id' => 'widget-' . $widgetId++,
                'type' => 'Text',
                'props' => [
                    'data' => 'AI generated code (see console for details)',
                    'style' => 'TextStyle(fontSize: 16.0)',
                ],
            ];
        }

        return $widgets;
    }
}
