<?php

namespace App\Http\Controllers;

use App\Models\FormBuilder;
use App\Models\FormCollaborator;
use App\Models\User;
use App\Notifications\FormInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FormBuilderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        // Get forms created by the user
        $ownedForms = FormBuilder::where('user_id', $user->id)->get();

        // Get forms the user is collaborating on (with accepted status)
        $collaboratingForms = $user->collaboratingForms()
            ->wherePivot('status', 'accepted')
            ->get();

        // Get pending invitations
        $pendingInvitations = $user->collaboratingForms()
            ->wherePivot('status', 'pending')
            ->get();

        return Inertia::render('FormBuilder/Index', [
            'ownedForms' => $ownedForms,
            'collaboratingForms' => $collaboratingForms,
            'pendingInvitations' => $pendingInvitations,
        ]);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Create the form
        $form = FormBuilder::create([
            'name' => $validated['name'],
            'user_id' => auth()->id(),
        ]);

        return response()->json($form, 201);
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $form = FormBuilder::findOrFail($id);

        return Inertia::render('FormBuilder/Show', [
            'form' => $form
        ]);
    }
    /**
     * Update the specified resource in storage.
     */
    public function edit(FormBuilder $form_builder)
    {
        // Verificar si el usuario está autenticado
        if (!Auth::check()) {
            return redirect()->route('login')->with('redirect', route('form-builder.edit', $form_builder->id));
        }
        $userAutenticado = Auth::user();
        // dame el usuario creador
        $userCreador = User::find($form_builder->user_id);
        // dame los colaboradores del formBuilder
        $colaboradores = $form_builder->collaborators()->where('status', 'accepted')->get();

        // Verificar si el usuario es el creador o colaborador del formulario
        if ($form_builder->user_id === Auth::id() || $form_builder->collaborators->contains('id', Auth::id())) {
            return Inertia::render('FormBuilder/FormBuilderCanvas', [
                'formBuilder' => $form_builder,
                'user' => $userAutenticado,
                'creador' => $userCreador,
                'colaboradores' => $colaboradores,
                'isCreador' => $form_builder->user_id === Auth::id(),
            ]);
        }

        // Si no es creador ni colaborador, denegar acceso
        return response()->json(['message' => 'No estás autorizado a editar este formulario.'], 403);
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Validate the request
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'elements' => 'sometimes|json',
        ]);

        // Update the form
        $form = FormBuilder::findOrFail($id);
        $form->update($validated);

        return response()->json($form, 200);
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $form = FormBuilder::findOrFail($id);

        // Check if the current user is the creator of the form
        if ($form->user_id !== Auth::id()) {
            return response()->json(['message' => 'You are not authorized to delete this form'], 403);
        }

        $form->delete();

        return response()->json(null, 204);
    }
    /**
     * Invite a user to collaborate on a form.
     */
    public function inviteCollaborator(Request $request, string $id)
    {
        // Validate the request
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Get the form and ensure the current user is the owner
        $form = FormBuilder::findOrFail($id);

        if ($form->user_id !== Auth::id()) {
            return response()->json(['message' => 'You are not authorized to invite collaborators to this form'], 403);
        }

        // Find the user to invite
        $userToInvite = User::where('email', $validated['email'])->first();

        // Check if the user is already a collaborator
        $existingCollaboration = FormCollaborator::where('form_builder_id', $form->id)
            ->where('user_id', $userToInvite->id)
            ->first();

        if ($existingCollaboration) {
            return response()->json(['message' => 'This user is already a collaborator or has a pending invitation'], 422);
        }

        // Create the collaboration
        $collaboration = FormCollaborator::create([
            'form_builder_id' => $form->id,
            'user_id' => $userToInvite->id,
            'status' => 'pending',
        ]);

        // Send notification to the invited user
        $userToInvite->notify(new FormInvitation($form, Auth::user()));

        return response()->json($collaboration, 201);
    }
    /**
     * Accept a collaboration invitation.
     */
    public function acceptInvitation(string $id)
    {
        // Find the collaboration and ensure it belongs to the current user
        $collaboration = FormCollaborator::where('form_builder_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        // Update the status
        $collaboration->update(['status' => 'accepted']);

        // Get the form and the user who accepted the invitation
        $form = FormBuilder::findOrFail($id);
        $user = Auth::user();

        // Create a socket.io client to emit an event
        $socketUrl = env('SOCKET_SERVER_URL', 'http://localhost:4000');
        $ch = curl_init($socketUrl . '/emit-event');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'event' => 'collaboratorAccepted',
            'data' => [
                'formBuilderId' => $id,
                'roomId' => 'room-' . $id,
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

        // redireccionar a la vista del formulario para editarlo
        return response()->json($collaboration, 200);
        /*return redirect()->route('form-builder.edit', $id)
            ->with('message', 'Has aceptado la invitación para colaborar en el formulario.');*/
    }
    /**
     * Reject a collaboration invitation.
     */
    public function rejectInvitation(string $id)
    {
        // Find the collaboration and ensure it belongs to the current user
        $collaboration = FormCollaborator::where('form_builder_id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        // Update the status
        $collaboration->update(['status' => 'rejected']);

        return response()->json($collaboration, 200);
    }
    /**
     * Remove a collaborator from a form.
     */
    public function removeCollaborator(string $id, string $userId){
        // Find the form and ensure the current user is the owner
        $form = FormBuilder::findOrFail($id);

        if ($form->user_id !== Auth::id()) {
            return response()->json(['message' => 'You are not authorized to remove collaborators from this form'], 403);
        }

        // Find the collaboration
        $collaboration = FormCollaborator::where('form_builder_id', $form->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        // Delete the collaboration
        $collaboration->delete();

        return response()->json(['message' => 'Collaborator removed successfully'], 200);
    }
    /**
     * Dejar de ser colaborador
     */
    public function leaveCollaboration(string $id){
        // Find the form and ensure the current user is a collaborator
        $form = FormBuilder::findOrFail($id);
        // Find the collaboration
        $collaboration = FormCollaborator::where('form_builder_id', $form->id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Delete the collaboration
        $collaboration->delete();

        return response()->json(['message' => 'Has abandonado la colaboración con éxito'], 200);
    }
    /**
     * Get collaborators for a form.
     */
    public function getCollaborators(string $id)
    {
        // Get the form
        $form = FormBuilder::with(['collaborators' => function($query) {
            $query->wherePivot('status', 'accepted');
        }])->findOrFail($id);

        // Check if the user is the owner or a collaborator
        $isOwner = $form->user_id === Auth::id();
        $isCollaborator = $form->collaborators->contains('id', Auth::id());

        if (!$isOwner && !$isCollaborator) {
            return response()->json(['message' => 'No estás autorizado a ver los colaboradores de este formulario.'], 403);
        }

        return response()->json($form->collaborators, 200);
    }
    /**
     * Handle invitation link.
     */
    public function handleInviteLink(FormBuilder $form)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            // Redirect to login page with a redirect back to this page after login
            return redirect()->route('login')->with('redirect', route('form-builder.invite-link', $form->id));
        }

        $user = Auth::user();
//        $form = FormBuilder::findOrFail($id);

        // Check if user is already the owner
        if ($form->user_id === $user->id) {
            return redirect()->route('form-builder.index')
                ->with('message', 'Usted ya es el propietario de este formulario.');
        }

        // Check if user is already a collaborator
        $existingCollaboration = FormCollaborator::where('form_builder_id', $form->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingCollaboration) {
            if ($existingCollaboration->status === 'accepted') {
                return redirect()->route('form-builder.index')
                    ->with('message', 'Ya eres colaborador en este formulario.');
            } elseif ($existingCollaboration->status === 'rejected') {
                // Update status to pending
                $existingCollaboration->update(['status' => 'pending']);
            }
            // If status is pending, show the invitation page
        } else {
            // Create a new collaboration with pending status
            FormCollaborator::create([
                'form_builder_id' => $form->id,
                'user_id' => $user->id,
                'status' => 'pending',
            ]);
        }

        // Redirect to form builder index with the invitation highlighted
        return redirect()->route('form-builder.index')
            ->with('highlight_invitation', $form->id)
            ->with('message', 'Has sido invitado a colaborar en "' . $form->name . '". Por favor revise sus invitaciones pendientes.');
    }
    /**
     * Process an uploaded image and detect form elements.
     */
    public function scanImage(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'image' => 'required|image|max:5120', // Max 5MB
        ]);

        try {
            // Store the image
            $imagePath = $request->file('image')->store('form-scans', 'public');
            $imageUrl = Storage::url($imagePath);

            // In a real-world scenario, we would use an image recognition service or library
            // to detect form elements in the image. For this example, we'll simulate the detection.

            // Simulate processing time
            sleep(1);

            // Generate some random form elements based on common form patterns
            $elements = $this->simulateFormElementDetection();

            return response()->json([
                'success' => true,
                'message' => 'Imagen procesada correctamente',
                'image_url' => $imageUrl,
                'elements' => $elements
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar la imagen: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Simulate form element detection from an image.
     * In a real implementation, this would use computer vision to detect elements.
     */
    private function simulateFormElementDetection()
    {
        // Generate a random number of form elements (3-8)
        $numElements = rand(3, 8);
        $elements = [];

        // Common form field labels
        $inputLabels = [
            'Nombre', 'Apellido', 'Email', 'Teléfono', 'Dirección',
            'Ciudad', 'País', 'Código Postal', 'Fecha de Nacimiento',
            'Empresa', 'Cargo', 'Comentarios'
        ];

        // Common select options
        $selectOptions = [
            ['Opción 1', 'Opción 2', 'Opción 3'],
            ['Sí', 'No', 'Tal vez'],
            ['Básico', 'Intermedio', 'Avanzado'],
            ['España', 'México', 'Argentina', 'Colombia', 'Chile']
        ];

        // Generate random elements
        for ($i = 0; $i < $numElements; $i++) {
            $type = $this->getRandomElementType();
            $element = [
                'type' => $type,
                'props' => []
            ];

            // Set properties based on element type
            switch ($type) {
                case 'input':
                    $element['props'] = [
                        'label' => $inputLabels[array_rand($inputLabels)],
                        'placeholder' => 'Ingrese ' . strtolower($inputLabels[array_rand($inputLabels)]),
                        'type' => $this->getRandomInputType(),
                        'required' => (bool) rand(0, 1)
                    ];
                    break;

                case 'select':
                    $options = $selectOptions[array_rand($selectOptions)];
                    $element['props'] = [
                        'label' => $inputLabels[array_rand($inputLabels)],
                        'options' => $options,
                        'required' => (bool) rand(0, 1)
                    ];
                    break;

                case 'textarea':
                    $element['props'] = [
                        'label' => 'Comentarios',
                        'placeholder' => 'Ingrese sus comentarios aquí',
                        'required' => (bool) rand(0, 1)
                    ];
                    break;

                case 'checkbox':
                    $element['props'] = [
                        'label' => 'Acepto los términos y condiciones',
                        'checked' => false
                    ];
                    break;

                case 'radio':
                    $options = $selectOptions[array_rand($selectOptions)];
                    $element['props'] = [
                        'label' => $inputLabels[array_rand($inputLabels)],
                        'options' => $options
                    ];
                    break;

                case 'button':
                    $element['props'] = [
                        'text' => 'Enviar',
                        'variant' => 'primary'
                    ];
                    break;
            }

            $elements[] = $element;
        }

        // Always add a submit button at the end
        if (!in_array('button', array_column($elements, 'type'))) {
            $elements[] = [
                'type' => 'button',
                'props' => [
                    'text' => 'Enviar Formulario',
                    'variant' => 'primary'
                ]
            ];
        }

        return $elements;
    }
    /**
     * Get a random form element type.
     */
    private function getRandomElementType()
    {
        $types = ['input', 'select', 'textarea', 'checkbox', 'radio', 'button'];
        $weights = [40, 20, 15, 10, 10, 5]; // Weighted probabilities

        return $this->weightedRandom($types, $weights);
    }
    /**
     * Get a random input type.
     */
    private function getRandomInputType()
    {
        $types = ['text', 'email', 'tel', 'number', 'password', 'url'];
        $weights = [50, 20, 10, 10, 5, 5]; // Weighted probabilities

        return $this->weightedRandom($types, $weights);
    }
    /**
     * Get a random item from an array based on weights.
     */
    private function weightedRandom($items, $weights)
    {
        $totalWeight = array_sum($weights);
        $rand = mt_rand(1, $totalWeight);

        $currentWeight = 0;
        foreach ($items as $index => $item) {
            $currentWeight += $weights[$index];
            if ($rand <= $currentWeight) {
                return $item;
            }
        }

        return $items[0]; // Fallback
    }
}
