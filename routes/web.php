<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\{
    AIController,
    ChatController,
    FigmaController,
    NodeController,
    PizarraController,
    PizarraUnificadaController,
    WhiteboardActivityController};


Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Test route for Whisper
Route::get('/test-whisper', function () {
    return view('test-whisper');
});

Route::get('/dashboard', function () {
    $user = Auth::user();

    // Get forms created by the user
    $ownedForms = \App\Models\Pizarra::where('user_id', $user->id)
                                        ->where('isHome', true)->get();

    // Get forms the user is collaborating on (with accepted status)
    $collaboratingPizarras = $user->collaborating()
        ->wherePivot('status', 'accepted')
        ->with('pizarra:id,name')
        ->get();

    // Get pending invitations
    $pendingInvitations = $user->collaborating()
        ->wherePivot('status', 'pending')
        ->with('pizarra:id,name')
        ->get();

    return Inertia::render('Dashboard', [
        'ownedForms' => $ownedForms,
        'collaboratingForms' => $collaboratingPizarras,
        'pendingInvitations' => $pendingInvitations,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

// Chat routes for form-specific messages
/*Route::resource('/chat', ChatController::class);*/
Route::get('/chat/form/{pizarra}/messages', [ChatController::class, 'getFormMessages'])->name('chat.form.messages');
Route::post('/chat/message', [ChatController::class, 'storeMessage'])->name('chat.message.store');

// Whiteboard activity routes
/*Route::get('/whiteboard/form/{formId}/activities', [WhiteboardActivityController::class, 'getFormActivities'])->middleware('auth')->name('whiteboard.form.activities');
Route::post('/whiteboard/activity', [WhiteboardActivityController::class, 'storeActivity'])->middleware('auth')->name('whiteboard.activity.store');*/

// Pizarra Unificada Routes
Route::resource('/pizarra-unificada', PizarraUnificadaController::class);
Route::get('/pizarra-unificada/{pizarra}/collaborators', [PizarraUnificadaController::class, 'getCollaborators'])->name('pizarra-unificada.collaborators');
Route::post('/pizarra-unificada/{pizarra}/invite', [PizarraUnificadaController::class, 'inviteCollaborator'])->name('pizarra-unificada.invite');
Route::post('/pizarra-unificada/{pizarra}/accept', [PizarraUnificadaController::class, 'acceptInvitation'])->name('pizarra-unificada.accept');
Route::post('/pizarra-unificada/{pizarra}/reject', [PizarraUnificadaController::class, 'rejectInvitation'])->name('pizarra-unificada.reject');
Route::post('/pizarra-unificada/{pizarra}/leave', [PizarraUnificadaController::class, 'leaveCollaboration'])->name('pizarra-unificada.leave');
Route::get('/pizarra-unificada/invite/{pizarra}', [PizarraUnificadaController::class, 'handleInviteLink'])->name('pizarra-unificada.invite-link');
Route::post('/pizarra-unificada/{pizarra}/process-diagram', [PizarraUnificadaController::class, 'processDiagram'])->name('pizarra-unificada.process-diagram');
Route::post('/pizarra-unificada/{pizarra}/generate-code', [PizarraUnificadaController::class, 'generateCode'])->name('pizarra-unificada.generate-code');
Route::post('/pizarra-unificada/{pizarra}/download-code', [PizarraUnificadaController::class, 'downloadCode'])->name('pizarra-unificada.download-code');
Route::post('/pizarra-unificada/{pizarra}/update-framework', [PizarraUnificadaController::class, 'updateFramework'])->name('pizarra-unificada.update-framework');
Route::post('/pizarra-unificada/{pizarra}/elements', [PizarraUnificadaController::class, 'updateElements'])->name('pizarra-unificada.update-elements');
Route::post('/pizarra-unificada/{pizarra}/screens', [PizarraUnificadaController::class, 'updateScreens'])->name('pizarra-unificada.update-screens');

Route::resource('/pizarra', PizarraController::class);
Route::get('/pizarra/flutter', [PizarraController::class, 'indexFlutter'])->name('pizarra.flutter.index');
Route::delete('/pizarra/hija/{pizarra}/delete', [PizarraController::class, 'destroyHija'])->name('pizarra.destroy.hija');
//Route::get('/pizarra/angular', [PizarraController::class, 'indexAngular'])->name('pizarra.angular.index');
// Routes Pizarra Flutter
Route::post('/pizarra/{pizarra}/invite/flutter', [PizarraController::class, 'inviteCollaborator'])->name('pizarra.flutter.invite');
Route::post('/pizarra/{pizarra}/accept/flutter', [PizarraController::class, 'acceptInvitation'])->name('pizarra.flutter.accept');
Route::post('/pizarra/{pizarra}/reject/flutter', [PizarraController::class, 'rejectInvitation'])->name('pizarra.flutter.reject');
Route::post('/pizarra/{pizarra}/leave/flutter', [PizarraController::class, 'leaveCollaboration'])->name('pizarra.flutter.leave');
Route::get('/pizarra/{pizarra}/collaborators/flutter', [PizarraController::class, 'getCollaborators'])->name('pizarra.flutter.collaborators');
Route::get('/pizarra/invite/{pizarra}/flutter', [PizarraController::class, 'handleInviteLink'])->name('pizarra.flutter.invite-link');

// AI Routes
Route::post('/ai/generate-flutter-ui', [AIController::class, 'generateFlutterUI'])->name('ai.generate-flutter-ui');
Route::post('/ai/generate-response', [AIController::class, 'generateResponse'])->name('ai.generate-response');

// Flutter Project Download Route
Route::post('/pizarra/download-flutter-project', [PizarraController::class, 'downloadFlutterProject'])->name('pizarra.download-flutter-project');

// Flutter Image Scanning Route
Route::post('/pizarra/scan-image', [PizarraController::class, 'scanImage'])->name('pizarra.scan-image');

Route::get('/node-data', NodeController::class.'@getData')->name('node-data');
Route::get('/figma/file/{fileId}', [FigmaController::class, 'getFile'])->name('figma.file');

// Categoria Widget Routes
Route::resource('/categoria-widget', \App\Http\Controllers\CategoriaWidgetController::class);
// Propiedades de los Widgets Routes
Route::resource('/propiedad-widget', \App\Http\Controllers\PropiedadesController::class);
// Widget Routes
Route::resource('/widget', \App\Http\Controllers\WidgetController::class);
Route::post('/widget/query', [\App\Http\Controllers\WidgetController::class, 'getAllWidgets'])->name('widget.query');
Route::get('/widget/{widget}/propiedades', [\App\Http\Controllers\WidgetController::class, 'getPropiedades'])->name('widget.propiedades');
Route::delete('/widget/{widget}/propiedades', [\App\Http\Controllers\WidgetController::class, 'deletePropiedades'])->name('widget.propiedades.delete');
// Asignación de Widgets a Categorías Routes
// Asignacion de Propiedades a Widgets Routes
Route::resource('/widgets-propiedades', \App\Http\Controllers\WidgetsPropiedadesController::class);

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

/*Route::get('/{any}', function () {
    return "NO ENCONTRADO";
})->where('any', '.*')->name('not-found');*/

//Routes Pizarra Angular
/*Route::post('/pizarra/{pizarra}/invite/angular', [PizarraController::class, 'inviteCollaborator'])->name('pizarra.angular.invite');
Route::post('/pizarra/{pizarra}/accept/angular', [PizarraController::class, 'acceptInvitation'])->name('pizarra.angular.accept');
Route::post('/pizarra/{pizarra}/reject/angular', [PizarraController::class, 'rejectInvitation'])->name('pizarra.angular.reject');
Route::post('/pizarra/{pizarra}/leave/angular', [PizarraController::class, 'leaveCollaboration'])->name('pizarra.angular.leave');
Route::get('/pizarra/{pizarra}/collaborators/angular', [PizarraController::class, 'getCollaborators'])->name('pizarra.angular.collaborators');
Route::get('/pizarra/invite/{pizarra}/angular', [PizarraController::class, 'handleInviteLinkAngular'])->name('pizarra.angular.invite-link');
*/

// Pizarra Flutter Collaboration Routes
/*Route::post('/pizarra-flutter/{id}/invite', [PizarraFlutterController::class, 'inviteCollaborator'])->name('pizarra-flutter.invite');
Route::post('/pizarra-flutter/{id}/accept', [PizarraFlutterController::class, 'acceptInvitation'])->name('pizarra-flutter.accept');
Route::post('/pizarra-flutter/{id}/reject', [PizarraFlutterController::class, 'rejectInvitation'])->name('pizarra-flutter.reject');
Route::post('/pizarra-flutter/{id}/leave', [PizarraFlutterController::class, 'leaveCollaboration'])->name('pizarra-flutter.leave');
Route::get('/pizarra-flutter/{id}/collaborators', [PizarraFlutterController::class, 'getCollaborators'])->name('pizarra-flutter.collaborators');
Route::get('/pizarra-flutter/invite/{form}', [PizarraFlutterController::class, 'handleInviteLink'])->name('pizarra-flutter.invite-link');*/

// Form Builder Collaboration Routes
/*Route::post('/form-builder/{id}/invite', [FormBuilderController::class, 'inviteCollaborator'])->name('form-builder.invite');
Route::post('/form-builder/{id}/accept', [FormBuilderController::class, 'acceptInvitation'])->name('form-builder.accept');
Route::post('/form-builder/{id}/reject', [FormBuilderController::class, 'rejectInvitation'])->name('form-builder.reject');
Route::post('/form-builder/{id}/leave', [FormBuilderController::class, 'leaveCollaboration'])->name('form-builder.leave');
Route::get('/form-builder/{id}/collaborators', [FormBuilderController::class, 'getCollaborators'])->name('form-builder.collaborators');
Route::get('/form-builder/invite/{form}', [FormBuilderController::class, 'handleInviteLink'])->name('form-builder.invite-link');
Route::get('/form-builder/{id}/collaborators/{userId}', [FormBuilderController::class, 'removeCollaborator'])->name('form-builder.remove-collaborator');
*/

// Form Builder Image Scanning Route
//Route::post('/pizarra/scan-image', [FormBuilderController::class, 'scanImage'])->name('form-builder.scan-image');
