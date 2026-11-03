<?php

namespace App\Mcp\Tools;

use App\Enums\FeatureRequestStatus;
use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Models\FeatureRequest;
use App\Models\Project;
use App\Support\AppDateTime;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Query\Builder;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;

#[Name('create-tracker-feature-request-record')]
#[Description('Creates a confirmed feature request directly. Use create-tracker-feature-request for idempotent GitHub imports.')]
class CreateFeatureRequestRecordTool extends Tool
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
            'status' => ['nullable', Rule::enum(FeatureRequestStatus::class)],
            'fulfilled_at' => ['nullable', 'date'],
            'fulfillment_note' => ['nullable', 'string'],
            'confirmed' => ['required', 'accepted'],
        ], [
            'project_id.exists' => 'Project harus berstatus running atau maintenance.',
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum membuat feature request.',
        ]);

        $requestedAt = AppDateTime::fromUserInput($validated['requested_at']);
        $status = FeatureRequestStatus::from($validated['status'] ?? FeatureRequestStatus::Open->value);
        $fulfilledAt = isset($validated['fulfilled_at'])
            ? AppDateTime::fromUserInput($validated['fulfilled_at'])
            : ($status === FeatureRequestStatus::Fulfilled ? now() : null);

        if ($fulfilledAt !== null && $fulfilledAt->lt($requestedAt)) {
            throw ValidationException::withMessages([
                'fulfilled_at' => 'Waktu pemenuhan tidak boleh mendahului waktu permintaan.',
            ]);
        }

        if ($fulfilledAt?->isFuture()) {
            throw ValidationException::withMessages([
                'fulfilled_at' => 'Waktu pemenuhan tidak boleh berada di masa depan.',
            ]);
        }

        $featureRequest = FeatureRequest::query()->create([
            'project_id' => $validated['project_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'requested_at' => $requestedAt,
            'status' => $fulfilledAt !== null ? FeatureRequestStatus::Open : $status,
        ]);

        if ($fulfilledAt !== null) {
            $featureRequest->fulfill(
                $validated['fulfillment_note'] ?? null,
                $fulfilledAt->toDateTimeString(),
            );
        }

        $featureRequest->refresh();

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'result' => 'created',
            'feature_request' => [
                'id' => $featureRequest->id,
                'project_id' => $featureRequest->project_id,
                'title' => $featureRequest->title,
                'priority' => $featureRequest->priority->value,
                'requested_at' => $featureRequest->requested_at?->toIso8601String(),
                'due_date' => $featureRequest->due_date?->toIso8601String(),
                'status' => $featureRequest->status->value,
                'fulfilled_at' => $featureRequest->fulfilled_at?->toIso8601String(),
                'is_on_time' => $featureRequest->is_on_time,
            ],
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Running or maintenance project ID.')->required(),
            'title' => $schema->string()->max(255)->required(),
            'description' => $schema->string()->required(),
            'priority' => $schema->string()->enum(array_column(Priority::cases(), 'value'))->required(),
            'requested_at' => $schema->string()->description('Request timestamp in ISO 8601 format.')->required(),
            'status' => $schema->string()->enum(array_column(FeatureRequestStatus::cases(), 'value')),
            'fulfilled_at' => $schema->string()->description('Optional fulfillment timestamp in ISO 8601 format.'),
            'fulfillment_note' => $schema->string()->description('Optional completion summary.'),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves the request details.')->required(),
        ];
    }
}
