<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Propiedades extends Model
{
    /** @use HasFactory<\Database\Factories\PropiedadesFactory> */
    use HasFactory;
    protected $table = 'propiedades';
    protected $primaryKey = 'id';
    public $timestamps = true;
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'type',
        'defaultValue'
    ];
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'defaultValue' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    /**
     * Get the widgets associated with the Propiedades.
     */
    public function widgets()
    {
        return $this->belongsToMany(PizarraWidget::class, 'widgets_propiedades', 'propiedad_id', 'widget_id')
            ->withPivot('value', 'defaultValue')
            ->withTimestamps();
    }
    /**
     * Get the widgets that have this property as a default.
     */
    public function widgetsWithDefault()
    {
        return $this->belongsToMany(PizarraWidget::class, 'widgets_propiedades', 'propiedad_id', 'widget_id')
            ->wherePivot('defaultValue', $this->defaultValue)
            ->withPivot('value', 'defaultValue')
            ->withTimestamps();
    }
}
