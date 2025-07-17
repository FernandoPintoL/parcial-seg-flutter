<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class DebugPizarraRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log todas las peticiones relacionadas con pizarras
        if ($request->is('pizarra*')) {
            Log::info('Pizarra Request Debug', [
                'method' => $request->method(),
                'url' => $request->url(),
                'user_id' => auth()->id(),
                'input' => $request->all(),
                'headers' => $request->headers->all(),
                'session_id' => session()->getId(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now()->toDateTimeString(),
            ]);
        }

        $response = $next($request);

        // Log la respuesta también
        if ($request->is('pizarra*')) {
            Log::info('Pizarra Response Debug', [
                'status' => $response->getStatusCode(),
                'content_type' => $response->headers->get('content-type'),
                'response_size' => strlen($response->getContent()),
                'timestamp' => now()->toDateTimeString(),
            ]);
        }

        return $response;
    }
}
