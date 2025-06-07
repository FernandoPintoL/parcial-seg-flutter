<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chat extends Model
{
    /** @use HasFactory<\Database\Factories\ChatFactory> */
    use HasFactory;
    protected $table = 'chats';
    protected $primaryKey = 'id';
    public $timestamps = true;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'pizarra_id',
        'user_id',
        'user_name',
        'message',
        'is_system_message',
        'created_at',
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
    public function pizarra(): BelongsTo
    {
        return $this->belongsTo(Pizarra::class, 'form_id');
    }

    /**
     * Get the user that sent the chat message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
