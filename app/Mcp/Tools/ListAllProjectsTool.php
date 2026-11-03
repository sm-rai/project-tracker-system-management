<?php

namespace App\Mcp\Tools;

use App\Enums\ProjectStatus;
use App\Models\Project;
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

#[Name('list-all-tracker-projects')]
#[Description('Lists all tracker projects across every lifecycle status, with filtering and pagination.')]
#[IsReadOnly]
class ListAllProjectsTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(ProjectStatus::class)],
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 50);
        $page = (int) ($validated['page'] ?? 1);
        $projects = Project::query()
            ->with('users:id')
            ->withCount([
                'briefFeatures as brief_features_count',
                'briefFeatures as brief_features_done_count' => fn (Builder $query): Builder => $query->where('status', 'done'),
                'issues',
                'featureRequests',
            ])
            ->when($validated['status'] ?? null, fn (Builder $query, string $status): Builder => $query->where('status', $status))
            ->when($validated['search'] ?? null, fn (Builder $query, string $search): Builder => $query
                ->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                }))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($perPage, [
                'id',
                'name',
                'description',
                'status',
                'start_date',
                'target_end_date',
                'actual_end_date',
                'created_by',
            ], 'page', $page);

        $items = $projects->getCollection()
            ->map(fn (Project $project): array => $this->projectData($project))
            ->all();

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'pagination' => [
                'total' => $projects->total(),
                'per_page' => $projects->perPage(),
                'current_page' => $projects->currentPage(),
                'last_page' => $projects->lastPage(),
            ],
            'projects' => $items,
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->enum(array_column(ProjectStatus::cases(), 'value')),
            'search' => $schema->string()->description('Matches the project name or description.'),
            'page' => $schema->integer()->min(1)->default(1),
            'per_page' => $schema->integer()->min(1)->max(100)->default(50),
        ];
    }

    /** @return array<string, mixed> */
    private function projectData(Project $project): array
    {
        $totalBriefFeatures = (int) $project->brief_features_count;

        return [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'status' => $project->status->value,
            'start_date' => $project->start_date?->toDateString(),
            'target_end_date' => $project->target_end_date?->toDateString(),
            'actual_end_date' => $project->actual_end_date?->toDateString(),
            'created_by' => $project->created_by,
            'assigned_user_ids' => $project->users->pluck('id')->map(fn (int $id): int => $id)->values()->all(),
            'realization_percentage' => $totalBriefFeatures === 0
                ? (in_array($project->status, [ProjectStatus::DeployedRunning, ProjectStatus::DeployedMaintenance], true) ? 100.0 : 0.0)
                : round(((int) $project->brief_features_done_count / $totalBriefFeatures) * 100, 2),
            'brief_features_count' => $totalBriefFeatures,
            'issues_count' => (int) $project->issues_count,
            'feature_requests_count' => (int) $project->feature_requests_count,
        ];
    }
}
