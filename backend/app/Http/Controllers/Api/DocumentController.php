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
        $user = Auth::user();
        $allowedDesignations = ['director', 'division_chief', 'assistant_division_chief', 'lead_auditor'];
        if ($user->role !== 'auditor' && !in_array($user->designation, $allowedDesignations)) {
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

    /**
     * Record an AWP sign-off at a specific stage.
     * stage: prepared_by | reviewed_by | approved_by
     * This captures the signer's designation and name at the time of signing.
     */
    public function signOff(Request $request, Document $document)
    {
        $user = Auth::user();

        $request->validate([
            'stage' => 'required|in:prepared_by,reviewed_by,approved_by',
        ]);

        $stage = $request->stage;

        // Enforce role hierarchy: only approved designations can sign at each stage
        $stagePermissions = [
            'prepared_by'  => ['auditor', 'lead_auditor', 'assistant_division_chief', 'division_chief', 'director'],
            'reviewed_by'  => ['lead_auditor', 'assistant_division_chief', 'division_chief', 'director'],
            'approved_by'  => ['division_chief', 'assistant_division_chief', 'director'],
        ];

        $allowed = $stagePermissions[$stage];
        $userDesignationOrRole = $user->designation ?? $user->role;
        if (!in_array($userDesignationOrRole, $allowed)) {
            return response()->json([
                'message' => 'Your designation is not authorized to sign at the "' . str_replace('_', ' ', $stage) . '" stage.',
            ], 403);
        }

        // Determine the new document status based on stage
        $statusMap = [
            'prepared_by'  => 'prepared',
            'reviewed_by'  => 'reviewed',
            'approved_by'  => 'approved',
        ];

        $document->update(['status' => $statusMap[$stage]]);

        // Record the sign-off with designation snapshot
        $historyEntry = $document->history()->create([
            'performed_by'  => $user->id,
            'action'        => 'signed_off',
            'stage'         => $stage,
            'designation'   => $user->designation ?? $user->role,
            'signer_name'   => $user->name,
            'notes'         => 'AWP sign-off recorded at stage: ' . str_replace('_', ' ', $stage),
        ]);

        return response()->json([
            'message'  => 'Sign-off recorded successfully.',
            'stage'    => $stage,
            'document' => $document->load(['uploader', 'history.performer']),
            'history'  => $historyEntry,
        ]);
    }

    public function assignReviewer(Request $request, Document $document)
    {
        $user = Auth::user();
        $allowedDesignations = ['director', 'division_chief', 'assistant_division_chief', 'lead_auditor'];
        if ($user->role !== 'auditor' && !in_array($user->designation, $allowedDesignations)) {
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
     * Creates a new document record every time (versioning/multi-draft).
     */
    public function saveToolData(Request $request, $engagementId, $toolKey)
    {
        $request->validate([
            'form_data' => 'required|array',
            'document_type' => 'required|string',
            'phase' => 'required|string',
        ]);

        // We use create() instead of updateOrCreate() to support multiple drafts
        $document = Document::create([
            'engagement_id' => $engagementId,
            'tool_key' => $toolKey,
            'uploaded_by' => Auth::id(),
            'file_name' => strtoupper($toolKey) . '_' . $engagementId . '_' . time() . '.json',
            'file_path' => '',
            'status' => 'draft',
            'document_type' => $request->document_type,
            'phase' => $request->phase,
            'form_data' => $request->form_data,
        ]);

        // Log history
        $document->history()->create([
            'performed_by' => Auth::id(),
            'action' => 'saved_draft',
            'notes' => 'Saved ' . $toolKey . ' draft version'
        ]);

        return response()->json($document->load(['uploader', 'history.performer']), 201);
    }

    /**
     * Get all saved versions for a specific tool in an engagement.
     */
    public function getToolVersions($engagementId, $toolKey)
    {
        $versions = Document::where('engagement_id', $engagementId)
            ->where('tool_key', $toolKey)
            ->whereNotNull('form_data')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'file_name', 'created_at', 'status']);

        return response()->json($versions);
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
