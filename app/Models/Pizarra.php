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

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'room_id',
        'elements',
        'user_id',
        'users',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'elements' => 'array',
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
        return $this->belongsToMany(PizarraCollaborator::class, 'pizarra_collaborators')
            ->withPivot('status')
            ->withTimestamps();
    }
    public function collaboratorsAccept(): BelongsToMany
    {
        return $this->belongsToMany(PizarraCollaborator::class, 'pizarra_collaborators')
            ->wherePivot('status', 'accept')
            ->withTimestamps();
    }
    public function isCollaborating($userId): bool
    {
        return $this->collaboratorsAccept()->where('user_id', $userId)->exists();
    }
}
