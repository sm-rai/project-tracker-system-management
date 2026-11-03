<?php

namespace App\Mcp\Tools;

use App\Enums\IssueStatus;
use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Enums\RootCauseCategory;
use App\Models\Issue;
use App\Models\Project;
use App\Models\SlaConfig;
use App\Support\AppDateTime;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;

#[Name('update-tracker-issue')]
#[Description('Updates issue details, recalculates SLA deadlines, and applies issue resolution or reopening lifecycle rules after confirmation.')]
class UpdateIssueTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'issue_id' => ['required', 'integer', Rule::exists((new Issue)->getTable(), 'id')],
            'project_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists((new Project)->getTable(), 'id')->where(
                    fn (Builder $query) => $query->whereIn('status', [
                        ProjectStatus::DeployedRunning->value,
                        ProjectStatus::DeployedMaintenance->value,
                    ]),
                ),
            ],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'priority' => ['sometimes', 'required', Rule::enum(Priority::class)],
            'root_cause_category' => ['sometimes', 'required', Rule::enum(RootCauseCategory::class)],
            'reported_at' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', 'required', Rule::enum(IssueStatus::class)],
            'resolved_at' => ['sometimes', 'nullable', 'date'],
            'resolution_note' => ['sometimes', 'nullable', 'string'],
            'confirmed' => ['required', 'accepted'],
        ], [
            'project_id.exists' => 'Project harus berstatus running atau maintenance.',
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum memperbarui issue.',
        ]);

        $updates = array_intersect_key($validated, array_flip([
            'project_id',
            'title',
            'description',
            'priority',
            'root_cause_category',
            'reported_at',
            'status',
            'resolved_at',
            'resolution_note',
        ]));

        if ($updates === []) {
            throw ValidationException::withMessages([
                'issue_id' => 'Berikan sedikitnya satu field issue yang ingin diperbarui.',
            ]);
        }

        return DB::transaction(function () use ($validated, $updates): Response {
            $issue = Issue::query()
                ->whereKey($validated['issue_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $reportedAt = array_key_exists('reported_at', $updates)
                ? AppDateTime::fromUserInput($updates['reported_at'])
                : $issue->reported_at;
            $priority = Priority::from($updates['priority'] ?? $issue->priority->value);

            if (array_key_exists('reported_at', $updates)) {
                $updates['reported_at'] = $reportedAt;
            }

            if (array_key_exists('reported_at', $updates) || array_key_exists('priority', $updates)) {
                $updates['due_date'] = $reportedAt->copy()->addHours(SlaConfig::hoursForPriority($priority));
            }

            $status = IssueStatus::from($updates['status'] ?? $issue->status->value);
            $resolvedAtValue = $updates['resolved_at'] ?? null;
            $isReopeningByClearingResolvedAt = ! array_key_exists('status', $updates)
                && array_key_exists('resolved_at', $updates)
                && $resolvedAtValue === null;

            if ($isReopeningByClearingResolvedAt) {
                $updates['status'] = IssueStatus::Open;
                $updates['resolved_at'] = null;
                $updates['is_on_time'] = null;
            } elseif (
                $status === IssueStatus::Resolved
                || (! array_key_exists('status', $updates) && array_key_exists('resolved_at', $updates) && $resolvedAtValue !== null)
            ) {
                $resolvedAt = $resolvedAtValue !== null
                    ? AppDateTime::fromUserInput($resolvedAtValue)
                    : ($issue->resolved_at ?? now());

                if ($resolvedAt->lt($reportedAt)) {
                    throw ValidationException::withMessages([
                        'resolved_at' => 'Waktu selesai tidak boleh mendahului waktu laporan.',
                    ]);
                }

                if ($resolvedAt->isFuture()) {
                    throw ValidationException::withMessages([
                        'resolved_at' => 'Waktu selesai tidak boleh berada di masa depan.',
                    ]);
                }

                $updates['status'] = IssueStatus::Resolved;
                $updates['resolved_at'] = $resolvedAt;
            } elseif ($status === IssueStatus::Open || (array_key_exists('resolved_at', $updates) && $resolvedAtValue === null)) {
                $updates['status'] = IssueStatus::Open;
                $updates['resolved_at'] = null;
                $updates['is_on_time'] = null;
            }

            $issue->forceFill($updates)->save();
            $issue->refresh();

            return Response::text(json_encode([
                'environment' => app()->environment(),
                'result' => 'updated',
                'issue' => [
                    'id' => $issue->id,
                    'project_id' => $issue->project_id,
                    'title' => $issue->title,
                    'priority' => $issue->priority->value,
                    'reported_at' => $issue->reported_at?->toIso8601String(),
                    'due_date' => $issue->due_date?->toIso8601String(),
                    'status' => $issue->status->value,
                    'resolved_at' => $issue->resolved_at?->toIso8601String(),
                    'resolution_note' => $issue->resolution_note,
                    'is_on_time' => $issue->is_on_time,
                ],
            ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        });
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'issue_id' => $schema->integer()->description('Issue ID to update.')->required(),
            'project_id' => $schema->integer()->description('Eligible project ID, or null to make this an infrastructure issue.'),
            'title' => $schema->string()->max(255),
            'description' => $schema->string(),
            'priority' => $schema->string()->enum(array_column(Priority::cases(), 'value')),
            'root_cause_category' => $schema->string()->enum(array_column(RootCauseCategory::cases(), 'value')),
            'reported_at' => $schema->string()->description('Report timestamp in ISO 8601 format.'),
            'status' => $schema->string()->enum(array_column(IssueStatus::cases(), 'value')),
            'resolved_at' => $schema->string()->description('Set to null to reopen, or provide a resolution timestamp.'),
            'resolution_note' => $schema->string()->description('Optional resolution summary.'),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves the changes.')->required(),
        ];
    }
}
