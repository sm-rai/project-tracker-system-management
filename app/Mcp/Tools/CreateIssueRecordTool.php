<?php

namespace App\Mcp\Tools;

use App\Enums\IssueStatus;
use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Enums\RootCauseCategory;
use App\Models\Issue;
use App\Models\Project;
use App\Support\AppDateTime;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Query\Builder;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;

#[Name('create-tracker-issue-record')]
#[Description('Creates a confirmed tracker issue directly. Use create-tracker-issue for idempotent GitHub imports.')]
class CreateIssueRecordTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => [
                'nullable',
                'integer',
                Rule::exists((new Project)->getTable(), 'id')->where(
                    fn (Builder $query) => $query->whereIn('status', [
                        ProjectStatus::DeployedRunning->value,
                        ProjectStatus::DeployedMaintenance->value,
                    ]),
                ),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['required', Rule::enum(Priority::class)],
            'root_cause_category' => ['required', Rule::enum(RootCauseCategory::class)],
            'reported_at' => ['required', 'date'],
            'status' => ['nullable', Rule::enum(IssueStatus::class)],
            'resolved_at' => ['nullable', 'date'],
            'resolution_note' => ['nullable', 'string'],
            'confirmed' => ['required', 'accepted'],
        ], [
            'project_id.exists' => 'Project harus berstatus running atau maintenance.',
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum membuat issue.',
        ]);

        $reportedAt = AppDateTime::fromUserInput($validated['reported_at']);
        $status = IssueStatus::from($validated['status'] ?? IssueStatus::Open->value);
        $resolvedAt = isset($validated['resolved_at'])
            ? AppDateTime::fromUserInput($validated['resolved_at'])
            : ($status === IssueStatus::Resolved ? now() : null);

        if ($resolvedAt !== null && $resolvedAt->lt($reportedAt)) {
            throw ValidationException::withMessages([
                'resolved_at' => 'Waktu selesai tidak boleh mendahului waktu laporan.',
            ]);
        }

        if ($resolvedAt?->isFuture()) {
            throw ValidationException::withMessages([
                'resolved_at' => 'Waktu selesai tidak boleh berada di masa depan.',
            ]);
        }

        $issue = Issue::query()->create([
            'project_id' => $validated['project_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'root_cause_category' => $validated['root_cause_category'],
            'reported_at' => $reportedAt,
            'resolved_at' => $resolvedAt,
            'status' => $resolvedAt === null ? IssueStatus::Open : IssueStatus::Resolved,
            'resolution_note' => $validated['resolution_note'] ?? null,
        ]);

        $issue->refresh();

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'result' => 'created',
            'issue' => [
                'id' => $issue->id,
                'project_id' => $issue->project_id,
                'title' => $issue->title,
                'priority' => $issue->priority->value,
                'reported_at' => $issue->reported_at?->toIso8601String(),
                'due_date' => $issue->due_date?->toIso8601String(),
                'status' => $issue->status->value,
                'resolved_at' => $issue->resolved_at?->toIso8601String(),
                'is_on_time' => $issue->is_on_time,
            ],
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Eligible project ID. Omit only for a general infrastructure issue.'),
            'title' => $schema->string()->max(255)->required(),
            'description' => $schema->string()->required(),
            'priority' => $schema->string()->enum(array_column(Priority::cases(), 'value'))->required(),
            'root_cause_category' => $schema->string()->enum(array_column(RootCauseCategory::cases(), 'value'))->required(),
            'reported_at' => $schema->string()->description('Report timestamp in ISO 8601 format.')->required(),
            'status' => $schema->string()->enum(array_column(IssueStatus::cases(), 'value')),
            'resolved_at' => $schema->string()->description('Optional resolution timestamp in ISO 8601 format.'),
            'resolution_note' => $schema->string()->description('Optional resolution summary.'),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves the issue details.')->required(),
        ];
    }
}
