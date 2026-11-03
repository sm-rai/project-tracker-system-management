<?php

namespace App\Mcp\Tools;

use App\Enums\BriefFeatureStatus;
use App\Models\BriefFeature;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;

#[Name('update-tracker-brief-feature')]
#[Description('Updates the confirmed name, description, or status of a Brief Feature. Completion timestamps follow the model lifecycle.')]
class UpdateBriefFeatureTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'brief_feature_id' => ['required', 'integer', Rule::exists((new BriefFeature)->getTable(), 'id')],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::enum(BriefFeatureStatus::class)],
            'confirmed' => ['required', 'accepted'],
        ], [
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum memperbarui Brief Feature.',
        ]);

        $updates = array_intersect_key($validated, array_flip(['name', 'description', 'status']));

        if ($updates === []) {
            throw ValidationException::withMessages([
                'brief_feature_id' => 'Berikan sedikitnya satu field Brief Feature yang ingin diperbarui.',
            ]);
        }

        return DB::transaction(function () use ($validated, $updates): Response {
            $feature = BriefFeature::query()
                ->whereKey($validated['brief_feature_id'])
                ->lockForUpdate()
                ->firstOrFail();
            $feature->update($updates);
            $feature->refresh();

            return Response::text(json_encode([
                'environment' => app()->environment(),
                'result' => 'updated',
                'brief_feature' => [
                    'id' => $feature->id,
                    'project_id' => $feature->project_id,
                    'name' => $feature->name,
                    'description' => $feature->description,
                    'status' => $feature->status->value,
                    'completed_at' => $feature->completed_at?->toIso8601String(),
                ],
            ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        });
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'brief_feature_id' => $schema->integer()->description('Brief Feature ID to update.')->required(),
            'name' => $schema->string()->description('New Brief Feature name.')->max(255),
            'description' => $schema->string()->description('Set to an empty string or null to clear.'),
            'status' => $schema->string()->enum(array_column(BriefFeatureStatus::cases(), 'value')),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves the changes.')->required(),
        ];
    }
}
