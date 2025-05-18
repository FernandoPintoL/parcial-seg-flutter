<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chat extends Model
{
    /** @use HasFactory<\Database\Factories\ChatFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'form_id',
        'user_id',
        'message',
        'is_system_message',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_system_message' => 'boolean',
    ];

    /**
     * Get the form that the chat message belongs to.
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(FormBuilder::class, 'form_id');
    }

    /**
     * Get the user that sent the chat message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
