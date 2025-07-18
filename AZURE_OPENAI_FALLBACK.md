# Azure OpenAI Fallback Mechanism

## Overview

This document describes the implementation of a fallback mechanism for Azure OpenAI API requests. The system is designed to use Azure OpenAI as the primary service, but will automatically fall back to using OpenAI's API if Azure fails or is unavailable.

## How It Works

1. When a prompt is sent to the AI service, the system first attempts to use Azure OpenAI.
2. If Azure OpenAI succeeds, the response is returned immediately.
3. If Azure OpenAI fails (due to configuration issues, API errors, or service unavailability), the system checks if OpenAI is configured.
4. If OpenAI is configured, the system automatically falls back to using OpenAI's API with the same prompt.
5. The response includes a `provider` field that indicates which service was used ('azure' or 'openai').

## Configuration

Both Azure OpenAI and OpenAI need to be properly configured for the fallback mechanism to work:

### Azure OpenAI Configuration

In your `.env` file:

```
AZURE_API_KEY=your-azure-api-key
AZURE_API_URL=your-azure-api-url
AZURE_MODEL_NAME=gpt-4.1
AZURE_DEPLOYMENT_NAME=gpt-4.1
```

### OpenAI Configuration

In your `.env` file:

```
OPENAI_API_KEY=your-openai-api-key
```

## Implementation Details

The fallback mechanism is implemented in the `AzureService` class. The main components are:

1. **Configuration Checks**:
   - `isConfigured()` - Checks if Azure OpenAI is configured
   - `isOpenAIConfigured()` - Checks if OpenAI is configured
   - `getConfigStatus()` - Returns the configuration status of both services

2. **Response Generation**:
   - `generateResponse()` - The main method that tries Azure first, then falls back to OpenAI
   - `generateAzureResponse()` - Handles Azure API calls
   - `generateOpenAIResponse()` - Handles OpenAI API calls

3. **Error Handling**:
   - Both services have proper error handling and logging
   - The response includes detailed error information when both services fail

## Testing

A test suite is provided to verify the fallback mechanism:

```bash
php artisan test --filter=AzureFallbackTest
```

The test suite includes:

1. **Normal Flow Test**: Verifies that Azure OpenAI works correctly when properly configured.
2. **Fallback Flow Test**: Simulates Azure failure and verifies that the system falls back to OpenAI.
3. **Error Handling Test**: Simulates both services failing and verifies that the system returns appropriate error information.

## Example Usage

```php
$azureService = new AzureService();
$response = $azureService->generateResponse('Generate a Flutter UI for a login screen');

if ($response['success']) {
    $provider = $response['provider']; // 'azure' or 'openai'
    $data = $response['data'];
    // Process the response...
} else {
    $error = $response['error'];
    $message = $response['message'];
    // Handle the error...
}
```

## Troubleshooting

If you encounter issues with the fallback mechanism:

1. **Check Configuration**: Ensure both Azure OpenAI and OpenAI are properly configured in your `.env` file.
2. **Check Logs**: The system logs detailed error information when API calls fail.
3. **Run Tests**: Use the provided test suite to verify that the fallback mechanism is working correctly.
4. **Check API Keys**: Ensure your API keys are valid and have not expired.
5. **Check Service Status**: Verify that the Azure OpenAI and OpenAI services are operational.

## Benefits

1. **Increased Reliability**: The system continues to function even if Azure OpenAI is temporarily unavailable.
2. **Seamless Fallback**: Users experience no interruption in service when the system falls back to OpenAI.
3. **Transparent Provider Information**: The response includes information about which service was used.
4. **Comprehensive Error Handling**: The system provides detailed error information when both services fail.
