<?php

namespace App\Http\Requests;

use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Enums\RootCauseCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveIssueRequest extends FormRequest
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
            'project_id' => [
                'nullable',
                Rule::exists('projects', 'id')->where(function ($query) {
                    $query->whereIn('status', [
                        ProjectStatus::DeployedRunning->value,
                        ProjectStatus::DeployedMaintenance->value,
                    ]);
                }),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['required', Rule::enum(Priority::class)],
            'root_cause_category' => [
                'required',
                Rule::enum(RootCauseCategory::class),
            ],
            'reported_at' => ['required', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'project_id.exists' => 'Sistem terdampak tidak tersedia untuk pencatatan issue.',
            'title.required' => 'Ringkasan issue wajib diisi.',
            'title.max' => 'Ringkasan issue tidak boleh lebih dari 255 karakter.',
            'description.required' => 'Kronologi dan dampak wajib diisi.',
            'priority.required' => 'Prioritas penanganan wajib dipilih.',
            'priority.enum' => 'Prioritas penanganan tidak valid.',
            'root_cause_category.required' => 'Dugaan penyebab wajib dipilih.',
            'root_cause_category.enum' => 'Dugaan penyebab tidak valid.',
            'reported_at.required' => 'Waktu laporan wajib diisi.',
            'reported_at.date' => 'Waktu laporan harus berupa tanggal dan waktu yang valid.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'project_id' => 'sistem terdampak',
            'title' => 'ringkasan issue',
            'description' => 'kronologi dan dampak',
            'priority' => 'prioritas penanganan',
            'root_cause_category' => 'dugaan penyebab',
            'reported_at' => 'waktu laporan',
        ];
    }
}
