<?php

namespace App\Mcp\Tools;

use App\Models\BriefFeature;
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

#[Name('delete-tracker-brief-feature')]
#[Description('Permanently deletes a Brief Feature after user confirmation.') ]
#[IsDestructive]
class DeleteBriefFeatureTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'brief_feature_id' => ['required', 'integer', Rule::exists((new BriefFeature)->getTable(), 'id')],
            'confirmed' => ['required', 'accepted'],
        ], [
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum menghapus Brief Feature.',
        ]);

        return DB::transaction(function () use ($validated): Response {
            $feature = BriefFeature::query()
                ->whereKey($validated['brief_feature_id'])
                ->lockForUpdate()
                ->firstOrFail();
            $deletedFeature = [
                'id' => $feature->id,
                'project_id' => $feature->project_id,
                'name' => $feature->name,
                'status' => $feature->status->value,
            ];
            $feature->delete();

            return Response::text(json_encode([
                'environment' => app()->environment(),
                'result' => 'deleted',
                'brief_feature' => $deletedFeature,
            ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        });
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'brief_feature_id' => $schema->integer()->description('Brief Feature ID to delete.')->required(),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves deletion.')->required(),
        ];
    }
}
