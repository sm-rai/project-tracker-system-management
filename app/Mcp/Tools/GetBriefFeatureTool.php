<?php

namespace App\Mcp\Tools;

use App\Models\BriefFeature;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('get-tracker-brief-feature')]
#[Description('Returns a Brief Feature and its project context before it is changed or deleted.')]
#[IsReadOnly]
class GetBriefFeatureTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'brief_feature_id' => ['required', 'integer', Rule::exists((new BriefFeature)->getTable(), 'id')],
        ]);

        $feature = BriefFeature::query()
            ->with('project:id,name,status')
            ->findOrFail($validated['brief_feature_id']);

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'brief_feature' => [
                'id' => $feature->id,
                'project_id' => $feature->project_id,
                'project_name' => $feature->project->name,
                'project_status' => $feature->project->status->value,
                'name' => $feature->name,
                'description' => $feature->description,
                'status' => $feature->status->value,
                'completed_at' => $feature->completed_at?->toIso8601String(),
                'created_at' => $feature->created_at?->toIso8601String(),
                'updated_at' => $feature->updated_at?->toIso8601String(),
            ],
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'brief_feature_id' => $schema->integer()->description('Brief Feature ID to inspect.')->required(),
        ];
    }
}
