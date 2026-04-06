<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mov extends Model
{
    use HasFactory;
    protected $fillable = ['engagement_id', 'auditee_id', 'requirement_name', 'status', 'management_comment'];

    public function engagement() { return $this->belongsTo(Engagement::class); }
    public function auditee() { return $this->belongsTo(User::class, 'auditee_id'); }
}
