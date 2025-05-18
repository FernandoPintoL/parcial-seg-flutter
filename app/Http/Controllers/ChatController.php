<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\FormBuilder;
use App\Http\Requests\StoreChatRequest;
use App\Http\Requests\UpdateChatRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ChatController extends Controller
{
    /**
     * Display the chat interface.
     */
    public function index()
    {
        return Inertia::render('Chat/Index');
    }

    /**
     * Get chat messages for a specific form.
     */
    public function getFormMessages(Request $request, $formId)
    {
        // Find the form
        $form = FormBuilder::findOrFail($formId);

        // Check if user has access to this form
        $this->authorizeAccess($form);

        // Get chat messages for this form
        $messages = $form->chatMessages()
            ->with('user:id,name,email')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Store a new chat message.
     */
    public function storeMessage(Request $request)
    {
        $validated = $request->validate([
            'form_id' => 'required|exists:form_builders,id',
            'message' => 'required|string',
            'is_system_message' => 'boolean',
        ]);

        // Find the form
        $form = FormBuilder::findOrFail($validated['form_id']);

        // Check if user has access to this form
        $this->authorizeAccess($form);

        // Create the chat message
        $message = Chat::create([
            'form_id' => $validated['form_id'],
            'user_id' => Auth::id(),
            'message' => $validated['message'],
            'is_system_message' => $validated['is_system_message'] ?? false,
        ]);

        // Load the user relationship
        $message->load('user:id,name,email');

        return response()->json($message, 201);
    }

    /**
     * Check if the current user has access to the form.
     */
    private function authorizeAccess(FormBuilder $form)
    {
        $user = Auth::user();

        // Check if user is the owner
        if ($form->user_id === $user->id) {
            return true;
        }

        // Check if user is a collaborator with accepted status
        $isCollaborator = $form->collaborators()
            ->wherePivot('user_id', $user->id)
            ->wherePivot('status', 'accepted')
            ->exists();

        if (!$isCollaborator) {
            abort(403, 'You do not have access to this form\'s chat.');
        }

        return true;
    }
}
