<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Engagement extends Model
{
    use HasFactory;
    protected $fillable = ['title', 'description', 'status', 'start_date', 'end_date'];

    public function movs() { return $this->hasMany(Mov::class); }
    public function documents() { return $this->hasMany(Document::class); }
    public function users() { return $this->belongsToMany(User::class)->withPivot('role_in_engagement')->withTimestamps(); }
}
