<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WidgetsPropiedades extends Model
{
    /** @use HasFactory<\Database\Factories\WidgetsPropiedadesFactory> */
    use HasFactory;
    protected $table = 'widgets_propiedades';
    protected $primaryKey = 'id';
    public $timestamps = true;
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'widget_id',
        'propiedad_id',
        'value',
        'defaultValue',
        'created_at',
        'updated_at'
    ];
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'value' => 'string',
        'defaultValue' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    /**
     * Get the widget associated with the WidgetsPropiedades.
     */
    public function widget()
    {
        return $this->belongsTo(Widget::class, 'widget_id', 'id');
    }
    /**
     * Get the propiedad associated with the WidgetsPropiedades.
     */
    public function propiedad()
    {
        return $this->belongsTo(Propiedades::class, 'propiedad_id', 'id');
    }
    /**
     * Get the pizarra widgets associated with the WidgetsPropiedades.
     */
    public function pizarraWidgets()
    {
        return $this->belongsToMany(PizarraWidget::class, 'pizarra_widgets', 'widget_id', 'pizarra_id')
            ->withPivot('name')
            ->withTimestamps();
    }
    /**
     * Get the widgets that have this property as a default.
     */
    public function widgetsWithDefault()
    {
        return $this->belongsToMany(Widget::class, 'widgets_propiedades', 'propiedad_id', 'widget_id')
            ->wherePivot('defaultValue', $this->defaultValue)
            ->withPivot('value', 'defaultValue')
            ->withTimestamps();
    }
}
