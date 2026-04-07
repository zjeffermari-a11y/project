<?php

namespace App\Observers;

use App\Models\Document;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class DocumentObserver
{
    /**
     * Handle the Document "creating" event.
     * Auto-assign reviewer based on Engagement hierarchy (Lead Auditor or Division Chief).
     */
    public function creating(Document $document)
    {
        if (empty($document->reviewed_by)) {
            $engagement = $document->engagement;
            if ($engagement) {
                // Find a reviewer in the engagement users (Division Chief or Lead Auditor)
                $reviewer = $engagement->users()->wherePivot('role_in_engagement', 'division_chief')->first()
                            ?? $engagement->users()->wherePivot('role_in_engagement', 'lead_auditor')->first();
                
                if ($reviewer) {
                    $document->reviewed_by = $reviewer->id;
                }
            }
        }
    }

    /**
     * Handle the Document "created" event.
     */
    public function created(Document $document)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'engagement_id' => $document->engagement_id,
            'entity_type' => Document::class,
            'entity_id' => $document->id,
            'action_type' => 'created',
            'description' => "Uploaded " . $document->document_type . " ({$document->file_name})",
            'new_values' => $document->toArray(),
        ]);
        
        $this->updateEngagementStatus($document);
    }

    /**
     * Handle the Document "updated" event.
     */
    public function updated(Document $document)
    {
        // Don't track if the only change is updated_at
        if ($document->wasChanged() && count($document->getChanges()) > 1) {
            $desc = "Updated " . $document->document_type;
            if ($document->wasChanged('status')) {
                $desc = "Marked " . $document->document_type . " as " . $document->status;
            } elseif ($document->wasChanged('reviewed_by')) {
                $desc = "Assigned reviewer for " . $document->document_type;
            } elseif ($document->wasChanged('approved_by')) {
                $desc = "Approved " . $document->document_type;
            }
            
            ActivityLog::create([
                'user_id' => Auth::id() ?? $document->uploaded_by,
                'engagement_id' => $document->engagement_id,
                'entity_type' => Document::class,
                'entity_id' => $document->id,
                'action_type' => 'updated',
                'description' => $desc,
                'old_values' => $document->getOriginal(),
                'new_values' => $document->getChanges(),
            ]);
            
            $this->updateEngagementStatus($document);
        }
    }

    /**
     * Handle the Document "deleted" event.
     */
    public function deleted(Document $document)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'engagement_id' => $document->engagement_id,
            'entity_type' => Document::class,
            'entity_id' => $document->id,
            'action_type' => 'deleted',
            'description' => "Deleted " . $document->document_type,
            'old_values' => $document->toArray(),
        ]);
    }
    
    /**
     * Automatically advance Engagement status if appropriate.
     */
    private function updateEngagementStatus(Document $document)
    {
        $engagement = $document->engagement;
        if (!$engagement) return;
        
        $currentStatus = $engagement->status;
        $filePhase = $document->phase; // 'planning', 'execution', 'reporting', 'followup'
        
        $phaseRanking = ['planning' => 1, 'execution' => 2, 'reporting' => 3, 'follow_up' => 4, 'completed' => 5];
        $fileRank = $phaseRanking[$filePhase === 'followup' ? 'follow_up' : $filePhase] ?? 0;
        $currentRank = $phaseRanking[$currentStatus] ?? 0;
        
        // Advance status if a document of a higher phase is created/uploaded
        if ($fileRank > $currentRank) {
            $engagement->status = ($filePhase === 'followup' ? 'follow_up' : $filePhase);
            $engagement->save(); // This will trigger EngagementObserver to log the status change
        }
    }
}
