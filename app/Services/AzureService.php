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
    protected $openaiApiKey;
    protected $openaiBaseUrl;

    public function __construct()
    {
        // Azure configuration
        $this->apiKey = config('services.azure.openai.api_key');
        $this->apiUrl = config('services.azure.openai.api_url');
        $this->modelName = config('services.azure.openai.model_name', 'gpt-4.1');
        $this->deploymentName = config('services.azure.openai.deployment_name', 'gpt-4.1');

        // OpenAI configuration (for fallback)
        $this->openaiApiKey = config('services.openai.key');
        $this->openaiBaseUrl = 'https://api.openai.com/v1';
    }

    /**
     * Validate that all required Azure configuration is present
     *
     * @return bool
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->apiUrl) && !empty($this->modelName) && !empty($this->deploymentName);
    }

    /**
     * Validate that all required OpenAI configuration is present
     *
     * @return bool
     */
    public function isOpenAIConfigured(): bool
    {
        return !empty($this->openaiApiKey);
    }

    /**
     * Get the configuration status
     *
     * @return array
     */
    public function getConfigStatus(): array
    {
        return [
            'azure' => [
                'configured' => $this->isConfigured(),
                'api_key_set' => !empty($this->apiKey),
                'api_url_set' => !empty($this->apiUrl),
                'model_name_set' => !empty($this->modelName),
                'deployment_name_set' => !empty($this->deploymentName),
                'model_name' => $this->modelName,
                'deployment_name' => $this->deploymentName,
            ],
            'openai' => [
                'configured' => $this->isOpenAIConfigured(),
                'api_key_set' => !empty($this->openaiApiKey),
            ],
            'fallback_enabled' => $this->isConfigured() && $this->isOpenAIConfigured(),
        ];
    }

    /**
     * Generate a response from Azure OpenAI with fallback to OpenAI
     *
     * @param string $prompt The prompt to send to the AI
     * @param array $options Additional options for the API call
     * @return array The response from the AI
     */
    public function generateResponse(string $prompt, array $options = [])
    {
        // Try Azure first
        $azureResponse = $this->generateAzureResponse($prompt, $options);

        // If Azure succeeds, return the response
        if ($azureResponse['success']) {
            return $azureResponse;
        }

        // If Azure fails and OpenAI is configured, try OpenAI as fallback
        if ($this->isOpenAIConfigured()) {
            Log::info('Azure OpenAI API failed, falling back to OpenAI API');
            return $this->generateOpenAIResponse($prompt, $options);
        }

        // If OpenAI is not configured, return the Azure error
        return $azureResponse;
    }

    /**
     * Generate a response from Azure OpenAI
     *
     * @param string $prompt The prompt to send to the AI
     * @param array $options Additional options for the API call
     * @return array The response from the AI
     */
    private function generateAzureResponse(string $prompt, array $options = [])
    {
        try {
            if (!$this->isConfigured()) {
                return [
                    'success' => false,
                    'error' => 'Azure OpenAI Service not configured',
                    'message' => 'Missing API key, URL, model name, or deployment name configuration',
                    'provider' => 'azure',
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
                    'provider' => 'azure',
                ];
            } else {
                Log::error('Azure OpenAI API error: ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'API request failed: ' . $response->status(),
                    'message' => $response->json()['error']['message'] ?? 'Unknown error',
                    'provider' => 'azure',
                ];
            }
        } catch (\Exception $e) {
            Log::error('Azure service error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Service error',
                'message' => $e->getMessage(),
                'provider' => 'azure',
            ];
        }
    }

    /**
     * Generate a response from OpenAI (fallback)
     *
     * @param string $prompt The prompt to send to the AI
     * @param array $options Additional options for the API call
     * @return array The response from the AI
     */
    private function generateOpenAIResponse(string $prompt, array $options = [])
    {
        try {
            if (!$this->isOpenAIConfigured()) {
                return [
                    'success' => false,
                    'error' => 'OpenAI API not configured',
                    'message' => 'Missing API key configuration',
                    'provider' => 'openai',
                ];
            }

            $defaultOptions = [
                'model' => 'gpt-4o',  // Use a suitable OpenAI model
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ];

            // Merge options, but ensure we're using the OpenAI model format
            $requestOptions = array_merge($defaultOptions, $options);
            if (isset($requestOptions['model_name'])) {
                unset($requestOptions['model_name']);
            }
            if (isset($requestOptions['deployment_name'])) {
                unset($requestOptions['deployment_name']);
            }

            // OpenAI API endpoint
            $endpoint = $this->openaiBaseUrl . '/chat/completions';

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->openaiApiKey
            ])->post($endpoint, $requestOptions);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                    'provider' => 'openai',
                ];
            } else {
                Log::error('OpenAI API error: ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'API request failed: ' . $response->status(),
                    'message' => $response->json()['error']['message'] ?? 'Unknown error',
                    'provider' => 'openai',
                ];
            }
        } catch (\Exception $e) {
            Log::error('OpenAI service error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Service error',
                'message' => $e->getMessage(),
                'provider' => 'openai',
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
        $enhancedPrompt = "You are an expert in Flutter and Angular development. Generate a structured JSON response for the following UI description. 

REQUIRED JSON STRUCTURE:
{
    \"framework\": \"flutter\" | \"angular\",
    \"widgets\": [
        {
            \"type\": \"Widget_Type\",
            \"props\": {
                \"prop1\": \"value1\",
                \"prop2\": \"value2\"
            },
            \"children\": [],
            \"position\": {
                \"x\": number,
                \"y\": number
            }
        }
    ],
    \"explanation\": \"Detailed explanation of the generated widgets\",
    \"code\": \"Complete component code (optional)\"
}

FLUTTER WIDGETS AVAILABLE:
- TextFormField, ElevatedButton, TextButton, OutlinedButton
- DropdownButton, DropdownButtonFormField
- RadioListTile, Radio, CheckboxListTile, Checkbox
- Switch, SwitchListTile, Slider
- Text

ANGULAR COMPONENTS AVAILABLE:
- input (text, email, password, number, etc.)
- button, select, radio, checkbox, textarea
- switch, toggle, slider, range, datepicker

INSTRUCTIONS:
1. Auto-detect framework from the prompt or default to Flutter
2. Generate appropriate widgets with realistic properties
3. Add automatic positioning (spacing ~100px between widgets)
4. Include validation properties where appropriate
5. Provide clear explanations

User Request: " . $prompt;

        return $this->generateResponse($enhancedPrompt, [
            'temperature' => 0.3, // Lower temperature for more consistent JSON structure
            'max_tokens' => 2500, // Allow more tokens for detailed JSON
        ]);
    }

    /**
     * Generate Angular UI components based on a prompt
     *
     * @param string $prompt The prompt describing the UI to generate
     * @return array The response containing Angular code
     */
    public function generateAngularUI(string $prompt)
    {
        $enhancedPrompt = "You are an expert Angular developer. Generate a structured JSON response for Angular components based on the following description.

REQUIRED JSON STRUCTURE:
{
    \"framework\": \"angular\",
    \"widgets\": [
        {
            \"type\": \"input\" | \"button\" | \"select\" | \"radio\" | \"checkbox\" | \"textarea\" | \"switch\" | \"slider\" | \"datepicker\",
            \"props\": {
                \"type\": \"text|email|password|number|submit|button\",
                \"formControlName\": \"controlName\",
                \"placeholder\": \"Placeholder text\",
                \"class\": \"CSS classes\",
                \"required\": true|false,
                \"disabled\": \"expression\"
            },
            \"children\": [],
            \"position\": {
                \"x\": number,
                \"y\": number
            }
        }
    ],
    \"explanation\": \"Detailed explanation with Angular best practices\",
    \"code\": \"Complete Angular component TypeScript and HTML code\"
}

ANGULAR COMPONENTS GUIDELINES:
- Use Reactive Forms (FormControl, FormGroup)
- Include proper validation (Validators.required, Validators.email, etc.)
- Use Angular Material or Bootstrap classes
- Generate both TypeScript component code and HTML template
- Include proper event handlers and form submission
- Add accessibility attributes (aria-label, etc.)

User Request: " . $prompt;

        return $this->generateResponse($enhancedPrompt, [
            'temperature' => 0.3,
            'max_tokens' => 2500,
        ]);
    }

    /**
     * Generate UI components with automatic framework detection
     *
     * @param string $prompt The prompt describing the UI to generate
     * @return array The response containing UI code
     */
    public function generateUI(string $prompt)
    {
        // Simple framework detection based on keywords
        $promptLower = strtolower($prompt);
        $isAngular = strpos($promptLower, 'angular') !== false || 
                     strpos($promptLower, 'typescript') !== false || 
                     strpos($promptLower, 'reactive form') !== false ||
                     strpos($promptLower, 'formcontrol') !== false;

        if ($isAngular) {
            return $this->generateAngularUI($prompt);
        } else {
            return $this->generateFlutterUI($prompt);
        }
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
