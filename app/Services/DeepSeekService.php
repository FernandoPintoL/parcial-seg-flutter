<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeepSeekService
{
    protected $apiKey;
    protected $apiUrl;

    public function __construct()
    {
        $this->apiKey = env('DEEPSEEK_API_KEY');
        $this->apiUrl = env('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1');
    }

    /**
     * Generate a response from DeepSeek AI
     *
     * @param string $prompt The prompt to send to the AI
     * @param array $options Additional options for the API call
     * @return array The response from the AI
     */
    public function generateResponse(string $prompt, array $options = [])
    {
        try {
            $defaultOptions = [
                'model' => 'deepseek-chat',
                'messages' => [
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ];

            $requestOptions = array_merge($defaultOptions, $options);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/chat/completions', $requestOptions);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            } else {
                Log::error('DeepSeek API error: ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'API request failed: ' . $response->status(),
                    'message' => $response->json()['error']['message'] ?? 'Unknown error',
                ];
            }
        } catch (\Exception $e) {
            Log::error('DeepSeek service error: ' . $e->getMessage());
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
        $enhancedPrompt = "Generate Flutter UI code for the following description. Return only valid Dart code that can be used in a Flutter application. The code should be complete and ready to use. Description: " . $prompt;

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

            // Convert the Flutter code to a format compatible with our PizarraFlutter component
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
     * Convert Flutter code to widgets compatible with PizarraFlutter
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
