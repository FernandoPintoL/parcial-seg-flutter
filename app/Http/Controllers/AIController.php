<?php

namespace App\Http\Controllers;

use App\Services\AzureService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    protected $azureService;

    public function __construct(AzureService $azureService)
    {
        $this->azureService = $azureService;
    }

    /**
     * Generate Flutter UI code based on a prompt
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateFlutterUI(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'prompt' => 'required|string|min:10|max:1000',
        ]);

        try {
            // Generate Flutter UI code
            $response = $this->azureService->generateFlutterUI($validated['prompt']);

            // Parse the response to extract widgets
            $parsedResponse = $this->azureService->parseFlutterWidgets($response);

            if ($parsedResponse['success']) {
                return response()->json([
                    'success' => true,
                    'widgets' => $parsedResponse['widgets'],
                    'rawCode' => $parsedResponse['rawCode'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $parsedResponse['error'],
                    'message' => $parsedResponse['message'],
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error generating Flutter UI: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Server error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate a response from Azure OpenAI
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateResponse(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'prompt' => 'required|string|min:5|max:1000',
            'options' => 'nullable|array',
        ]);

        try {
            // Generate response
            $response = $this->azureService->generateResponse(
                $validated['prompt'],
                $validated['options'] ?? []
            );

            if ($response['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $response['data'],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $response['error'],
                    'message' => $response['message'],
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error generating AI response: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Server error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate UI components with JSON response (supports Flutter and Angular)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateUIComponents(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'prompt' => 'required|string|min:10|max:1000',
            'framework' => 'nullable|string|in:flutter,angular,auto',
        ]);

        try {
            $framework = $validated['framework'] ?? 'auto';
            
            // Generate UI components based on framework
            if ($framework === 'auto') {
                $response = $this->azureService->generateUI($validated['prompt']);
            } elseif ($framework === 'angular') {
                $response = $this->azureService->generateAngularUI($validated['prompt']);
            } else {
                $response = $this->azureService->generateFlutterUI($validated['prompt']);
            }

            // Try to parse the response as JSON
            if ($response['success'] && isset($response['data']['choices'][0]['message']['content'])) {
                $content = $response['data']['choices'][0]['message']['content'];
                
                // Parse JSON from the response
                $jsonResponse = $this->parseJSONResponse($content);
                
                if ($jsonResponse) {
                    return response()->json([
                        'success' => true,
                        'framework' => $jsonResponse['framework'] ?? $framework,
                        'widgets' => $jsonResponse['widgets'] ?? [],
                        'explanation' => $jsonResponse['explanation'] ?? '',
                        'code' => $jsonResponse['code'] ?? null,
                        'rawResponse' => $content,
                    ]);
                } else {
                    // Fallback to parsing as regular Flutter widgets
                    $parsedResponse = $this->azureService->parseFlutterWidgets($response);
                    
                    if ($parsedResponse['success']) {
                        return response()->json([
                            'success' => true,
                            'framework' => 'flutter',
                            'widgets' => $parsedResponse['widgets'],
                            'explanation' => 'Generated Flutter widgets (fallback parsing)',
                            'code' => $parsedResponse['rawCode'] ?? null,
                            'rawResponse' => $content,
                        ]);
                    }
                }
            }

            return response()->json([
                'success' => false,
                'error' => 'Failed to generate valid response',
                'message' => 'The AI service did not return a valid response',
            ], 500);

        } catch (\Exception $e) {
            Log::error('Error generating UI components: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Server error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Parse JSON response from AI
     *
     * @param string $content The AI response content
     * @return array|null The parsed JSON or null if parsing fails
     */
    private function parseJSONResponse(string $content): ?array
    {
        try {
            // Try to extract JSON from markdown code blocks
            if (preg_match('/```json\s*([\s\S]*?)\s*```/', $content, $matches)) {
                $jsonString = trim($matches[1]);
                $parsed = json_decode($jsonString, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $parsed;
                }
            }

            // Try to parse the entire content as JSON
            $parsed = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $parsed;
            }

            // Try to find JSON objects in the content
            if (preg_match('/{[\s\S]*"widgets"[\s\S]*}/', $content, $matches)) {
                $jsonString = $matches[0];
                // Clean up common JSON issues
                $jsonString = preg_replace('/,\s*}/', '}', $jsonString);
                $jsonString = preg_replace('/,\s*]/', ']', $jsonString);
                
                $parsed = json_decode($jsonString, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $parsed;
                }
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Error parsing JSON response: ' . $e->getMessage());
            return null;
        }
    }
}
