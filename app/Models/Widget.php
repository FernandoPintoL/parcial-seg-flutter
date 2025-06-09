<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Widget extends Model
{
    /** @use HasFactory<\Database\Factories\WidgetFactory> */
    use HasFactory;
    protected $table = 'widgets';
    protected $primaryKey = 'id';
    public $timestamps = true;
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'type',
        'label',
        'icon',
        'hasChildren',
        'categoria_widget_id',
        'code_string',
        'created_at',
        'updated_at'
    ];
    /**
     * Get the category associated with the widget.
     */
    public function categoria()
    {
        return $this->belongsTo(CategoriaWidget::class, 'categoria_widget_id', 'id');
    }
    /**
     * Get the pizarras associated with the widget.
     */
    public function pizarras()
    {
        return $this->belongsToMany(Pizarra::class, 'pizarra_widgets', 'widget_id', 'pizarra_id')
            ->withPivot('name')
            ->withTimestamps();
    }
    /**
     * Get the propiedades associated with the widget.
     */
    public function propiedades()
    {
        return $this->belongsToMany(Propiedades::class, 'widgets_propiedades', 'widget_id', 'propiedad_id')
            ->withPivot('value', 'defaultValue')
            ->withTimestamps();
    }
    /**
     * Get the propiedades that have this widget as a default.
     */
    public function propiedadesWithDefault()
    {
        return $this->belongsToMany(Propiedades::class, 'widgets_propiedades', 'widget_id', 'propiedad_id')
            ->wherePivot('defaultValue', true)
            ->withPivot('value', 'defaultValue')
            ->withTimestamps();
    }
}
