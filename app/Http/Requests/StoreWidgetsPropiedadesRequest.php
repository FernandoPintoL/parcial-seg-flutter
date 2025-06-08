<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWidgetsPropiedadesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'widget_id' => 'required|exists:widgets,id',
            'propiedad_id' => 'required|exists:propiedades,id',
            'value' => 'nullable|string',
            'defaultValue' => 'nullable|string'
        ];
    }
}
