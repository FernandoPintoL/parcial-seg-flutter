<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Http\Requests\StoreChatRequest;
use App\Http\Requests\UpdateChatRequest;
use App\Models\Pizarra;
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
    }

    /**
     * Get chat messages for a specific form.
     */
    public function getFormMessages(Pizarra $pizarra)
    {
        // Check if user has access to this form
        $this->authorizeAccess($pizarra);

        // Get chat messages for this form
        $messages = $pizarra->chatMessages()
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
            'pizarra_id' => 'required|exists:pizarras,id',
            'message' => 'required|string',
            'is_system_message' => 'boolean',
        ]);

        // Find the form
        $pizarra = Pizarra::findOrFail($validated['pizarra_id']);

        // Check if user has access to this form
        $this->authorizeAccess($pizarra);

        // Create the chat message
        $message = Chat::create([
            'pizarra_id' => $validated['pizarra_id'],
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
    private function authorizeAccess(Pizarra $pizarra)
    {
        $user = Auth::user();

        // Si es dueño o colaborador aceptado
        if ($pizarra->isCollaboratingOrPropietario($user->id)) {
            return true;
        }

        abort(403, 'No tienes acceso al chat de este formulario.');
    }
}
