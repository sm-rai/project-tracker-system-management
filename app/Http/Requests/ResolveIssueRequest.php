<?php

namespace App\Http\Requests;

use App\Models\Issue;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class ResolveIssueRequest extends FormRequest
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
        $issue = $this->route('issue');

        return [
            'resolved_at' => [
                'bail',
                'nullable',
                'date',
                function (string $attribute, mixed $value, Closure $fail) use ($issue): void {
                    if (! $issue instanceof Issue) {
                        return;
                    }

                    $resolvedAt = Carbon::parse((string) $value);

                    if ($resolvedAt->lt($issue->reported_at)) {
                        $fail('Waktu selesai tidak boleh mendahului waktu laporan.');
                    }

                    if ($resolvedAt->gt(now())) {
                        $fail('Waktu selesai tidak boleh berada di masa depan.');
                    }
                },
            ],
            'resolution_note' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'resolved_at.date' => 'Waktu selesai harus berupa tanggal dan waktu yang valid.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'resolved_at' => 'waktu selesai',
            'resolution_note' => 'catatan penyelesaian',
        ];
    }
}
