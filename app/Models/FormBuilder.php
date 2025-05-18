<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormBuilder extends Model
{
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
        'elements' => 'json',
    ];

    /**
     * Get the user that owns the form.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the users that are collaborating on this form.
     */
    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'form_collaborators')
            ->withPivot('status')
            ->withTimestamps();
    }

    /**
     * Get the chat messages for this form.
     */
    public function chatMessages(): HasMany
    {
        return $this->hasMany(Chat::class, 'form_id');
    }

    /**
     * Get the whiteboard activities for this form.
     */
    public function whiteboardActivities(): HasMany
    {
        return $this->hasMany(WhiteboardActivity::class, 'form_id');
    }
}
