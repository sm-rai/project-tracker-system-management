<?php

namespace App\Http\Requests;

use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Models\FeatureRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveFeatureRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $featureRequest = $this->route('feature_request');

        return $featureRequest instanceof FeatureRequest
            ? $this->user()->can('update', $featureRequest)
            : $this->user()->can('create', FeatureRequest::class);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'project_id' => [
                'required',
                Rule::exists('projects', 'id')->where(fn ($query) => $query->whereIn('status', [
                    ProjectStatus::DeployedRunning->value,
                    ProjectStatus::DeployedMaintenance->value,
                ])),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['required', Rule::enum(Priority::class)],
            'requested_at' => ['required', 'date'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'project_id.required' => 'Sistem terkait wajib dipilih.',
            'project_id.exists' => 'Sistem terkait harus sudah berjalan atau dalam pemeliharaan.',
            'title.required' => 'Ringkasan feature request wajib diisi.',
            'description.required' => 'Kebutuhan feature request wajib dijelaskan.',
            'priority.required' => 'Prioritas wajib dipilih.',
            'priority.enum' => 'Prioritas tidak valid.',
            'requested_at.required' => 'Waktu permintaan wajib diisi.',
            'requested_at.date' => 'Waktu permintaan tidak valid.',
        ];
    }
}
