<?php
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('login-api', [AuthController::class, 'login-api']);
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
