<?php

namespace App\Mcp\Tools;

use App\Enums\FeatureRequestStatus;
use App\Enums\Priority;
use App\Enums\ProjectStatus;
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

#[Name('create-tracker-feature-request')]
#[Description('Creates a feature request from a user-confirmed GitHub candidate. The canonical source_url prevents duplicate imports.')]
#[IsIdempotent]
class CreateFeatureRequestTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => [
                'required',
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
            'requested_at' => ['required', 'date'],
            'fulfilled_at' => ['nullable', 'date'],
            'fulfillment_note' => ['nullable', 'string', 'required_with:fulfilled_at'],
            'source_url' => ['required', 'url', 'max:2048', 'starts_with:https://github.com/'],
            'confirmed' => ['required', 'accepted'],
        ], [
            'project_id.exists' => 'Project harus berstatus running atau maintenance.',
            'fulfillment_note.required_with' => 'fulfillment_note wajib diisi ketika fulfilled_at diberikan.',
            'source_url.starts_with' => 'source_url harus berupa URL GitHub canonical.',
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum membuat feature request.',
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
                $existing = FeatureRequest::query()
                    ->where('description', 'like', '%Sumber GitHub:%')
                    ->get()
                    ->first(fn (FeatureRequest $featureRequest): bool => GithubImportSource::descriptionMatches($featureRequest->description, $sourceUrl));

                if ($existing !== null) {
                    return $this->recordResponse('existing', $existing);
                }

                $existingIssue = Issue::query()
                    ->where('description', 'like', '%Sumber GitHub:%')
                    ->get()
                    ->first(fn (Issue $issue): bool => GithubImportSource::descriptionMatches($issue->description, $sourceUrl));

                if ($existingIssue !== null) {
                    return Response::error("source_url sudah tercatat sebagai issue #{$existingIssue->id}.");
                }

                $requestedAt = AppDateTime::fromUserInput($validated['requested_at']);
                $fulfilledAt = isset($validated['fulfilled_at'])
                    ? AppDateTime::fromUserInput($validated['fulfilled_at'])
                    : null;

                if ($fulfilledAt?->lt($requestedAt)) {
                    throw ValidationException::withMessages([
                        'fulfilled_at' => 'Waktu pemenuhan tidak boleh mendahului waktu permintaan.',
                    ]);
                }

                if ($fulfilledAt?->isFuture()) {
                    throw ValidationException::withMessages([
                        'fulfilled_at' => 'Waktu pemenuhan tidak boleh berada di masa depan.',
                    ]);
                }

                $featureRequest = FeatureRequest::create([
                    'project_id' => $validated['project_id'],
                    'title' => $validated['title'],
                    'description' => GithubImportSource::appendToDescription($validated['description'], $sourceUrl),
                    'priority' => $validated['priority'],
                    'requested_at' => $requestedAt,
                    'status' => FeatureRequestStatus::Open,
                ]);

                if ($fulfilledAt !== null) {
                    $featureRequest->fulfill(
                        $validated['fulfillment_note'],
                        $fulfilledAt->toDateTimeString(),
                    );
                    $featureRequest->refresh();
                }

                return $this->recordResponse('created', $featureRequest);
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
            'project_id' => $schema->integer()->description('Eligible tracker project ID.')->required(),
            'title' => $schema->string()->description('Concise feature request title derived from GitHub.')->required(),
            'description' => $schema->string()->description('Business-facing summary of the new capability.')->required(),
            'priority' => $schema->string()->enum(array_column(Priority::cases(), 'value'))->required(),
            'requested_at' => $schema->string()->description('GitHub request or change timestamp in ISO 8601 format.')->required(),
            'fulfilled_at' => $schema->string()->description('Merge timestamp in ISO 8601 format when completed.'),
            'fulfillment_note' => $schema->string()->description('Summary of the merged implementation when completed.'),
            'source_url' => $schema->string()->description('Canonical GitHub issue, pull request, or commit URL.')->required(),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves this candidate.')->required(),
        ];
    }

    private function recordResponse(string $result, FeatureRequest $featureRequest): Response
    {
        return Response::text(json_encode([
            'environment' => app()->environment(),
            'result' => $result,
            'record_type' => 'feature_request',
            'id' => $featureRequest->id,
            'title' => $featureRequest->title,
            'status' => $featureRequest->status->value,
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }
}
