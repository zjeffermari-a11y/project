<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use Illuminate\Http\Request;

class ToolController extends Controller
{
    // GET /api/engagements/{id}/tools
    public function index($engagementId)
    {
        $tools = Tool::where('engagement_id', $engagementId)->get();
        return response()->json($tools);
    }

    // GET /api/engagements/{id}/tools/{type}
    public function show($engagementId, $type)
    {
        $tool = Tool::where('engagement_id', $engagementId)
            ->where('tool_type', $type)
            ->first();

        if (!$tool) {
            return response()->json(['message' => 'Tool not found'], 404);
        }

        return response()->json($tool);
    }

    // POST /api/engagements/{id}/tools
    public function store(Request $request, $engagementId)
    {
        $request->validate([
            'tool_type' => 'required|in:awp,movs,survey,flowchart,planning',
        ]);

        // Prevent duplicates
        $existing = Tool::where('engagement_id', $engagementId)
            ->where('tool_type', $request->tool_type)
            ->first();

        if ($existing) {
            return response()->json($existing, 200);
        }

        $tool = Tool::create([
            'engagement_id' => $engagementId,
            'tool_type' => $request->tool_type,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($tool, 201);
    }
}