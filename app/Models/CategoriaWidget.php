<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategoriaWidget extends Model
{
    /** @use HasFactory<\Database\Factories\CategoriaWidgetFactory> */
    use HasFactory;
    protected $table = 'categoria_widgets';
    protected $primaryKey = 'id';
    public $timestamps = true;
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'category',
        'label',
        'created_at',
        'updated_at'
    ];
}
