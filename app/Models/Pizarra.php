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
}
