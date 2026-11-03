<?php

namespace App\Mcp\Tools;

use App\Enums\BriefFeatureStatus;
use App\Models\BriefFeature;
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

#[Name('list-tracker-brief-features')]
#[Description('Lists Brief Features with optional project, status, and text filters.')]
#[IsReadOnly]
class ListBriefFeaturesTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => ['nullable', 'integer', Rule::exists('projects', 'id')],
            'status' => ['nullable', Rule::enum(BriefFeatureStatus::class)],
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $features = BriefFeature::query()
            ->with('project:id,name')
            ->when($validated['project_id'] ?? null, fn (Builder $query, int $projectId): Builder => $query->where('project_id', $projectId))
            ->when($validated['status'] ?? null, fn (Builder $query, string $status): Builder => $query->where('status', $status))
            ->when($validated['search'] ?? null, fn (Builder $query, string $search): Builder => $query
                ->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                }))
            ->latest('id')
            ->paginate(
                (int) ($validated['per_page'] ?? 50),
                ['id', 'project_id', 'name', 'description', 'status', 'completed_at', 'created_at', 'updated_at'],
                'page',
                (int) ($validated['page'] ?? 1),
            );

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'pagination' => [
                'total' => $features->total(),
                'per_page' => $features->perPage(),
                'current_page' => $features->currentPage(),
                'last_page' => $features->lastPage(),
            ],
            'brief_features' => $features->getCollection()
                ->map(fn (BriefFeature $feature): array => $this->featureData($feature))
                ->all(),
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Filter to one project.'),
            'status' => $schema->string()->enum(array_column(BriefFeatureStatus::cases(), 'value')),
            'search' => $schema->string()->description('Matches the Brief Feature name or description.'),
            'page' => $schema->integer()->min(1)->default(1),
            'per_page' => $schema->integer()->min(1)->max(100)->default(50),
        ];
    }

    /** @return array<string, mixed> */
    private function featureData(BriefFeature $feature): array
    {
        return [
            'id' => $feature->id,
            'project_id' => $feature->project_id,
            'project_name' => $feature->project->name,
            'name' => $feature->name,
            'description' => $feature->description,
            'status' => $feature->status->value,
            'completed_at' => $feature->completed_at?->toIso8601String(),
            'created_at' => $feature->created_at?->toIso8601String(),
            'updated_at' => $feature->updated_at?->toIso8601String(),
        ];
    }
}
