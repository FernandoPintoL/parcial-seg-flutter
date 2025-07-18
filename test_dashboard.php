<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Dashboard Data ===\n";

$user = App\Models\User::find(1);
echo "User ID: " . $user->id . "\n";
echo "User Name: " . $user->name . "\n";

$ownedForms = App\Models\Pizarra::where('user_id', $user->id)->get();
echo "Owned forms count: " . $ownedForms->count() . "\n\n";

echo "=== Owned Forms Details ===\n";
foreach($ownedForms as $form) {
    echo "ID: " . $form->id . "\n";
    echo "Name: " . $form->name . "\n";
    echo "Type: " . $form->type . "\n";
    echo "Framework: " . $form->framework . "\n";
    echo "isHome: " . ($form->isHome ? 'true' : 'false') . "\n";
    echo "Created: " . $form->created_at . "\n";
    echo "Updated: " . $form->updated_at . "\n";
    echo "---\n";
}

echo "\n=== Collaborating Forms ===\n";
$collaboratingPizarras = $user->collaborating()
    ->wherePivot('status', 'accepted')
    ->get();
echo "Collaborating forms count: " . $collaboratingPizarras->count() . "\n";

echo "\n=== Pending Invitations ===\n";
$pendingInvitations = $user->collaborating()
    ->wherePivot('status', 'pending')
    ->get();
echo "Pending invitations count: " . $pendingInvitations->count() . "\n";
