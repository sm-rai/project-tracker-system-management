<?php

namespace App\Actions\Reports;

use App\Enums\BriefFeatureStatus;
use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Enums\ProjectStatus;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class CollectSimplifiedReportData
{
    /**
     * @return array{
     *     active_projects: list<array{id: int, name: string, brief_features_done: int, brief_features_total: int, progress_percentage: float|null}>,
     *     resolved_issues: list<array{id: int, title: string, description: string, project_name: string|null, solved_at: string}>,
     *     fulfilled_feature_requests: list<array{id: int, title: string, description: string, project_name: string|null, solved_at: string}>
     * }
     */
    public function handle(CarbonImmutable $start, CarbonImmutable $end, CarbonImmutable $generatedAt): array
    {
        $generatedAt = $generatedAt->utc();
        $start = $start->utc();
        $end = $end->min($generatedAt)->utc();

        return [
            'active_projects' => $this->activeProjects($generatedAt),
            'resolved_issues' => $start->gt($end) ? [] : $this->resolvedIssues($start, $end, $generatedAt),
            'fulfilled_feature_requests' => $start->gt($end) ? [] : $this->fulfilledFeatureRequests($start, $end, $generatedAt),
        ];
    }

    /** @return list<array{id: int, name: string, brief_features_done: int, brief_features_total: int, progress_percentage: float|null}> */
    private function activeProjects(CarbonImmutable $generatedAt): array
    {
        $activeStatuses = [
            ProjectStatus::Planning->value,
            ProjectStatus::InProgress->value,
            ProjectStatus::OnHold->value,
            ProjectStatus::CompletedPendingDeployment->value,
        ];

        return Project::query()
            ->whereIn('status', $activeStatuses)
            ->where('created_at', '<=', $generatedAt)
            ->withCount([
                'briefFeatures as brief_features_total' => fn (Builder $query) => $query
                    ->where('created_at', '<=', $generatedAt),
                'briefFeatures as brief_features_done' => fn (Builder $query) => $query
                    ->where('created_at', '<=', $generatedAt)
                    ->where('status', BriefFeatureStatus::Done->value)
                    ->where('completed_at', '<=', $generatedAt),
            ])
            ->orderBy('name')
            ->get()
            ->map(function (Project $project): array {
                $total = (int) $project->brief_features_total;
                $done = (int) $project->brief_features_done;

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'brief_features_done' => $done,
                    'brief_features_total' => $total,
                    'progress_percentage' => $total === 0 ? null : round(($done / $total) * 100, 1),
                ];
            })
            ->values()
            ->all();
    }

    /** @return list<array{id: int, title: string, description: string, project_name: string|null, solved_at: string}> */
    private function resolvedIssues(CarbonImmutable $start, CarbonImmutable $end, CarbonImmutable $generatedAt): array
    {
        return Issue::query()
            ->select(['id', 'project_id', 'title', 'description', 'status', 'resolved_at', 'created_at'])
            ->with('project:id,name')
            ->where('status', IssueStatus::Resolved->value)
            ->whereBetween('resolved_at', [$start, $end])
            ->where('created_at', '<=', $generatedAt)
            ->orderByDesc('resolved_at')
            ->orderBy('id')
            ->get()
            ->map(fn (Issue $issue): array => [
                'id' => $issue->id,
                'title' => $issue->title,
                'description' => $issue->description,
                'project_name' => $issue->project?->name,
                'solved_at' => $issue->resolved_at->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /** @return list<array{id: int, title: string, description: string, project_name: string|null, solved_at: string}> */
    private function fulfilledFeatureRequests(CarbonImmutable $start, CarbonImmutable $end, CarbonImmutable $generatedAt): array
    {
        return FeatureRequest::query()
            ->select(['id', 'project_id', 'title', 'description', 'status', 'fulfilled_at', 'created_at'])
            ->with('project:id,name')
            ->where('status', FeatureRequestStatus::Fulfilled->value)
            ->whereBetween('fulfilled_at', [$start, $end])
            ->where('created_at', '<=', $generatedAt)
            ->orderByDesc('fulfilled_at')
            ->orderBy('id')
            ->get()
            ->map(fn (FeatureRequest $featureRequest): array => [
                'id' => $featureRequest->id,
                'title' => $featureRequest->title,
                'description' => $featureRequest->description,
                'project_name' => $featureRequest->project?->name,
                'solved_at' => $featureRequest->fulfilled_at->toIso8601String(),
            ])
            ->values()
            ->all();
    }
}
