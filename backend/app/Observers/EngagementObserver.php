<?php

namespace App\Observers;

use App\Models\Engagement;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class EngagementObserver
{
    /**
     * Handle the Engagement "updated" event.
     */
    public function updated(Engagement $engagement)
    {
        if ($engagement->wasChanged('status')) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'engagement_id' => $engagement->id,
                'entity_type' => Engagement::class,
                'entity_id' => $engagement->id,
                'action_type' => 'status_change',
                'description' => "Engagement Status changed from '{$engagement->getOriginal('status')}' to '{$engagement->status}'.",
                'old_values' => ['status' => $engagement->getOriginal('status')],
                'new_values' => ['status' => $engagement->status],
            ]);
        }
    }
}
