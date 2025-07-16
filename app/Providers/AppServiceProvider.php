<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use App\Services\WhisperService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(WhisperService::class, function ($app) {
            return new WhisperService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Schema::defaultStringLength(191);
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
