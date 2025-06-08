<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWidgetRequest extends FormRequest
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
            'type' => 'sometimes|required|string|unique:widgets,type,' . $this->route('widget')->id,
            'label' => 'nullable|string',
            'icon' => 'nullable|string',
            'hasChildren' => 'boolean',
            'categoria_widget_id' => 'sometimes|required|exists:categoria_widgets,id',
            'code_string' => 'nullable|string'
        ];
    }
}
