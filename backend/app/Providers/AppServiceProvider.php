<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Models\Document;
use App\Models\Engagement;
use App\Models\Mov;
use App\Observers\DocumentObserver;
use App\Observers\EngagementObserver;
use App\Observers\MovObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Document::observe(DocumentObserver::class);
        Engagement::observe(EngagementObserver::class);
        Mov::observe(MovObserver::class);

        // Register the Microsoft Azure Socialite provider for Microsoft 365 SSO.
        // The Google provider ships with laravel/socialite and needs no registration.
        $this->app['events']->listen(
            \SocialiteProviders\Manager\SocialiteWasCalled::class,
            \SocialiteProviders\Azure\AzureExtendSocialite::class . '@handle'
        );
    }
}
