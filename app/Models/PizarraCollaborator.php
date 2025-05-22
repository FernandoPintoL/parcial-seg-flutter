<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PizarraCollaborator extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'pizarra_collaborators';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'pizarra_id',
        'user_id',
        'status',
    ];
    /**
     * Get the form that this collaboration is for.
     */
    public function pizarra(): BelongsTo
    {
        return $this->belongsTo(Pizarra::class);
    }
    /**
     * Get the user that is collaborating.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
