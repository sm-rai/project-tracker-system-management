<?php

namespace App\Mcp\Tools;

use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('list-brief-feature-projects')]
#[Description('Lists active projects that may receive Brief Features.')]
#[IsReadOnly]
class ListBriefFeatureProjectsTool extends Tool
{
    public function handle(Request $request): Response
    {
        $projects = Project::query()
            ->whereIn('status', [
                ProjectStatus::Planning->value,
                ProjectStatus::InProgress->value,
                ProjectStatus::DeployedRunning->value,
                ProjectStatus::DeployedMaintenance->value,
            ])
            ->withCount('briefFeatures')
            ->orderBy('name')
            ->get(['id', 'name', 'status'])
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status->value,
                'brief_features_count' => (int) $project->getAttribute('brief_features_count'),
            ])
            ->all();

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'projects' => $projects,
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /**
     * @return array<string, Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
