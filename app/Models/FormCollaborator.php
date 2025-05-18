<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormCollaborator extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'form_collaborators';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'form_builder_id',
        'user_id',
        'status',
    ];

    /**
     * Get the form that this collaboration is for.
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(FormBuilder::class, 'form_builder_id');
    }

    /**
     * Get the user that is collaborating.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
