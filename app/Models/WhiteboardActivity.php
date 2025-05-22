<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhiteboardActivity extends Model
{
    protected $table = 'whiteboard_activities';
    protected $primaryKey = 'id';
    public $incrementing = true;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'pizarra_id',
        'user_id',
        'action_type',
        'action_data',
        'description',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'action_data' => 'json',
    ];

    /**
     * Get the form that the activity belongs to.
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(FormBuilder::class, 'form_id');
    }

    /**
     * Get the user that performed the activity.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
