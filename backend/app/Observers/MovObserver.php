<?php

namespace App\Observers;

use App\Models\Mov;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class MovObserver
{
    /**
     * Handle the Mov "created" event.
     */
    public function created(Mov $mov)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'engagement_id' => $mov->engagement_id,
            'entity_type' => Mov::class,
            'entity_id' => $mov->id,
            'action_type' => 'created',
            'description' => "Created MOV Request: " . $mov->requirement_name,
            'new_values' => $mov->toArray(),
        ]);
    }

    /**
     * Handle the Mov "updated" event.
     */
    public function updated(Mov $mov)
    {
        if ($mov->wasChanged('status') || $mov->wasChanged('management_comment')) {
            $desc = "Updated MOV: " . $mov->requirement_name;
            if ($mov->wasChanged('status')) {
                if ($mov->status === 'submitted') {
                    $desc = "Auditee submitted MOV: " . $mov->requirement_name;
                } else {
                    $desc = "MOV Status marked as " . $mov->status;
                }
            }
            
            ActivityLog::create([
                'user_id' => Auth::id(),
                'engagement_id' => $mov->engagement_id,
                'entity_type' => Mov::class,
                'entity_id' => $mov->id,
                'action_type' => 'updated',
                'description' => $desc,
                'old_values' => $mov->getOriginal(),
                'new_values' => $mov->getChanges(),
            ]);
        }
    }

    /**
     * Handle the Mov "deleted" event.
     */
    public function deleted(Mov $mov)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'engagement_id' => $mov->engagement_id,
            'entity_type' => Mov::class,
            'entity_id' => $mov->id,
            'action_type' => 'deleted',
            'description' => "Deleted MOV Request: " . $mov->requirement_name,
            'old_values' => $mov->toArray(),
        ]);
    }
}
