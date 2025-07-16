<?php
namespace App\Services;

use Illuminate\Support\Facades\Auth;

class PermissionService
{
    public static function havePermission($permiso)
    {
        $user = Auth::user();
        // verificar si el usuario tiene permisos de super admin
        if ($user->hasRole('Super Admin')) {
            return true;
        }
        // verificar si el usuario tiene permisos para la ruta
        if (!$user->can($permiso)) {
            abort(403);
        }
        return true;
    }

    public static function getPermissions($rutaVisita)
    {
        $user = Auth::user();

        // Super Admin puede hacer todo
        if ($user->hasRole('Super Admin')) {
            return [
                'crear' => true,
                'editar' => true,
                'eliminar' => true,
            ];
        }

        // Cliente solo puede gestionar contratos e incidencias
        if ($user->hasRole('Cliente')) {
            if ($rutaVisita === 'contrato' || $rutaVisita === 'contratoincidencias') {
                return [
                    'crear' => true,
                    'editar' => true,
                    'eliminar' => true,
                ];
            }
            return [
                'crear' => false,
                'editar' => false,
                'eliminar' => false,
            ];
        }

        // Empleado con rol de líder puede gestionar incidencias de contratos
        if ($user->hasRole('Empleado')) {
            $empleado = \App\Models\Empleado::where('user_id', $user->id)->first();
            if ($empleado) {
                $esLider = \App\Models\EmpleadoEquipoTrabajo::where('empleado_id', $empleado->id)
                    ->where('ocupacion', 'LIKE', '%Líder%')
                    ->exists();

                if ($esLider && $rutaVisita === 'contratoincidencias') {
                    return [
                        'crear' => true,
                        'editar' => true,
                        'eliminar' => true,
                    ];
                }
            }
        }

        // Para otros roles, verificar permisos normalmente
        return [
            'crear' => $user->can($rutaVisita.'-create'),
            'editar' => $user->can($rutaVisita.'-edit'),
            'eliminar' => $user->can($rutaVisita.'-delete'),
        ];
    }
}
