<?php

namespace App\Mcp\Tools;

use App\Enums\FeatureRequestStatus;
use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Models\FeatureRequest;
use App\Models\Project;
use App\Models\SlaConfig;
use App\Support\AppDateTime;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;

#[Name('update-tracker-feature-request')]
#[Description('Updates feature request details, recalculates SLA deadlines, and applies fulfillment or reopening lifecycle rules after confirmation.')]
class UpdateFeatureRequestTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'feature_request_id' => ['required', 'integer', Rule::exists((new FeatureRequest)->getTable(), 'id')],
            'project_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists((new Project)->getTable(), 'id')->where(
                    fn (Builder $query) => $query->whereIn('status', [
                        ProjectStatus::DeployedRunning->value,
                        ProjectStatus::DeployedMaintenance->value,
                    ]),
                ),
            ],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'priority' => ['sometimes', 'required', Rule::enum(Priority::class)],
            'requested_at' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', 'required', Rule::enum(FeatureRequestStatus::class)],
            'fulfilled_at' => ['sometimes', 'nullable', 'date'],
            'fulfillment_note' => ['sometimes', 'nullable', 'string'],
            'confirmed' => ['required', 'accepted'],
        ], [
            'project_id.exists' => 'Project harus berstatus running atau maintenance.',
            'confirmed.accepted' => 'Minta persetujuan pengguna sebelum memperbarui feature request.',
        ]);

        $updates = array_intersect_key($validated, array_flip([
            'project_id',
            'title',
            'description',
            'priority',
            'requested_at',
            'status',
            'fulfilled_at',
            'fulfillment_note',
        ]));

        if ($updates === []) {
            throw ValidationException::withMessages([
                'feature_request_id' => 'Berikan sedikitnya satu field feature request yang ingin diperbarui.',
            ]);
        }

        return DB::transaction(function () use ($validated, $updates): Response {
            $featureRequest = FeatureRequest::query()
                ->whereKey($validated['feature_request_id'])
                ->lockForUpdate()
                ->firstOrFail();
            $requestedAt = array_key_exists('requested_at', $updates)
                ? AppDateTime::fromUserInput($updates['requested_at'])
                : $featureRequest->requested_at;
            $priority = Priority::from($updates['priority'] ?? $featureRequest->priority->value);

            if (array_key_exists('requested_at', $updates)) {
                $updates['requested_at'] = $requestedAt;
            }

            if (array_key_exists('requested_at', $updates) || array_key_exists('priority', $updates)) {
                $updates['due_date'] = $requestedAt->copy()->addHours(SlaConfig::hoursForPriority($priority));
            }

            $status = FeatureRequestStatus::from($updates['status'] ?? $featureRequest->status->value);
            $fulfilledAtValue = $updates['fulfilled_at'] ?? null;
            $hasFulfillmentDateInput = array_key_exists('fulfilled_at', $updates);
            $isReopeningByClearingFulfilledAt = ! array_key_exists('status', $updates)
                && $hasFulfillmentDateInput
                && $fulfilledAtValue === null
                && $featureRequest->status === FeatureRequestStatus::Fulfilled;

            if ($isReopeningByClearingFulfilledAt) {
                $updates['status'] = FeatureRequestStatus::InProgress;
                $updates['fulfilled_at'] = null;
                $updates['is_on_time'] = null;
            } elseif (
                $status === FeatureRequestStatus::Fulfilled
                || (! array_key_exists('status', $updates) && $hasFulfillmentDateInput && $fulfilledAtValue !== null)
            ) {
                $fulfilledAt = $fulfilledAtValue !== null
                    ? AppDateTime::fromUserInput($fulfilledAtValue)
                    : ($featureRequest->fulfilled_at ?? now());

                if ($fulfilledAt->lt($requestedAt)) {
                    throw ValidationException::withMessages([
                        'fulfilled_at' => 'Waktu pemenuhan tidak boleh mendahului waktu permintaan.',
                    ]);
                }

                if ($fulfilledAt->isFuture()) {
                    throw ValidationException::withMessages([
                        'fulfilled_at' => 'Waktu pemenuhan tidak boleh berada di masa depan.',
                    ]);
                }

                $updates['status'] = FeatureRequestStatus::Fulfilled;
                $updates['fulfilled_at'] = $fulfilledAt;
            } elseif (
                $status !== FeatureRequestStatus::Fulfilled
                || ($hasFulfillmentDateInput && $fulfilledAtValue === null)
            ) {
                $updates['fulfilled_at'] = null;
                $updates['is_on_time'] = null;
            }

            $featureRequest->forceFill($updates)->save();
            $featureRequest->refresh();

            return Response::text(json_encode([
                'environment' => app()->environment(),
                'result' => 'updated',
                'feature_request' => [
                    'id' => $featureRequest->id,
                    'project_id' => $featureRequest->project_id,
                    'title' => $featureRequest->title,
                    'priority' => $featureRequest->priority->value,
                    'requested_at' => $featureRequest->requested_at?->toIso8601String(),
                    'due_date' => $featureRequest->due_date?->toIso8601String(),
                    'status' => $featureRequest->status->value,
                    'fulfilled_at' => $featureRequest->fulfilled_at?->toIso8601String(),
                    'fulfillment_note' => $featureRequest->fulfillment_note,
                    'is_on_time' => $featureRequest->is_on_time,
                ],
            ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        });
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'feature_request_id' => $schema->integer()->description('Feature Request ID to update.')->required(),
            'project_id' => $schema->integer()->description('Running or maintenance project ID.'),
            'title' => $schema->string()->max(255),
            'description' => $schema->string(),
            'priority' => $schema->string()->enum(array_column(Priority::cases(), 'value')),
            'requested_at' => $schema->string()->description('Request timestamp in ISO 8601 format.'),
            'status' => $schema->string()->enum(array_column(FeatureRequestStatus::cases(), 'value')),
            'fulfilled_at' => $schema->string()->description('Set to null to reopen, or provide a fulfillment timestamp.'),
            'fulfillment_note' => $schema->string()->description('Optional completion summary.'),
            'confirmed' => $schema->boolean()->description('Must be true only after the user approves the changes.')->required(),
        ];
    }
}
