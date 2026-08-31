<?php

namespace App\Mcp\Tools;

use App\Enums\IssueStatus;
use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Enums\RootCauseCategory;
use App\Mcp\Support\GithubImportSource;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Support\AppDateTime;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Query\Builder;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsIdempotent;

#[Name('create-tracker-issue')]
#[Description('Creates an issue from a user-confirmed GitHub candidate. The canonical source_url prevents duplicate imports.')]
#[IsIdempotent]
class CreateIssueTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => [
                'nullable',
                'integer',
                Rule::exists((new Project)->getTable(), 'id')->where(
                    fn (Builder $query) => $query->whereIn('status', [
                        ProjectStatus::DeployedRunning->value,
                        ProjectStatus::DeployedMaintenance->value,
                    ]),
                ),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['required', Rule::enum(Priority::class)],
            'root_cause_category' => ['required', Rule::enum(RootCauseCategory::class)],
            'reported_at' => ['required', 'date'],
            'resolved_at' => ['nullable', 'date'],
            'resolution_note' => ['nullable', 'string', 'required_with:resolved_at'],
            'source_url' => ['required', 'url', 'max:2048', 'starts_with:https://github.com/'],
            'confirmed' => ['required', 'accepted'],
        ], [
            'project_id.exists' => 'Project harus berstatus running atau maintenance.',
            'resolution_note.required_with' => 'resolution_note wajib diisi ketika resolved_at diberikan.',
            'source_url.starts_with' => 'source_url harus berupa URL GitHub canonical.',
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum membuat issue.',
        ]);

        $sourceUrl = GithubImportSource::canonicalUrl($validated['source_url']);

        if ($sourceUrl === null) {
            throw ValidationException::withMessages([
                'source_url' => 'source_url harus mengarah ke GitHub issue, pull request, atau commit.',
            ]);
        }

        $lock = Cache::lock(GithubImportSource::lockKey($sourceUrl), 10);

        if (! $lock->get()) {
            return Response::error('source_url sedang diproses oleh import lain. Coba lagi setelah proses tersebut selesai.');
        }

        try {
            return DB::transaction(function () use ($sourceUrl, $validated): Response {
                $existing = Issue::query()
                    ->where('description', 'like', '%Sumber GitHub:%')
                    ->get()
                    ->first(fn (Issue $issue): bool => GithubImportSource::descriptionMatches($issue->description, $sourceUrl));

                if ($existing !== null) {
                    return $this->recordResponse('existing', $existing);
                }

                $existingFeatureRequest = FeatureRequest::query()
                    ->where('description', 'like', '%Sumber GitHub:%')
                    ->get()
                    ->first(fn (FeatureRequest $featureRequest): bool => GithubImportSource::descriptionMatches($featureRequest->description, $sourceUrl));

                if ($existingFeatureRequest !== null) {
                    return Response::error("source_url sudah tercatat sebagai feature request #{$existingFeatureRequest->id}.");
                }

                $reportedAt = AppDateTime::fromUserInput($validated['reported_at']);
                $resolvedAt = isset($validated['resolved_at'])
                    ? AppDateTime::fromUserInput($validated['resolved_at'])
                    : null;

                if ($resolvedAt?->lt($reportedAt)) {
                    throw ValidationException::withMessages([
                        'resolved_at' => 'Waktu selesai tidak boleh mendahului waktu laporan.',
                    ]);
                }

                if ($resolvedAt?->isFuture()) {
                    throw ValidationException::withMessages([
                        'resolved_at' => 'Waktu selesai tidak boleh berada di masa depan.',
                    ]);
                }

                $issue = Issue::create([
                    'project_id' => $validated['project_id'] ?? null,
                    'title' => $validated['title'],
                    'description' => GithubImportSource::appendToDescription($validated['description'], $sourceUrl),
                    'priority' => $validated['priority'],
                    'root_cause_category' => $validated['root_cause_category'],
                    'reported_at' => $reportedAt,
                    'status' => IssueStatus::Open,
                ]);

                if ($resolvedAt !== null) {
                    $issue->forceFill([
                        'resolved_at' => $resolvedAt,
                        'resolution_note' => $validated['resolution_note'],
                    ])->save();
                    $issue->refresh();
                }

                return $this->recordResponse('created', $issue);
            });
        } finally {
            $lock->release();
        }
    }

    /**
     * Get the tool's input schema.
     *
     * @return array<string, Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Eligible project ID. Omit only for a general infrastructure issue.'),
            'title' => $schema->string()->description('Concise issue title derived from GitHub.')->required(),
            'description' => $schema->string()->description('Issue chronology, impact, and implementation context.')->required(),
            'priority' => $schema->string()->enum(array_column(Priority::cases(), 'value'))->required(),
            'root_cause_category' => $schema->string()->enum(array_column(RootCauseCategory::cases(), 'value'))->required(),
            'reported_at' => $schema->string()->description('GitHub report or change timestamp in ISO 8601 format.')->required(),
            'resolved_at' => $schema->string()->description('Merge or resolution timestamp in ISO 8601 format when completed.'),
            'resolution_note' => $schema->string()->description('Summary of the merged fix when completed.'),
            'source_url' => $schema->string()->description('Canonical GitHub issue, pull request, or commit URL.')->required(),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves this candidate.')->required(),
        ];
    }

    private function recordResponse(string $result, Issue $issue): Response
    {
        return Response::text(json_encode([
            'environment' => app()->environment(),
            'result' => $result,
            'record_type' => 'issue',
            'id' => $issue->id,
            'title' => $issue->title,
            'status' => $issue->status->value,
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }
}
