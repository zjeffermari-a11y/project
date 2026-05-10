<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Engagement extends Model
{
    use HasFactory;
    protected $fillable = ['ae_number', 'title', 'description', 'status', 'start_date', 'end_date', 'type_of_audit', 'phase_completions'];

    protected $casts = [
        'phase_completions' => 'array',
    ];

    public function movs() { return $this->hasMany(Mov::class); }
    public function documents() { return $this->hasMany(Document::class); }
    public function users() { return $this->belongsToMany(User::class)->withPivot('role_in_engagement')->withTimestamps(); }
}
