<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentHistory extends Model
{
    use HasFactory;
    protected $fillable = ['document_id', 'performed_by', 'action', 'notes'];

    public function document() { return $this->belongsTo(Document::class); }
    public function performer() { return $this->belongsTo(User::class, 'performed_by'); }
}
