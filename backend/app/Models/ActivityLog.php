<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'engagement_id',
        'entity_type',
        'entity_id',
        'action_type',
        'description',
        'old_values',
        'new_values'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function engagement()
    {
        return $this->belongsTo(Engagement::class);
    }

    public function entity()
    {
        return $this->morphTo();
    }
}
