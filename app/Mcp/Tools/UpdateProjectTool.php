<?php

namespace App\Mcp\Tools;

use App\Enums\ProjectStatus;
use App\Models\Project;
use Carbon\Carbon;
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

#[Name('update-tracker-project')]
#[Description('Updates confirmed project fields while preserving lifecycle date rules.')]
class UpdateProjectTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => ['required', 'integer', Rule::exists((new Project)->getTable(), 'id')],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::enum(ProjectStatus::class)],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'target_end_date' => ['sometimes', 'nullable', 'date'],
            'actual_end_date' => ['sometimes', 'nullable', 'date'],
            'user_ids' => ['sometimes', 'array'],
            'user_ids.*' => ['integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'confirmed' => ['required', 'accepted'],
        ], [
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum memperbarui project.',
        ]);

        $project = Project::query()->findOrFail($validated['project_id']);
        $updates = array_intersect_key($validated, array_flip([
            'name',
            'description',
            'status',
            'start_date',
            'target_end_date',
            'actual_end_date',
            'user_ids',
        ]));

        if ($updates === []) {
            throw ValidationException::withMessages([
                'project_id' => 'Berikan sedikitnya satu field project yang ingin diperbarui.',
            ]);
        }

        $startDate = array_key_exists('start_date', $updates)
            ? $updates['start_date']
            : $project->start_date?->toDateString();
        $targetEndDate = array_key_exists('target_end_date', $updates)
            ? $updates['target_end_date']
            : $project->target_end_date?->toDateString();

        if (
            $startDate !== null
            && $targetEndDate !== null
            && Carbon::parse($targetEndDate)->lt(Carbon::parse($startDate))
        ) {
            throw ValidationException::withMessages([
                'target_end_date' => 'Tanggal target tidak boleh mendahului tanggal mulai.',
            ]);
        }

        $newStatus = ProjectStatus::from($updates['status'] ?? $project->status->value);
        $developmentStatuses = [
            ProjectStatus::Planning,
            ProjectStatus::InProgress,
            ProjectStatus::OnHold,
        ];
        $deployedStatuses = [
            ProjectStatus::CompletedPendingDeployment,
            ProjectStatus::DeployedRunning,
            ProjectStatus::DeployedMaintenance,
        ];

        if (
            in_array($project->status, $developmentStatuses, true)
            && in_array($newStatus, $deployedStatuses, true)
            && empty($updates['actual_end_date'])
            && $project->actual_end_date === null
        ) {
            $updates['actual_end_date'] = now()->toDateString();
        }

        $project = DB::transaction(function () use ($project, $updates): Project {
            $project = Project::query()->whereKey($project->id)->lockForUpdate()->firstOrFail();
            $hasUserIds = array_key_exists('user_ids', $updates);
            $userIds = $updates['user_ids'] ?? [];
            unset($updates['user_ids']);
            $project->update($updates);

            if ($hasUserIds) {
                $project->users()->sync($userIds);
            }

            return $project->load('users:id');
        });

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'result' => 'updated',
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status->value,
                'start_date' => $project->start_date?->toDateString(),
                'target_end_date' => $project->target_end_date?->toDateString(),
                'actual_end_date' => $project->actual_end_date?->toDateString(),
                'assigned_user_ids' => $project->users->pluck('id')->map(fn (int $id): int => $id)->values()->all(),
            ],
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Project ID to update.')->required(),
            'name' => $schema->string()->max(255),
            'description' => $schema->string()->description('Set to an empty string or null to clear.'),
            'status' => $schema->string()->enum(array_column(ProjectStatus::cases(), 'value')),
            'start_date' => $schema->string()->description('Set to null to clear the start date.'),
            'target_end_date' => $schema->string()->description('Set to null to clear the target date.'),
            'actual_end_date' => $schema->string()->description('Set to null to clear the actual completion date.'),
            'user_ids' => $schema->array()->items($schema->integer())->description('Replace the project assignments with these active user IDs.'),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves the changes.')->required(),
        ];
    }
}
