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

        $disk = config('filesystems.default');
        $path = $file->storeAs('documents', time() . '_' . $file->getClientOriginalName(), $disk);

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
        $disk = config('filesystems.default');
        
        if (!Storage::disk($disk)->exists($document->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }
        return Storage::disk($disk)->download($document->file_path, $document->file_name);
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

    public function assignReviewer(Request $request, Document $document)
    {
        if (Auth::user()->role !== 'auditor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reviewed_by' => 'nullable|exists:users,id',
            'approved_by' => 'nullable|exists:users,id'
        ]);

        $document->update($request->only(['reviewed_by', 'approved_by']));

        return response()->json($document->load(['uploader', 'signer', 'reviewer', 'approver']));
    }

    /**
     * Save the JSON form data for an interactive audit tool.
     * Creates a new document record or updates the existing one.
     */
    public function saveToolData(Request $request, $engagementId, $toolKey)
    {
        $request->validate([
            'form_data' => 'required|array',
            'document_type' => 'required|string',
            'phase' => 'required|string',
        ]);

        $document = Document::updateOrCreate(
            [
                'engagement_id' => $engagementId,
                'tool_key' => $toolKey,
                'uploaded_by' => Auth::id(),
            ],
            [
                'file_name' => strtoupper($toolKey) . '_' . $engagementId . '.json',
                'file_path' => '',
                'status' => 'draft',
                'document_type' => $request->document_type,
                'phase' => $request->phase,
                'form_data' => $request->form_data,
            ]
        );

        $document->history()->create([
            'performed_by' => Auth::id(),
            'action' => 'tool_saved',
            'notes' => 'Interactive tool form data saved.'
        ]);

        return response()->json($document->load(['uploader', 'history.performer']), 200);
    }

    /**
     * Get the latest saved JSON form data for an interactive audit tool.
     */
    public function getToolData($engagementId, $toolKey)
    {
        $document = Document::where('engagement_id', $engagementId)
            ->where('tool_key', $toolKey)
            ->latest()
            ->first();

        if (!$document) {
            return response()->json(['form_data' => null, 'message' => 'No saved data found.'], 404);
        }

        return response()->json([
            'form_data' => $document->form_data,
            'document' => $document->load(['uploader']),
        ]);
    }
}
