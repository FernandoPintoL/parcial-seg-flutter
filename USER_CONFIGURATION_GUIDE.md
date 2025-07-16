# Configuración Correcta de User en PizarraUnificada

## Estructura de Tipos TypeScript

### 1. Definición en `/resources/js/Data/PizarraUnificada.ts`

```typescript
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PizarraUnificada {
    id: number;
    name: string;
    type: 'flutter' | 'angular' | 'both';
    framework: 'flutter' | 'angular' | 'both';
    description?: string;
    elements: UnifiedElement[];
    screens?: UnifiedScreen[];
    user_id: number;
    user?: User;  // ⚠️ Importante: Opcional porque puede no estar siempre presente
    room_id?: string;
    created_at?: string;
    updated_at?: string;
}
```

### 2. Importación en Componentes Vue

```typescript
// En Index.vue
import type { PizarraUnificada, User } from '@/Data/PizarraUnificada';

// En PizarraUnificada.vue
import type { PizarraUnificada, UnifiedElement, UnifiedScreen, CodeExportOptions, User } from '@/Data/PizarraUnificada';
```

### 3. Uso Seguro en Templates

```vue
<!-- ✅ Correcto - Con validación -->
<p>Invitado por: {{ pizarra.user?.name ?? 'Desconocido' }}</p>
<p>Creado por: {{ pizarra.user?.name ?? 'Desconocido' }}</p>

<!-- ❌ Incorrecto - Sin validación -->
<p>Invitado por: {{ pizarra.user.name }}</p>
```

## Configuración del Backend (Laravel)

### 1. Controlador - PizarraUnificadaController.php

```php
public function index(): Response
{
    $user = Auth::user();
    
    // ✅ Siempre incluir la relación 'user'
    $ownedPizarras = Pizarra::where('user_id', $user->id)
        ->where('type', 'unified')
        ->with('user')  // ⚠️ Importante: Cargar la relación user
        ->orderBy('updated_at', 'desc')
        ->get();
    
    // Lo mismo para collaboratingPizarras y pendingInvitations
    // ...
}

public function show(Pizarra $pizarra)
{
    // ✅ Cargar relaciones necesarias
    $pizarra->load(['user', 'collaborators.user']);
    
    return Inertia::render('PizarraUnificada/PizarraUnificada', [
        'pizarra' => [
            'id' => $pizarra->id,
            'name' => $pizarra->name,
            'type' => $pizarra->framework ?? 'both',
            'elements' => json_decode($pizarra->elements, true) ?? [],
            'screens' => json_decode($pizarra->screens, true) ?? [],
            'user_id' => $pizarra->user_id,
            'user' => $pizarra->user,  // ⚠️ Incluir información del usuario
            'room_id' => $pizarra->room_id,
            // ...
        ],
        'creador' => $pizarra->user,
        // ...
    ]);
}
```

### 2. Modelo - Pizarra.php

```php
class Pizarra extends Model
{
    protected $fillable = [
        'name', 'type', 'framework', 'description', 
        'elements', 'screens', 'user_id', 'room_id'
    ];

    // ✅ Definir relación con User
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ✅ Definir relación con colaboradores
    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'pizarra_collaborators')
                    ->withPivot('status', 'created_at', 'updated_at');
    }
}
```

## Funciones Auxiliares en Vue

### 1. Función formatDate segura

```typescript
const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
```

### 2. Validación de propiedades

```typescript
// ✅ Validar antes de usar
if (pizarra.user && pizarra.user.id) {
    // Usar pizarra.user de forma segura
}

// ✅ Usar operador de encadenamiento opcional
const userName = pizarra.user?.name ?? 'Usuario desconocido';
```

## Estructura Final Recomendada

```
resources/js/
├── Data/
│   └── PizarraUnificada.ts          # Definiciones de tipos centralizadas
├── Pages/
│   └── PizarraUnificada/
│       ├── Index.vue                # Lista de pizarras
│       ├── Create.vue               # Crear pizarra
│       ├── PizarraUnificada.vue     # Mostrar/editar pizarra
│       └── NotFound.vue             # Página de error
└── types/
    └── PizarraUnificada.ts          # (Vacío - usar Data/ en su lugar)
```

## Puntos Importantes

1. **Consistencia**: Usar siempre la misma fuente de tipos (`@/Data/PizarraUnificada`)
2. **Validación**: Siempre validar que `user` existe antes de acceder a sus propiedades
3. **Relaciones**: Cargar las relaciones necesarias en el backend con `->with('user')`
4. **Opcionalidad**: Definir `user` como opcional en TypeScript (`user?: User`)
5. **Fallbacks**: Proporcionar valores por defecto para casos donde `user` sea undefined

Esta configuración asegura que el sistema sea robusto y maneje correctamente todos los casos donde la información del usuario puede o no estar disponible.
