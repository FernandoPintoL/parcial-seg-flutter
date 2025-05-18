<?php

namespace App\Http\Controllers;

use GuzzleHttp\Client;
use Illuminate\Http\Request;

class FigmaController extends Controller
{
    private $figmaToken;

    public function __construct()
    {
        $this->figmaToken = env('FIGMA_API_TOKEN');
    }

    public function getFile($fileId)
    {
        $client = new Client();
        $response = $client->get("https://api.figma.com/v1/files/{$fileId}", [
            'headers' => [
                'Authorization' => "Bearer {$this->figmaToken}"
            ]
        ]);
        $fileData = json_decode($response->getBody(), true);

        return response()->json($fileData);
    }
}
