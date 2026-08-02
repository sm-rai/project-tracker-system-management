<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSlaConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'configs' => ['required', 'array'],
            'configs.urgent' => ['required', 'integer', 'min:1', 'max:8760'],
            'configs.normal' => ['required', 'integer', 'min:1', 'max:8760'],
            'configs.low' => ['required', 'integer', 'min:1', 'max:8760'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'configs.required' => 'Konfigurasi SLA wajib diisi.',
            'configs.array' => 'Format konfigurasi SLA tidak valid.',
            'configs.*.required' => ':attribute wajib diisi.',
            'configs.*.integer' => ':attribute harus berupa angka bulat.',
            'configs.*.min' => ':attribute minimal 1 jam.',
            'configs.*.max' => ':attribute maksimal 8.760 jam.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'configs.urgent' => 'Target SLA Mendesak',
            'configs.normal' => 'Target SLA Normal',
            'configs.low' => 'Target SLA Rendah',
        ];
    }
}
