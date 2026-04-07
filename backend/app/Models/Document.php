<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;
    protected $fillable = ['engagement_id', 'uploaded_by', 'file_name', 'file_path', 'status', 'signed_by', 'document_type', 'phase', 'reviewed_by', 'approved_by', 'form_data'];

    public function engagement() { return $this->belongsTo(Engagement::class); }
    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
    public function signer() { return $this->belongsTo(User::class, 'signed_by'); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
    public function history() { return $this->hasMany(DocumentHistory::class); }
}
