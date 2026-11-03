<?php

namespace App\Mcp\Tools;

use App\Models\FeatureRequest;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('get-tracker-feature-request')]
#[Description('Returns a complete feature request and project context before it is changed or deleted.')]
#[IsReadOnly]
class GetFeatureRequestTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'feature_request_id' => ['required', 'integer', Rule::exists((new FeatureRequest)->getTable(), 'id')],
        ]);

        $featureRequest = FeatureRequest::query()
            ->with('project:id,name,status')
            ->findOrFail($validated['feature_request_id']);

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'feature_request' => [
                'id' => $featureRequest->id,
                'project_id' => $featureRequest->project_id,
                'project_name' => $featureRequest->project->name,
                'project_status' => $featureRequest->project->status->value,
                'title' => $featureRequest->title,
                'description' => $featureRequest->description,
                'priority' => $featureRequest->priority->value,
                'requested_at' => $featureRequest->requested_at?->toIso8601String(),
                'due_date' => $featureRequest->due_date?->toIso8601String(),
                'fulfilled_at' => $featureRequest->fulfilled_at?->toIso8601String(),
                'fulfillment_note' => $featureRequest->fulfillment_note,
                'status' => $featureRequest->status->value,
                'is_on_time' => $featureRequest->is_on_time,
                'created_at' => $featureRequest->created_at?->toIso8601String(),
                'updated_at' => $featureRequest->updated_at?->toIso8601String(),
            ],
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_request_id' => $schema->integer()->description('Feature Request ID to inspect.')->required(),
        ];
    }
}
