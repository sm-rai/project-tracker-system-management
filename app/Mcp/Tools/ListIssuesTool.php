<?php

namespace App\Mcp\Tools;

use App\Enums\IssueStatus;
use App\Enums\Priority;
use App\Enums\RootCauseCategory;
use App\Models\Issue;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('list-tracker-issues')]
#[Description('Lists issues with optional project, status, priority, root-cause, overdue, and text filters.')]
#[IsReadOnly]
class ListIssuesTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => ['nullable', 'integer', Rule::exists('projects', 'id')],
            'status' => ['nullable', Rule::enum(IssueStatus::class)],
            'priority' => ['nullable', Rule::enum(Priority::class)],
            'root_cause_category' => ['nullable', Rule::enum(RootCauseCategory::class)],
            'search' => ['nullable', 'string', 'max:255'],
            'overdue' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $issues = Issue::query()
            ->with('project:id,name')
            ->when($validated['project_id'] ?? null, fn (Builder $query, int $projectId): Builder => $query->where('project_id', $projectId))
            ->when($validated['status'] ?? null, fn (Builder $query, string $status): Builder => $query->where('status', $status))
            ->when($validated['priority'] ?? null, fn (Builder $query, string $priority): Builder => $query->where('priority', $priority))
            ->when($validated['root_cause_category'] ?? null, fn (Builder $query, string $rootCause): Builder => $query->where('root_cause_category', $rootCause))
            ->when($validated['search'] ?? null, fn (Builder $query, string $search): Builder => $query
                ->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                }))
            ->when($validated['overdue'] ?? false, fn (Builder $query): Builder => $query
                ->where('status', IssueStatus::Open->value)
                ->where('due_date', '<', now()))
            ->orderByDesc('reported_at')
            ->orderByDesc('id')
            ->paginate(
                (int) ($validated['per_page'] ?? 50),
                ['id', 'project_id', 'title', 'description', 'priority', 'root_cause_category', 'reported_at', 'due_date', 'resolved_at', 'status', 'resolution_note', 'is_on_time', 'created_at', 'updated_at'],
                'page',
                (int) ($validated['page'] ?? 1),
            );

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'pagination' => [
                'total' => $issues->total(),
                'per_page' => $issues->perPage(),
                'current_page' => $issues->currentPage(),
                'last_page' => $issues->lastPage(),
            ],
            'issues' => $issues->getCollection()
                ->map(fn (Issue $issue): array => $this->issueData($issue))
                ->all(),
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Filter to one project. Omit to include all issues, including infrastructure issues without a project.'),
            'status' => $schema->string()->enum(array_column(IssueStatus::cases(), 'value')),
            'priority' => $schema->string()->enum(array_column(Priority::cases(), 'value')),
            'root_cause_category' => $schema->string()->enum(array_column(RootCauseCategory::cases(), 'value')),
            'search' => $schema->string()->description('Matches issue title or description.'),
            'overdue' => $schema->boolean()->description('When true, lists only open issues past their due date.'),
            'page' => $schema->integer()->min(1)->default(1),
            'per_page' => $schema->integer()->min(1)->max(100)->default(50),
        ];
    }

    /** @return array<string, mixed> */
    private function issueData(Issue $issue): array
    {
        return [
            'id' => $issue->id,
            'project_id' => $issue->project_id,
            'project_name' => $issue->project?->name,
            'title' => $issue->title,
            'description' => $issue->description,
            'priority' => $issue->priority->value,
            'root_cause_category' => $issue->root_cause_category->value,
            'reported_at' => $issue->reported_at?->toIso8601String(),
            'due_date' => $issue->due_date?->toIso8601String(),
            'resolved_at' => $issue->resolved_at?->toIso8601String(),
            'status' => $issue->status->value,
            'resolution_note' => $issue->resolution_note,
            'is_on_time' => $issue->is_on_time,
            'created_at' => $issue->created_at?->toIso8601String(),
            'updated_at' => $issue->updated_at?->toIso8601String(),
        ];
    }
}
