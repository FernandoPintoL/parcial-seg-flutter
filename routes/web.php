<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\{AIController, ChatController, FigmaController, NodeController, PizarraController, CanvaController, FormBuilderController, WhiteboardActivityController, PizarraFlutterController};


Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('dashboard', function () {
    $user = Auth::user();

    // Get forms created by the user
    $ownedForms = \App\Models\FormBuilder::where('user_id', $user->id)->get();

    // Get forms the user is collaborating on (with accepted status)
    $collaboratingForms = $user->collaboratingForms()
        ->wherePivot('status', 'accepted')
        ->get();

    // Get pending invitations
    $pendingInvitations = $user->collaboratingForms()
        ->wherePivot('status', 'pending')
        ->get();

    return Inertia::render('Dashboard', [
        'ownedForms' => $ownedForms,
        'collaboratingForms' => $collaboratingForms,
        'pendingInvitations' => $pendingInvitations,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::resource('chat', ChatController::class);
// Chat routes for form-specific messages
Route::get('chat/form/{formId}/messages', [ChatController::class, 'getFormMessages'])->name('chat.form.messages');
Route::post('chat/message', [ChatController::class, 'storeMessage'])->name('chat.message.store');

// Whiteboard activity routes
Route::get('whiteboard/form/{formId}/activities', [WhiteboardActivityController::class, 'getFormActivities'])->middleware('auth')->name('whiteboard.form.activities');
Route::post('whiteboard/activity', [WhiteboardActivityController::class, 'storeActivity'])->middleware('auth')->name('whiteboard.activity.store');

Route::resource('pizarra', PizarraController::class);
Route::resource('pizarra-flutter', PizarraFlutterController::class);
Route::resource('canva', CanvaController::class);
Route::resource('form-builder', FormBuilderController::class);

// Pizarra Flutter Collaboration Routes
Route::post('pizarra-flutter/{id}/invite', [PizarraFlutterController::class, 'inviteCollaborator'])->name('pizarra-flutter.invite');
Route::post('pizarra-flutter/{id}/accept', [PizarraFlutterController::class, 'acceptInvitation'])->name('pizarra-flutter.accept');
Route::post('pizarra-flutter/{id}/reject', [PizarraFlutterController::class, 'rejectInvitation'])->name('pizarra-flutter.reject');
Route::post('pizarra-flutter/{id}/leave', [PizarraFlutterController::class, 'leaveCollaboration'])->name('pizarra-flutter.leave');
Route::get('pizarra-flutter/{id}/collaborators', [PizarraFlutterController::class, 'getCollaborators'])->name('pizarra-flutter.collaborators');
Route::get('pizarra-flutter/invite/{form}', [PizarraFlutterController::class, 'handleInviteLink'])->name('pizarra-flutter.invite-link');

// Form Builder Collaboration Routes
Route::post('form-builder/{id}/invite', [FormBuilderController::class, 'inviteCollaborator'])->name('form-builder.invite');
Route::post('form-builder/{id}/accept', [FormBuilderController::class, 'acceptInvitation'])->name('form-builder.accept');
Route::post('form-builder/{id}/reject', [FormBuilderController::class, 'rejectInvitation'])->name('form-builder.reject');
Route::post('form-builder/{id}/leave', [FormBuilderController::class, 'leaveCollaboration'])->name('form-builder.leave');
Route::get('form-builder/{id}/collaborators', [FormBuilderController::class, 'getCollaborators'])->name('form-builder.collaborators');
Route::get('form-builder/invite/{form}', [FormBuilderController::class, 'handleInviteLink'])->name('form-builder.invite-link');

Route::get('form-builder/{id}/collaborators/{userId}', [FormBuilderController::class, 'removeCollaborator'])->name('form-builder.remove-collaborator');
Route::get('form-builder/{id}/chat', [FormBuilderController::class, 'getChatMessages'])->name('form-builder.chat');
Route::post('form-builder/{id}/chat', [FormBuilderController::class, 'storeChatMessage'])->name('form-builder.chat.store');
Route::get('form-builder/{id}/whiteboard', [FormBuilderController::class, 'getWhiteboardActivities'])->name('form-builder.whiteboard');
Route::post('form-builder/{id}/whiteboard', [FormBuilderController::class, 'storeWhiteboardActivity'])->name('form-builder.whiteboard.store');
Route::get('form-builder/{id}/elements', [FormBuilderController::class, 'getElements'])->name('form-builder.elements');
Route::post('form-builder/{id}/elements', [FormBuilderController::class, 'storeElement'])->name('form-builder.elements.store');
Route::get('form-builder/{id}/elements/{elementId}', [FormBuilderController::class, 'getElement'])->name('form-builder.elements.show');
Route::put('form-builder/{id}/elements/{elementId}', [FormBuilderController::class, 'updateElement'])->name('form-builder.elements.update');
Route::delete('form-builder/{id}/elements/{elementId}', [FormBuilderController::class, 'deleteElement'])->name('form-builder.elements.delete');
Route::get('form-builder/{id}/collaborators/{userId}/status', [FormBuilderController::class, 'getCollaboratorStatus'])->name('form-builder.collaborator.status');
Route::post('form-builder/{id}/collaborators/{userId}/status', [FormBuilderController::class, 'updateCollaboratorStatus'])->name('form-builder.collaborator.status.update');


// Form Builder Image Scanning Route
Route::post('form-builder/scan-image', [FormBuilderController::class, 'scanImage'])->name('form-builder.scan-image');

// AI Routes
Route::post('/ai/generate-flutter-ui', [AIController::class, 'generateFlutterUI'])->name('ai.generate-flutter-ui');
Route::post('/ai/generate-response', [AIController::class, 'generateResponse'])->name('ai.generate-response');

Route::get('/node-data', NodeController::class.'@getData')->name('node-data');
Route::get('/figma/file/{fileId}', [FigmaController::class, 'getFile'])->name('figma.file');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

/*Route::get('/{any}', function () {
    return "NO ENCONTRADO";
})->where('any', '.*')->name('not-found');*/
