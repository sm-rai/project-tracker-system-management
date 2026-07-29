<?php

namespace App\Http\Requests;

use App\Enums\BriefFeatureStatus;
use App\Enums\ProjectStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'start_date' => ['nullable', 'date'],
            'target_end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'actual_end_date' => ['nullable', 'date'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'brief_features' => ['nullable', 'array'],
            'brief_features.*.name' => ['required_with:brief_features', 'string', 'max:255'],
            'brief_features.*.description' => ['nullable', 'string'],
            'brief_features.*.status' => ['nullable', Rule::enum(BriefFeatureStatus::class)],
        ];
    }
}
