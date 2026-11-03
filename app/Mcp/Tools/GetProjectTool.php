<?php

namespace App\Mcp\Tools;

use App\Enums\BriefFeatureStatus;
use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('get-tracker-project')]
#[Description('Returns a project and its related record counts, useful for review before changing or deleting it.')]
#[IsReadOnly]
class GetProjectTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => ['required', 'integer', Rule::exists((new Project)->getTable(), 'id')],
        ]);

        $project = Project::query()
            ->with('users:id')
            ->withCount([
                'briefFeatures as brief_features_count',
                'briefFeatures as brief_features_done_count' => fn ($query) => $query->where('status', BriefFeatureStatus::Done->value),
                'issues',
                'featureRequests',
            ])
            ->findOrFail($validated['project_id']);
        $totalBriefFeatures = (int) $project->brief_features_count;

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'project' => [
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
            ],
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Project ID to inspect.')->required(),
        ];
    }
}
