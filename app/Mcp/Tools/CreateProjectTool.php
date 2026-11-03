<?php

namespace App\Mcp\Tools;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
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

#[Name('create-tracker-project')]
#[Description('Creates a project after user confirmation. Remote calls use the authenticated token owner as creator; local calls must provide created_by.')]
class CreateProjectTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'start_date' => ['nullable', 'date'],
            'target_end_date' => ['nullable', 'date'],
            'actual_end_date' => ['nullable', 'date'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', Rule::exists((new User)->getTable(), 'id')->whereNull('deleted_at')],
            'created_by' => [
                'nullable',
                'integer',
                Rule::exists((new User)->getTable(), 'id')->whereNull('deleted_at'),
            ],
            'confirmed' => ['required', 'accepted'],
        ], [
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum membuat project.',
        ]);

        $creator = $request->user();
        $creatorId = $creator instanceof User
            ? (int) $creator->getAuthIdentifier()
            : ($validated['created_by'] ?? null);

        if ($creatorId === null) {
            throw ValidationException::withMessages([
                'created_by' => 'created_by wajib diberikan pada koneksi lokal yang tidak memiliki pengguna terautentikasi.',
            ]);
        }

        $startDate = $validated['start_date'] ?? null;
        $targetEndDate = $validated['target_end_date'] ?? null;

        if (
            $startDate !== null
            && $targetEndDate !== null
            && Carbon::parse($targetEndDate)->startOfDay()->lt(Carbon::parse($startDate)->startOfDay())
        ) {
            throw ValidationException::withMessages([
                'target_end_date' => 'Tanggal target tidak boleh mendahului tanggal mulai.',
            ]);
        }

        $project = DB::transaction(function () use ($validated, $creatorId, $startDate, $targetEndDate): Project {
            $project = Project::query()->create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'],
                'start_date' => $startDate,
                'target_end_date' => $targetEndDate,
                'actual_end_date' => $validated['actual_end_date'] ?? null,
                'created_by' => (int) $creatorId,
            ]);

            if (array_key_exists('user_ids', $validated)) {
                $project->users()->sync($validated['user_ids'] ?? []);
            }

            return $project->load('users:id');
        });

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'result' => 'created',
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status->value,
                'created_by' => $project->created_by,
                'assigned_user_ids' => $project->users->pluck('id')->map(fn (int $id): int => $id)->values()->all(),
            ],
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'name' => $schema->string()->description('Project name.')->max(255)->required(),
            'description' => $schema->string()->description('Optional project description.'),
            'status' => $schema->string()->enum(array_column(ProjectStatus::cases(), 'value'))->required(),
            'start_date' => $schema->string()->description('Optional project start date in YYYY-MM-DD format.'),
            'target_end_date' => $schema->string()->description('Optional target end date in YYYY-MM-DD format.'),
            'actual_end_date' => $schema->string()->description('Optional actual completion date in YYYY-MM-DD format.'),
            'user_ids' => $schema->array()->items($schema->integer())->description('Optional list of existing active user IDs assigned to the project.'),
            'created_by' => $schema->integer()->description('Required only for local calls without an authenticated user.'),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves the project details.')->required(),
        ];
    }
}
