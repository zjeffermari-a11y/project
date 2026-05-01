<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tool extends Model
{
    protected $fillable = ['engagement_id', 'tool_type', 'created_by'];

    public function engagement()
    {
        return $this->belongsTo(Engagement::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}