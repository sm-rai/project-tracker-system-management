<?php

namespace App\Mcp\Tools;

use App\Enums\BriefFeatureStatus;
use App\Enums\ProjectStatus;
use App\Models\BriefFeature;
use App\Models\Project;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Query\Builder;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;

#[Name('create-tracker-brief-features')]
#[Description('Atomically creates a user-confirmed batch of Brief Features for an active project without duplicating existing names.')]
#[IsIdempotent]
class CreateBriefFeaturesTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => [
                'required',
                'integer',
                Rule::exists((new Project)->getTable(), 'id')->where(
                    fn (Builder $query) => $query->whereIn('status', $this->eligibleProjectStatuses()),
                ),
            ],
            'features' => ['required', 'array', 'min:1', 'max:100'],
            'features.*.name' => ['required', 'string', 'max:255'],
            'features.*.description' => ['nullable', 'string'],
            'features.*.status' => ['nullable', Rule::enum(BriefFeatureStatus::class)],
            'confirmed' => ['required', 'accepted'],
        ], [
            'project_id.exists' => 'Project harus aktif untuk menerima Brief Feature.',
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum membuat Brief Feature.',
        ]);

        $features = collect($this->normalizeFeatures($validated['features']));
        $duplicateNames = $features
            ->countBy('comparison_key')
            ->filter(fn (int $count): bool => $count > 1)
            ->keys();

        if ($duplicateNames->isNotEmpty()) {
            throw ValidationException::withMessages([
                'features' => 'Payload memuat nama Brief Feature duplikat: '.$duplicateNames->implode(', ').'.',
            ]);
        }

        $projectId = (int) $validated['project_id'];
        $lock = Cache::lock("project-tracker:brief-features:project:{$projectId}", 10);

        if (! $lock->get()) {
            return Response::error('Brief Feature untuk project ini sedang diproses. Coba lagi setelah proses tersebut selesai.');
        }

        try {
            return DB::transaction(function () use ($features, $projectId): Response {
                $project = Project::query()
                    ->whereKey($projectId)
                    ->whereIn('status', $this->eligibleProjectStatuses())
                    ->lockForUpdate()
                    ->first();

                if ($project === null) {
                    throw ValidationException::withMessages([
                        'project_id' => 'Project harus aktif untuk menerima Brief Feature.',
                    ]);
                }

                $existingBriefFeatures = BriefFeature::query()
                    ->where('project_id', $project->id)
                    ->get(['id', 'project_id', 'name', 'status', 'completed_at'])
                    ->keyBy(fn (BriefFeature $briefFeature): string => $this->comparisonKey($briefFeature->name));

                $records = [];
                $createdCount = 0;
                $existingCount = 0;

                foreach ($features as $feature) {
                    $existing = $existingBriefFeatures->get($feature['comparison_key']);

                    if ($existing instanceof BriefFeature) {
                        $records[] = $this->record('existing', $existing);
                        $existingCount++;

                        continue;
                    }

                    $briefFeature = BriefFeature::query()->create([
                        'project_id' => $project->id,
                        'name' => $feature['name'],
                        'description' => $feature['description'],
                        'status' => $feature['status'],
                    ]);

                    $records[] = $this->record('created', $briefFeature);
                    $existingBriefFeatures->put($feature['comparison_key'], $briefFeature);
                    $createdCount++;
                }

                return Response::text(json_encode([
                    'environment' => app()->environment(),
                    'project_id' => $project->id,
                    'created_count' => $createdCount,
                    'existing_count' => $existingCount,
                    'records' => $records,
                ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
            });
        } finally {
            $lock->release();
        }
    }

    /**
     * @return array<string, Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Active tracker project ID.')->required(),
            'features' => $schema->array()
                ->items($schema->object([
                    'name' => $schema->string()->description('Brief Feature name.')->required(),
                    'description' => $schema->string()->description('Optional implementation scope.'),
                    'status' => $schema->string()
                        ->enum(array_column(BriefFeatureStatus::cases(), 'value'))
                        ->default(BriefFeatureStatus::Todo->value),
                ])->withoutAdditionalProperties())
                ->min(1)
                ->max(100)
                ->required(),
            'confirmed' => $schema->boolean()
                ->description('Must be true only after the user approves the preview.')
                ->required(),
        ];
    }

    /**
     * @param  array<int, array{name: string, description?: string|null, status?: string}>  $features
     * @return list<array{name: string, description: string|null, status: string, comparison_key: string}>
     */
    private function normalizeFeatures(array $features): array
    {
        $normalizedFeatures = [];

        foreach ($features as $feature) {
            $name = Str::squish($feature['name']);

            if ($name === '') {
                throw ValidationException::withMessages([
                    'features' => 'Nama Brief Feature tidak boleh kosong.',
                ]);
            }

            $normalizedFeatures[] = [
                'name' => $name,
                'description' => $feature['description'] ?? null,
                'status' => $feature['status'] ?? BriefFeatureStatus::Todo->value,
                'comparison_key' => $this->comparisonKey($name),
            ];
        }

        return $normalizedFeatures;
    }

    private function comparisonKey(string $name): string
    {
        return Str::lower(Str::squish($name));
    }

    /**
     * @return list<string>
     */
    private function eligibleProjectStatuses(): array
    {
        return [
            ProjectStatus::Planning->value,
            ProjectStatus::InProgress->value,
            ProjectStatus::DeployedRunning->value,
            ProjectStatus::DeployedMaintenance->value,
        ];
    }

    /**
     * @return array{result: string, id: int, name: string, status: string, completed_at: string|null}
     */
    private function record(string $result, BriefFeature $briefFeature): array
    {
        return [
            'result' => $result,
            'id' => $briefFeature->id,
            'name' => $briefFeature->name,
            'status' => $briefFeature->status->value,
            'completed_at' => $briefFeature->completed_at?->toIso8601String(),
        ];
    }
}
