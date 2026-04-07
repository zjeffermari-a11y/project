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
    }
}
