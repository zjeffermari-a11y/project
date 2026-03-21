<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Mov;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index($engagementId)
    {
        $documents = Document::with(['uploader', 'signer', 'history.performer'])
            ->where('engagement_id', $engagementId)
            ->get();

        return response()->json($documents);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'engagement_id' => 'required|exists:engagements,id',
            'file' => 'required|file',
            'document_type' => 'required|string',
            'phase' => 'required|string'
        ]);

        $file = $request->file('file');

        $path = $file->storeAs('documents', time() . '_' . $file->getClientOriginalName(), 'local');

        $document = Document::create([
            'engagement_id' => $request->engagement_id,
            'uploaded_by' => Auth::id(),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'status' => 'uploaded',
            'document_type' => $request->document_type,
            'phase' => $request->phase
        ]);

        $document->history()->create([
            'performed_by' => Auth::id(),
            'action' => 'uploaded',
            'notes' => 'Document initially uploaded.'
        ]);

        return response()->json($document->load(['uploader', 'signer', 'history.performer']), 201);
    }

    public function download(Document $document)
    {
        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }
        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    public function sign(Request $request, Document $document)
    {
        if (Auth::user()->role !== 'auditor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $document->update([
            'signed_by' => Auth::id(),
            'status' => 'signed'
        ]);

        $document->history()->create([
            'performed_by' => Auth::id(),
            'action' => 'signed',
            'notes' => 'Document signed and verified.'
        ]);

        return response()->json($document);
    }
}
