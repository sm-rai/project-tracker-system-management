<?php

namespace App\Mcp\Tools;

use App\Enums\FeatureRequestStatus;
use App\Enums\Priority;
use App\Models\FeatureRequest;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Validation\Rule;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('list-tracker-feature-requests')]
#[Description('Lists feature requests with optional project, status, priority, overdue, and text filters.')]
#[IsReadOnly]
class ListFeatureRequestsTool extends Tool
{
    public function handle(Request $request): Response
    {
        $validated = $request->validate([
            'project_id' => ['nullable', 'integer', Rule::exists('projects', 'id')],
            'status' => ['nullable', Rule::enum(FeatureRequestStatus::class)],
            'priority' => ['nullable', Rule::enum(Priority::class)],
            'search' => ['nullable', 'string', 'max:255'],
            'overdue' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $featureRequests = FeatureRequest::query()
            ->with('project:id,name')
            ->when($validated['project_id'] ?? null, fn (Builder $query, int $projectId): Builder => $query->where('project_id', $projectId))
            ->when($validated['status'] ?? null, fn (Builder $query, string $status): Builder => $query->where('status', $status))
            ->when($validated['priority'] ?? null, fn (Builder $query, string $priority): Builder => $query->where('priority', $priority))
            ->when($validated['search'] ?? null, fn (Builder $query, string $search): Builder => $query
                ->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                }))
            ->when($validated['overdue'] ?? false, fn (Builder $query): Builder => $query
                ->where('status', '!=', FeatureRequestStatus::Fulfilled->value)
                ->where('due_date', '<', now()))
            ->orderByRaw('case when status = ? then 1 else 0 end', [FeatureRequestStatus::Fulfilled->value])
            ->orderByRaw('case when status != ? then due_date end asc', [FeatureRequestStatus::Fulfilled->value])
            ->orderByDesc('requested_at')
            ->paginate(
                (int) ($validated['per_page'] ?? 50),
                ['id', 'project_id', 'title', 'description', 'priority', 'requested_at', 'due_date', 'fulfilled_at', 'fulfillment_note', 'status', 'is_on_time', 'created_at', 'updated_at'],
                'page',
                (int) ($validated['page'] ?? 1),
            );

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'pagination' => [
                'total' => $featureRequests->total(),
                'per_page' => $featureRequests->perPage(),
                'current_page' => $featureRequests->currentPage(),
                'last_page' => $featureRequests->lastPage(),
            ],
            'feature_requests' => $featureRequests->getCollection()
                ->map(fn (FeatureRequest $featureRequest): array => $this->featureRequestData($featureRequest))
                ->all(),
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'project_id' => $schema->integer()->description('Filter to one project.'),
            'status' => $schema->string()->enum(array_column(FeatureRequestStatus::cases(), 'value')),
            'priority' => $schema->string()->enum(array_column(Priority::cases(), 'value')),
            'search' => $schema->string()->description('Matches feature request title or description.'),
            'overdue' => $schema->boolean()->description('When true, lists active requests past their due date.'),
            'page' => $schema->integer()->min(1)->default(1),
            'per_page' => $schema->integer()->min(1)->max(100)->default(50),
        ];
    }

    /** @return array<string, mixed> */
    private function featureRequestData(FeatureRequest $featureRequest): array
    {
        return [
            'id' => $featureRequest->id,
            'project_id' => $featureRequest->project_id,
            'project_name' => $featureRequest->project->name,
            'title' => $featureRequest->title,
            'description' => $featureRequest->description,
            'priority' => $featureRequest->priority->value,
            'requested_at' => $featureRequest->requested_at?->toIso8601String(),
            'due_date' => $featureRequest->due_date?->toIso8601String(),
            'fulfilled_at' => $featureRequest->fulfilled_at?->toIso8601String(),
            'fulfillment_note' => $featureRequest->fulfillment_note,
            'status' => $featureRequest->status->value,
            'is_on_time' => $featureRequest->is_on_time,
            'created_at' => $featureRequest->created_at?->toIso8601String(),
            'updated_at' => $featureRequest->updated_at?->toIso8601String(),
        ];
    }
}
