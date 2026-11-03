<?php

namespace App\Mcp\Tools;

use App\Models\FeatureRequest;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsDestructive;

#[Name('delete-tracker-feature-request')]
#[Description('Permanently deletes a Feature Request after user confirmation.')]
#[IsDestructive]
class DeleteFeatureRequestTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'feature_request_id' => ['required', 'integer', Rule::exists((new FeatureRequest)->getTable(), 'id')],
            'confirmed' => ['required', 'accepted'],
        ], [
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum menghapus feature request.',
        ]);

        return DB::transaction(function () use ($validated): Response {
            $featureRequest = FeatureRequest::query()
                ->whereKey($validated['feature_request_id'])
                ->lockForUpdate()
                ->firstOrFail();
            $deletedFeatureRequest = [
                'id' => $featureRequest->id,
                'project_id' => $featureRequest->project_id,
                'title' => $featureRequest->title,
                'status' => $featureRequest->status->value,
            ];
            $featureRequest->delete();

            return Response::text(json_encode([
                'environment' => app()->environment(),
                'result' => 'deleted',
                'feature_request' => $deletedFeatureRequest,
            ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        });
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_request_id' => $schema->integer()->description('Feature Request ID to delete.')->required(),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves deletion.')->required(),
        ];
    }
}
