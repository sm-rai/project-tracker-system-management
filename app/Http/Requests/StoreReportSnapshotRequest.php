<?php

namespace App\Http\Requests;

use App\Models\ReportSnapshot;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportSnapshotRequest extends FormRequest
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
            'period_type' => ['required', 'string', Rule::in([
                ReportSnapshot::PeriodWeeklyDefault,
                ReportSnapshot::PeriodCustomRange,
            ])],
            'period_start_date' => [
                Rule::requiredIf($this->input('period_type') === ReportSnapshot::PeriodCustomRange),
                'nullable',
                'date',
            ],
            'period_end_date' => [
                Rule::requiredIf($this->input('period_type') === ReportSnapshot::PeriodCustomRange),
                'nullable',
                'date',
                'after_or_equal:period_start_date',
            ],
        ];
    }
}
