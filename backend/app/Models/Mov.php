<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mov extends Model
{
    use HasFactory;
    protected $fillable = [
        'engagement_id', 
        'auditee_id', 
        'requirement_name', 
        'drive_link', 
        'status', 
        'auditee_response_1', 
        'auditee_response_2', 
        'auditee_response_3', 
        'management_comment'
    ];

    public function engagement() { return $this->belongsTo(Engagement::class); }
    public function auditee() { return $this->belongsTo(User::class, 'auditee_id'); }
}
