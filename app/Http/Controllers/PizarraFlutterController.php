<?php

namespace App\Http\Controllers;

use App\Models\PizarraFlutter;
use App\Models\PizarraCollaborator;
use App\Models\User;
use App\Notifications\PizarraInvitation;
use App\Http\Requests\StorePizarraFlutterRequest;
use App\Http\Requests\UpdatePizarraFlutterRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PizarraFlutterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();

        // Get pizarras created by the user
        $ownedPizarras = PizarraFlutter::where('user_id', $user->id)->get();

        // Get pizarras the user is collaborating on (with accepted status)
        $collaboratingPizarras = $user->collaboratingPizarraFlutters()
            ->wherePivot('status', 'accepted')
            ->get();

        // Get pending invitations
        $pendingInvitations = $user->collaboratingPizarraFlutters()
            ->wherePivot('status', 'pending')
            ->get();

        return \Inertia\Inertia::render('PizarraFlutter/Index', [
            'ownedPizarras' => $ownedPizarras,
            'collaboratingPizarras' => $collaboratingPizarras,
            'pendingInvitations' => $pendingInvitations,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePizarraFlutterRequest $request)
    {
        $pizarraFlutter = new PizarraFlutter();
        $pizarraFlutter->name = $request->name;
        $pizarraFlutter->elements = $request->elements ?? [];
        $pizarraFlutter->user_id = auth()->id();
        $pizarraFlutter->save();

        return redirect()->route('pizarra-flutter.show', $pizarraFlutter->id);
    }

    /**
     * Display the specified resource.
     */
    public function show(PizarraFlutter $pizarraFlutter)
    {
        return \Inertia\Inertia::render('PizarraFlutter/PizarraFlutter', [
            'user' => auth()->user(),
            'pizarraFlutter' => $pizarraFlutter,
            'isCreador' => $pizarraFlutter->user_id === auth()->id(),
            'creador' => $pizarraFlutter->user,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PizarraFlutter $pizarraFlutter)
    {
        return \Inertia\Inertia::render('PizarraFlutter/PizarraFlutter', [
            'user' => auth()->user(),
            'pizarraFlutter' => $pizarraFlutter,
            'isCreador' => $pizarraFlutter->user_id === auth()->id(),
            'creador' => $pizarraFlutter->user,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePizarraFlutterRequest $request, PizarraFlutter $pizarraFlutter)
    {
        // Check if user is authorized to update this pizarra
        if ($pizarraFlutter->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $pizarraFlutter->name = $request->name;
        if ($request->has('elements')) {
            $pizarraFlutter->elements = $request->elements;
        }
        $pizarraFlutter->save();

        return response()->json($pizarraFlutter);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PizarraFlutter $pizarraFlutter)
    {
        // Check if user is authorized to delete this pizarra
        if ($pizarraFlutter->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $pizarraFlutter->delete();

        return redirect()->route('pizarra-flutter.index');
    }

    /**
     * Invite a user to collaborate on a pizarra.
     */
    public function inviteCollaborator(Request $request, string $id)
    {
        // Validate the request
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Get the pizarra and ensure the current user is the owner
        $pizarra = PizarraFlutter::findOrFail($id);

        if ($pizarra->user_id !== Auth::id()) {
            return response()->json(['message' => 'You are not authorized to invite collaborators to this pizarra'], 403);
        }

        // Find the user to invite
        $userToInvite = User::where('email', $validated['email'])->first();

        // Check if the user is already a collaborator
        $existingCollaboration = PizarraCollaborator::where('pizarra_flutter_id', $pizarra->id)
            ->where('user_id', $userToInvite->id)
            ->first();

        if ($existingCollaboration) {
            return response()->json(['message' => 'This user is already a collaborator or has a pending invitation'], 422);
        }

        // Create the collaboration
        $collaboration = PizarraCollaborator::create([
            'pizarra_flutter_id' => $pizarra->id,
            'user_id' => $userToInvite->id,
            'status' => 'pending',
        ]);

        // Send notification to the invited user
        if (class_exists('App\Notifications\PizarraInvitation')) {
            $userToInvite->notify(new PizarraInvitation($pizarra, Auth::user()));
        }

        return response()->json($collaboration, 201);
    }

    /**
     * Accept a collaboration invitation.
     */
    public function acceptInvitation(string $id)
    {
        // Find the collaboration and ensure it belongs to the current user
        $collaboration = PizarraCollaborator::where('pizarra_flutter_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        // Update the status
        $collaboration->update(['status' => 'accepted']);

        // Get the pizarra and the user who accepted the invitation
        $pizarra = PizarraFlutter::findOrFail($id);
        $user = Auth::user();

        // Create a socket.io client to emit an event
        $socketUrl = env('SOCKET_SERVER_URL', 'http://localhost:4000');
        $ch = curl_init($socketUrl . '/emit-event');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'event' => 'collaboratorAccepted',
            'data' => [
                'pizarraFlutterId' => $id,
                'roomId' => 'flutter-room-' . $id,
                'user' => $user->name,
                'userId' => $user->id,
                'email' => $user->email,
                'timestamp' => now()->timestamp,
            ]
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        $response = curl_exec($ch);
        curl_close($ch);

        return response()->json($collaboration, 200);
    }

    /**
     * Reject a collaboration invitation.
     */
    public function rejectInvitation(string $id)
    {
        // Find the collaboration and ensure it belongs to the current user
        $collaboration = PizarraCollaborator::where('pizarra_flutter_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        // Update the status
        $collaboration->update(['status' => 'rejected']);

        return response()->json($collaboration, 200);
    }

    /**
     * Leave a collaboration.
     */
    public function leaveCollaboration(string $id)
    {
        // Find the pizarra and ensure the current user is a collaborator
        $pizarra = PizarraFlutter::findOrFail($id);

        // Find the collaboration
        $collaboration = PizarraCollaborator::where('pizarra_flutter_id', $pizarra->id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Delete the collaboration
        $collaboration->delete();

        return response()->json(['message' => 'Has abandonado la colaboración con éxito'], 200);
    }

    /**
     * Get collaborators for a pizarra.
     */
    public function getCollaborators(string $id)
    {
        // Get the pizarra
        $pizarra = PizarraFlutter::with(['collaborators' => function($query) {
            $query->wherePivot('status', 'accepted');
        }])->findOrFail($id);

        // Check if the user is the owner or a collaborator
        $isOwner = $pizarra->user_id === Auth::id();
        $isCollaborator = $pizarra->collaborators->contains('id', Auth::id());

        if (!$isOwner && !$isCollaborator) {
            return response()->json(['message' => 'No estás autorizado a ver los colaboradores de esta pizarra.'], 403);
        }

        return response()->json($pizarra->collaborators, 200);
    }

    /**
     * Handle invitation link.
     */
    public function handleInviteLink(PizarraFlutter $form)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            // Redirect to login page with a redirect back to this page after login
            return redirect()->route('login')->with('redirect', route('pizarra-flutter.invite-link', $form->id));
        }

        $user = Auth::user();

        // Check if user is already the owner
        if ($form->user_id === $user->id) {
            return redirect()->route('pizarra-flutter.index')
                ->with('message', 'Usted ya es el propietario de esta pizarra.');
        }

        // Check if user is already a collaborator
        $existingCollaboration = PizarraCollaborator::where('pizarra_flutter_id', $form->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingCollaboration) {
            if ($existingCollaboration->status === 'accepted') {
                return redirect()->route('pizarra-flutter.index')
                    ->with('message', 'Ya eres colaborador en esta pizarra.');
            } elseif ($existingCollaboration->status === 'rejected') {
                // Update status to pending
                $existingCollaboration->update(['status' => 'pending']);
            }
            // If status is pending, show the invitation page
        } else {
            // Create a new collaboration with pending status
            PizarraCollaborator::create([
                'pizarra_flutter_id' => $form->id,
                'user_id' => $user->id,
                'status' => 'pending',
            ]);
        }

        // Redirect to pizarra flutter index with the invitation highlighted
        return redirect()->route('pizarra-flutter.index')
            ->with('highlight_invitation', $form->id)
            ->with('message', 'Has sido invitado a colaborar en "' . $form->name . '". Por favor revise sus invitaciones pendientes.');
    }
}
