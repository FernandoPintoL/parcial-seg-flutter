<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'organization' => env('OPENAI_ORGANIZATION'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'azure' => [
        'openai' => [
            'api_key' => env('AZURE_API_KEY'),
            'api_url' => env('AZURE_API_URL'),
            'model_name' => env('AZURE_MODEL_NAME', 'gpt-4.1'),
            'deployment_name' => env('AZURE_DEPLOYMENT_NAME', 'gpt-4.1'),
        ],
        'speech' => [
            'api_key' => env('AZURE_SPEECH_KEY'),
            'region' => env('AZURE_SPEECH_REGION', 'eastus2'),
            'language' => env('AZURE_SPEECH_LANGUAGE', 'es-ES'),
        ],
    ],
];
