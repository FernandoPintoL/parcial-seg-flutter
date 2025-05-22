<?php

namespace App\Http\Controllers;

use App\Models\Pizarra;
use App\Models\WhiteboardActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WhiteboardActivityController extends Controller
{
    /**
     * Get whiteboard activities for a specific form.
     */
    public function getFormActivities(Request $request, $pizarraId)
    {
        // Find the form
        $pizarra = Pizarra::findOrFail($pizarraId);

        // Check if user has access to this form
        $this->authorizeAccess($pizarra);

        // Get whiteboard activities for this form
        $activities = $pizarra->whiteboardActivities()
            ->with('user:id,name,email')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($activities);
    }

    /**
     * Store a new whiteboard activity.
     */
    public function storeActivity(Request $request)
    {
        $validated = $request->validate([
            'form_id' => 'required|exists:form_builders,id',
            'action_type' => 'required|string',
            'action_data' => 'nullable|json',
            'description' => 'nullable|string',
        ]);

        // Find the form
        $form = Pizarra::findOrFail($validated['form_id']);

        // Check if user has access to this form
        $this->authorizeAccess($form);

        // Create the whiteboard activity
        $activity = WhiteboardActivity::create([
            'form_id' => $validated['form_id'],
            'user_id' => Auth::id(),
            'action_type' => $validated['action_type'],
            'action_data' => $validated['action_data'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);

        // Load the user relationship
        $activity->load('user:id,name,email');

        return response()->json($activity, 201);
    }

    /**
     * Check if the current user has access to the form.
     */
    private function authorizeAccess(Pizarra $pizarra)
    {
        $user = Auth::user();

        // Check if user is authenticated
        if (!$user) {
            abort(401, 'Unauthenticated. Please log in to access this resource.');
        }

        // Check if user is the owner
        if ($pizarra->user_id === $user->id) {
            return true;
        }

        // Check if user is a collaborator with accepted status
        $isCollaborator = $pizarra->collaborators()
            ->wherePivot('user_id', $user->id)
            ->wherePivot('status', 'accepted')
            ->exists();

        if (!$isCollaborator) {
            abort(403, 'You do not have access to this form\'s whiteboard activities.');
        }

        return true;
    }
}
