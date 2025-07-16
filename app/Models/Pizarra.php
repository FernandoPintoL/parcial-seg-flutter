<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Pizarra extends Model
{
    /** @use HasFactory<\Database\Factories\PizarraFactory> */
    use HasFactory;
    protected $table = 'pizarras';
    protected $primaryKey = 'id';
    public $timestamps = true;
    protected $fillable = [
        'name',
        'room_id',
        'user_id',
        'pizarra_id',
        'isHome',
        'users',
        'screens',
        'elements',
        'type',
        'framework',
        'description',
    ];
    /**
     * Get the user that owns the pizarra flutter.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
    /**
     * Get the users that are collaborating on this pizarra flutter.
     */
    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'pizarra_collaborators', 'pizarra_id', 'user_id')
            ->withPivot('status')
            ->withTimestamps();
    }
    public function isCollaboratingOrPropietario($userId): bool
    {
        return $this->collaborators()->where('user_id', $userId)->exists() || $this->user_id === $userId;
    }
    public function chatMessages()
    {
        return $this->hasMany(Chat::class);
    }
    public function pizarraHijas(): BelongsTo
    {
        return $this->belongsTo(Pizarra::class, 'pizarra_id', 'id');
    }

    /**
     * Scope para filtrar pizarras por tipo
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope para filtrar pizarras por framework
     */
    public function scopeOfFramework($query, $framework)
    {
        return $query->where('framework', $framework);
    }

    /**
     * Verifica si la pizarra es de tipo unificada
     */
    public function isUnified(): bool
    {
        return $this->type === 'unified';
    }

    /**
     * Verifica si la pizarra es de tipo Flutter
     */
    public function isFlutter(): bool
    {
        return $this->type === 'flutter';
    }

    /**
     * Verifica si la pizarra es de tipo Angular
     */
    public function isAngular(): bool
    {
        return $this->type === 'angular';
    }

    /**
     * Obtiene las pantallas decodificadas
     */
    public function getScreensAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }

    /**
     * Establece las pantallas codificadas
     */
    public function setScreensAttribute($value)
    {
        $this->attributes['screens'] = json_encode($value);
    }

    /**
     * Obtiene los elementos decodificados
     */
    public function getElementsAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }

    /**
     * Establece los elementos codificados
     */
    public function setElementsAttribute($value)
    {
        $this->attributes['elements'] = json_encode($value);
    }
}
