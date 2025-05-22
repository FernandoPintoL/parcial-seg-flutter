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
}
