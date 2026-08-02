<?php

namespace App\Actions\Reports;

use App\Enums\BriefFeatureStatus;
use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Enums\ProjectStatus;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\ReportSnapshot;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

class GenerateReportSnapshot
{
    public function handle(CarbonImmutable $periodStart, CarbonImmutable $periodEnd, string $periodType): ReportSnapshot
    {
        $projectBreakdown = $this->buildProjectBreakdown();
        $issueBreakdown = $this->buildIssueBreakdown($periodStart, $periodEnd);
        $featureRequestBreakdown = $this->buildFeatureRequestBreakdown($periodStart, $periodEnd);

        return ReportSnapshot::create([
            'period_start_date' => $periodStart->toDateString(),
            'period_end_date' => $periodEnd->toDateString(),
            'period_type' => $periodType,
            'okr1_project_achievement_percentage' => $projectBreakdown['project_achievement_percentage'],
            'okr2_issue_percentage' => $issueBreakdown['okr_percentage'],
            'okr2_feature_request_percentage' => $featureRequestBreakdown['okr_percentage'],
            'project_breakdown_json' => $projectBreakdown,
            'issue_breakdown_json' => $issueBreakdown,
            'feature_request_breakdown_json' => $featureRequestBreakdown,
            'generated_at' => now(),
        ]);
    }

    /** @return array<string, mixed> */
    private function buildProjectBreakdown(): array
    {
        $activeStatuses = $this->activeDevelopmentStatuses();

        $projects = Project::query()
            ->withCount([
                'briefFeatures as brief_features_total',
                'briefFeatures as brief_features_done' => fn ($query) => $query->where('status', BriefFeatureStatus::Done->value),
            ])
            ->orderBy('name')
            ->get();

        $projectRows = [];

        foreach ($projects as $project) {
            $projectRows[] = $this->projectRow($project, $activeStatuses);
        }

        $activeProjectRows = collect($projectRows)
            ->filter(fn (array $project): bool => $project['is_active_development'] === true)
            ->values();
        $evaluableProjectRows = $activeProjectRows
            ->filter(fn (array $project): bool => $project['is_evaluable'] === true)
            ->values();
        $achievedProjectRows = $evaluableProjectRows
            ->filter(fn (array $project): bool => $project['achieved'] === true)
            ->values();

        $statusDistribution = $projects
            ->groupBy(fn (Project $project): string => $project->status->value)
            ->map(fn (EloquentCollection $items, string $status): array => [
                'value' => $status,
                'label' => ProjectStatus::from($status)->label(),
                'count' => $items->count(),
            ])
            ->values()
            ->all();

        return [
            'target_percentage' => 75,
            'project_achievement_percentage' => $evaluableProjectRows->isEmpty()
                ? null
                : round(($achievedProjectRows->count() / $evaluableProjectRows->count()) * 100, 2),
            'active_total' => $activeProjectRows->count(),
            'evaluable_total' => $evaluableProjectRows->count(),
            'achieved_total' => $achievedProjectRows->count(),
            'total' => $projects->count(),
            'projects' => $projectRows,
            'status_distribution' => $statusDistribution,
        ];
    }

    /** @return array<string, mixed> */
    private function buildIssueBreakdown(CarbonImmutable $periodStart, CarbonImmutable $periodEnd): array
    {
        $issues = Issue::query()
            ->with('project:id,name')
            ->whereBetween('reported_at', [$periodStart, $periodEnd])
            ->orderByDesc('reported_at')
            ->get();

        $total = $issues->count();
        $onTime = $issues->where('is_on_time', true)->count();

        return [
            'okr_percentage' => $total === 0 ? 100.0 : round(($onTime / $total) * 100, 2),
            'empty_label' => $total === 0 ? 'Tidak ada issue baru pada periode ini.' : null,
            'total' => $total,
            'on_time' => $onTime,
            'open' => $issues->where('status', IssueStatus::Open)->count(),
            'resolved' => $issues->where('status', IssueStatus::Resolved)->count(),
            'items' => $this->issueRows($issues),
            'by_status' => $this->countByEnum($issues, 'status'),
            'by_priority' => $this->countByEnum($issues, 'priority'),
            'by_root_cause' => $this->countByEnum($issues, 'root_cause_category'),
        ];
    }

    /** @return array<string, mixed> */
    private function buildFeatureRequestBreakdown(CarbonImmutable $periodStart, CarbonImmutable $periodEnd): array
    {
        $featureRequests = FeatureRequest::query()
            ->with('project:id,name')
            ->whereBetween('requested_at', [$periodStart, $periodEnd])
            ->orderByDesc('requested_at')
            ->get();

        $total = $featureRequests->count();
        $onTime = $featureRequests->where('is_on_time', true)->count();

        return [
            'okr_percentage' => $total === 0 ? 100.0 : round(($onTime / $total) * 100, 2),
            'empty_label' => $total === 0 ? 'Tidak ada Feature Request baru pada periode ini.' : null,
            'total' => $total,
            'on_time' => $onTime,
            'open' => $featureRequests->where('status', FeatureRequestStatus::Open)->count(),
            'in_progress' => $featureRequests->where('status', FeatureRequestStatus::InProgress)->count(),
            'fulfilled' => $featureRequests->where('status', FeatureRequestStatus::Fulfilled)->count(),
            'items' => $this->featureRequestRows($featureRequests),
            'by_status' => $this->countByEnum($featureRequests, 'status'),
            'by_priority' => $this->countByEnum($featureRequests, 'priority'),
        ];
    }

    /** @return list<string> */
    private function activeDevelopmentStatuses(): array
    {
        return [
            ProjectStatus::Planning->value,
            ProjectStatus::InProgress->value,
            ProjectStatus::OnHold->value,
            ProjectStatus::CompletedPendingDeployment->value,
        ];
    }

    /**
     * @param  list<string>  $activeStatuses
     * @return array<string, mixed>
     */
    private function projectRow(Project $project, array $activeStatuses): array
    {
        $isActiveDevelopment = in_array($project->status->value, $activeStatuses, true);
        $isEvaluable = $isActiveDevelopment && (int) $project->brief_features_total > 0;

        return [
            'id' => $project->id,
            'name' => $project->name,
            'status' => $project->status->value,
            'status_label' => $project->status->label(),
            'is_active_development' => $isActiveDevelopment,
            'brief_features_total' => (int) $project->brief_features_total,
            'brief_features_done' => (int) $project->brief_features_done,
            'realization_percentage' => $isActiveDevelopment
                ? $this->briefRealizationPercentage($project)
                : 100.0,
            'target_percentage' => 75,
            'is_evaluable' => $isEvaluable,
            'achieved' => $isEvaluable
                ? $this->briefRealizationPercentage($project) >= 75
                : null,
            'empty_label' => $isEvaluable ? null : ($isActiveDevelopment ? 'Belum ada brief feature.' : null),
        ];
    }

    private function briefRealizationPercentage(Project $project): ?float
    {
        $total = (int) $project->brief_features_total;

        if ($total === 0) {
            return null;
        }

        return round(((int) $project->brief_features_done / $total) * 100, 2);
    }

    /**
     * @param  EloquentCollection<int, Issue>  $issues
     * @return list<array<string, mixed>>
     */
    private function issueRows(EloquentCollection $issues): array
    {
        $rows = [];

        foreach ($issues as $issue) {
            $rows[] = [
                'id' => $issue->id,
                'title' => $issue->title,
                'project_name' => $this->issueProjectName($issue),
                'priority' => $issue->priority->value,
                'root_cause_category' => $issue->root_cause_category->value,
                'status' => $issue->status->value,
                'reported_at' => $issue->reported_at->toDateTimeString(),
                'due_date' => $issue->due_date->toDateString(),
                'resolved_at' => $issue->resolved_at?->toDateTimeString(),
                'is_on_time' => $issue->is_on_time,
            ];
        }

        return $rows;
    }

    /**
     * @param  EloquentCollection<int, FeatureRequest>  $featureRequests
     * @return list<array<string, mixed>>
     */
    private function featureRequestRows(EloquentCollection $featureRequests): array
    {
        $rows = [];

        foreach ($featureRequests as $featureRequest) {
            $rows[] = [
                'id' => $featureRequest->id,
                'title' => $featureRequest->title,
                'project_name' => $featureRequest->project->name,
                'priority' => $featureRequest->priority->value,
                'status' => $featureRequest->status->value,
                'requested_at' => $featureRequest->requested_at->toDateTimeString(),
                'due_date' => $featureRequest->due_date->toDateString(),
                'fulfilled_at' => $featureRequest->fulfilled_at?->toDateTimeString(),
                'is_on_time' => $featureRequest->is_on_time,
            ];
        }

        return $rows;
    }

    private function issueProjectName(Issue $issue): string
    {
        if ($issue->project_id === null) {
            return 'Tidak terikat sistem';
        }

        return $issue->project->name;
    }

    /**
     * @param  Collection<int, mixed>  $items
     * @return list<array{value: string, count: int}>
     */
    private function countByEnum(Collection $items, string $attribute): array
    {
        $counts = $items
            ->groupBy(fn ($item): string => $item->{$attribute}->value)
            ->map(fn (Collection $group, string $value): array => [
                'value' => $value,
                'count' => $group->count(),
            ])
            ->values()
            ->all();

        return array_values($counts);
    }
}
