<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PizarraWidget extends Model
{
    /** @use HasFactory<\Database\Factories\PizarraWidgetFactory> */
    use HasFactory;
    protected $table = 'pizarra_widgets';
    protected $primaryKey = 'id';
    public $timestamps = true;
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'widget_id',
        'pizarra_id',
        'name',
        'created_at',
        'updated_at'
    ];
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    /**
     * Get the widget associated with the PizarraWidget.
     */
    public function widget()
    {
        return $this->belongsTo(Widget::class, 'widget_id', 'id');
    }
    /**
     * Get the pizarra associated with the PizarraWidget.
     */
    public function pizarra()
    {
        return $this->belongsTo(Pizarra::class, 'pizarra_id', 'id');
    }
    /**
     * Get the propiedades associated with the PizarraWidget.
     */
    public function propiedades()
    {
        return $this->belongsToMany(Propiedades::class, 'widgets_propiedades', 'widget_id', 'propiedad_id')
            ->withPivot('value', 'defaultValue')
            ->withTimestamps();
    }
}
