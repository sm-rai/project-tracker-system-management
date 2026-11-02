<?php

namespace App\Actions\Reports;

use App\Enums\BriefFeatureStatus;
use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Enums\ProjectStatus;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Support\AppDateTime;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class CollectReportActivities
{
    /** @return array{projects: array{activities: list<array<string, mixed>>}, issues: array{activities: list<array<string, mixed>>}, feature_requests: array{activities: list<array<string, mixed>>}} */
    public function handle(CarbonImmutable $start, CarbonImmutable $end, CarbonImmutable $generatedAt): array
    {
        $start = $start->utc();
        $end = $end->min($generatedAt)->utc();
        $result = ['projects' => ['activities' => []], 'issues' => ['activities' => []], 'feature_requests' => ['activities' => []]];

        if ($start->gt($end)) {
            return $result;
        }

        $startDate = AppDateTime::inBusinessTimezone($start)->toDateString();
        $endDate = AppDateTime::inBusinessTimezone($end)->toDateString();
        $completedProjectStatuses = [ProjectStatus::CompletedPendingDeployment, ProjectStatus::DeployedRunning, ProjectStatus::DeployedMaintenance];
        $projects = Project::query()
            ->select(['id', 'name', 'description', 'status', 'target_end_date', 'created_at', 'actual_end_date'])
            ->where(function (Builder $query) use ($start, $end, $startDate, $endDate, $completedProjectStatuses): void {
                $query->whereBetween('created_at', [$start, $end])
                    ->orWhere(fn (Builder $query) => $query->whereIn('status', $completedProjectStatuses)->whereDate('actual_end_date', '>=', $startDate)->whereDate('actual_end_date', '<=', $endDate));
            })
            ->orderBy('id')->get();

        foreach ($projects as $project) {
            if ($project->created_at?->betweenIncluded($start, $end)) {
                $result['projects']['activities'][] = $this->row($project, 'project', 'created', 'Project dicatat', $project->created_at->toIso8601String());
            }
            $completionDate = $project->actual_end_date?->toDateString();
            if (in_array($project->status, $completedProjectStatuses, true) && $completionDate !== null && $completionDate >= $startDate && $completionDate <= $endDate) {
                $result['projects']['activities'][] = $this->row($project, 'project', 'completed', 'Development selesai', $completionDate);
            }
        }

        $definitions = [
            [BriefFeature::query()->select(['id', 'project_id', 'name', 'description', 'status', 'created_at', 'completed_at']), 'brief_feature', 'projects', 'created_at', 'completed_at', BriefFeatureStatus::Done, 'Brief feature ditambahkan', 'Brief feature selesai'],
            [Issue::query()->select(['id', 'project_id', 'title', 'priority', 'status', 'reported_at', 'resolved_at', 'due_date', 'resolution_note']), 'issue', 'issues', 'reported_at', 'resolved_at', IssueStatus::Resolved, 'Issue dilaporkan', 'Issue diselesaikan'],
            [FeatureRequest::query()->select(['id', 'project_id', 'title', 'priority', 'status', 'requested_at', 'fulfilled_at', 'due_date', 'fulfillment_note']), 'feature_request', 'feature_requests', 'requested_at', 'fulfilled_at', FeatureRequestStatus::Fulfilled, 'Feature Request diminta', 'Feature Request dipenuhi'],
        ];

        foreach ($definitions as [$query, $entityType, $group, $createdColumn, $completedColumn, $completedStatus, $createdLabel, $completedLabel]) {
            $items = $query->with('project:id,name')
                ->where(function (Builder $query) use ($start, $end, $createdColumn, $completedColumn, $completedStatus): void {
                    $query->whereBetween($createdColumn, [$start, $end])
                        ->orWhere(fn (Builder $query) => $query->where('status', $completedStatus)->whereBetween($completedColumn, [$start, $end]));
                })
                ->orderBy('id')->get();

            foreach ($items as $item) {
                if ($item->{$createdColumn}?->betweenIncluded($start, $end)) {
                    $result[$group]['activities'][] = $this->row($item, $entityType, 'created', $createdLabel, $item->{$createdColumn}->toIso8601String());
                }
                if ($item->status === $completedStatus && $item->{$completedColumn}?->betweenIncluded($start, $end)) {
                    $result[$group]['activities'][] = $this->row($item, $entityType, 'completed', $completedLabel, $item->{$completedColumn}->toIso8601String());
                }
            }
        }

        return $result;
    }

    /** @return array<string, mixed> */
    private function row(Project|BriefFeature|Issue|FeatureRequest $item, string $entityType, string $activityType, string $activityLabel, string $occurredAt): array
    {
        $project = $item instanceof Project ? $item : $item->project;
        $statusLabel = match (true) {
            $item instanceof Project, $item instanceof BriefFeature => $item->status->label(),
            $item instanceof Issue => $item->status === IssueStatus::Resolved ? 'Resolved' : 'Open',
            default => match ($item->status) {
                FeatureRequestStatus::Open => 'Open',
                FeatureRequestStatus::InProgress => 'In Progress',
                FeatureRequestStatus::Fulfilled => 'Fulfilled',
            },
        };

        return [
            'entity_type' => $entityType,
            'entity_id' => $item->id,
            'title' => $item instanceof Project || $item instanceof BriefFeature ? $item->name : $item->title,
            'project_id' => $project?->id,
            'project_name' => $project?->name,
            'activity_type' => $activityType,
            'activity_label' => $activityLabel,
            'occurred_at' => $occurredAt,
            'status' => $item->status->value,
            'status_label' => $statusLabel,
            'priority' => $item instanceof Issue || $item instanceof FeatureRequest ? $item->priority->value : null,
            'due_date' => $item instanceof Project ? $item->target_end_date?->toDateString() : ($item instanceof BriefFeature ? null : $item->due_date?->toIso8601String()),
            'note' => match (true) {
                $item instanceof Issue => $item->resolution_note,
                $item instanceof FeatureRequest => $item->fulfillment_note,
                default => $item->description,
            },
        ];
    }
}
