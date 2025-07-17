<?php

namespace App\Policies;

use App\Models\Pizarra;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PizarraPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Todos los usuarios pueden ver la lista
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Pizarra $pizarra): bool
    {
        // El usuario puede ver si es el creador o es un colaborador aceptado
        return $pizarra->user_id === $user->id || 
               $pizarra->collaborators()
                       ->where('user_id', $user->id)
                       ->where('status', 'accepted')
                       ->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true; // Todos los usuarios autenticados pueden crear pizarras
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Pizarra $pizarra): bool
    {
        // Solo el creador o colaboradores aceptados pueden actualizar
        return $pizarra->user_id === $user->id || 
               $pizarra->collaborators()
                       ->where('user_id', $user->id)
                       ->where('status', 'accepted')
                       ->exists();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Pizarra $pizarra): bool
    {
        // Solo el creador puede eliminar la pizarra
        return $pizarra->user_id === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Pizarra $pizarra): bool
    {
        // Solo el creador puede restaurar
        return $pizarra->user_id === $user->id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Pizarra $pizarra): bool
    {
        // Solo el creador puede eliminar permanentemente
        return $pizarra->user_id === $user->id;
    }
}
