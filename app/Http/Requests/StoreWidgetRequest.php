<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWidgetRequest extends FormRequest
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
            'type' => 'required|string|unique:widgets,type',
            'label' => 'nullable|string',
            'icon' => 'nullable|string',
            'hasChildren' => 'boolean',
            'categoria_widget_id' => 'required|exists:categoria_widgets,id',
            'code_string' => 'nullable|string'
        ];
    }
}
