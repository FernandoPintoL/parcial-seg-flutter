<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PizarraFlutter extends Model
{
    /** @use HasFactory<\Database\Factories\PizarraFlutterFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'elements',
        'user_id',
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
        return $this->belongsTo(User::class);
    }

    /**
     * Get the users that are collaborating on this pizarra flutter.
     */
    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'pizarra_collaborators')
            ->withPivot('status')
            ->withTimestamps();
    }
}
