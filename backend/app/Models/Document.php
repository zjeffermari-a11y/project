<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;
    protected $fillable = ['engagement_id', 'uploaded_by', 'file_name', 'file_path', 'status', 'signed_by', 'document_type', 'phase'];

    public function engagement() { return $this->belongsTo(Engagement::class); }
    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
    public function signer() { return $this->belongsTo(User::class, 'signed_by'); }
    public function history() { return $this->hasMany(DocumentHistory::class); }
}
