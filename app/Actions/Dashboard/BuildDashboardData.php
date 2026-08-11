<?php

namespace App\Actions\Dashboard;

use App\Enums\BriefFeatureStatus;
use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Enums\ProjectStatus;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Support\AppDateTime;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;

class BuildDashboardData
{
    /** @return array<string, mixed> */
    public function handle(): array
    {
        $now = AppDateTime::nowInBusinessTimezone();
        $periodStart = $now->startOfWeek(Carbon::MONDAY)->startOfDay();
        $periodEnd = $now->endOfWeek(Carbon::SUNDAY)->endOfDay();
        $periodStartUtc = $periodStart->utc();
        $periodEndUtc = $periodEnd->utc();

        return [
            'period' => [
                'start' => $periodStart->toDateString(),
                'end' => $periodEnd->toDateString(),
                'label' => $this->formatDateRange($periodStart, $periodEnd),
                'generated_at' => $now->format('Y-m-d H:i'),
            ],
            'okr' => [
                'brief_realization' => $this->buildBriefRealizationMetric(),
                'issue_on_time' => $this->buildIssueOnTimeMetric($periodStartUtc, $periodEndUtc),
                'feature_request_on_time' => $this->buildFeatureRequestOnTimeMetric($periodStartUtc, $periodEndUtc),
            ],
            'operational' => $this->buildOperationalHealth(),
            'projectStatusDistribution' => $this->buildProjectStatusDistribution(),
            'attention' => [
                'issues' => $this->buildOverdueIssues(),
                'feature_requests' => $this->buildOverdueFeatureRequests(),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function buildBriefRealizationMetric(): array
    {
        $activeStatuses = [
            ProjectStatus::Planning->value,
            ProjectStatus::InProgress->value,
            ProjectStatus::OnHold->value,
            ProjectStatus::CompletedPendingDeployment->value,
        ];

        $projects = Project::query()
            ->whereIn('status', $activeStatuses)
            ->withCount([
                'briefFeatures as brief_features_total',
                'briefFeatures as brief_features_done' => fn ($query) => $query
                    ->where('status', BriefFeatureStatus::Done->value),
            ])
            ->orderBy('name')
            ->get();

        $projectMetrics = $projects
            ->map(fn (Project $project): array => $this->buildProjectBriefMetric($project))
            ->values();

        $evaluableProjects = $projectMetrics->filter(
            fn (array $project): bool => $project['is_evaluable'] === true
        );
        $achievedProjects = $evaluableProjects->filter(
            fn (array $project): bool => $project['achieved'] === true
        );

        return [
            'key' => 'brief_realization',
            'label' => 'Realisasi brief per project',
            'target' => 75,
            'total_projects' => $projectMetrics->count(),
            'evaluable_projects' => $evaluableProjects->count(),
            'achieved_projects' => $achievedProjects->count(),
            'projects' => $projectMetrics->all(),
            'empty_label' => $projectMetrics->isEmpty()
                ? 'Belum ada project dalam fase development.'
                : null,
        ];
    }

    /** @return array<string, mixed> */
    private function buildProjectBriefMetric(Project $project): array
    {
        $total = (int) $project->brief_features_total;
        $done = (int) $project->brief_features_done;
        $isEvaluable = $total > 0;
        $realizationPercentage = $isEvaluable
            ? round(($done / $total) * 100, 1)
            : null;

        return [
            'id' => $project->id,
            'name' => $project->name,
            'status' => $project->status->value,
            'status_label' => $project->status->label(),
            'brief_features_total' => $total,
            'brief_features_done' => $done,
            'realization_percentage' => $realizationPercentage,
            'target_percentage' => 75,
            'is_evaluable' => $isEvaluable,
            'achieved' => $isEvaluable ? $realizationPercentage >= 75 : null,
            'empty_label' => $isEvaluable ? null : 'Belum ada brief feature.',
        ];
    }

    /** @return array<string, mixed> */
    private function buildIssueOnTimeMetric(CarbonImmutable $periodStart, CarbonImmutable $periodEnd): array
    {
        $periodQuery = Issue::query()->whereBetween('reported_at', [$periodStart, $periodEnd]);
        $total = (clone $periodQuery)->count();
        $onTime = (clone $periodQuery)->where('is_on_time', true)->count();
        $actual = $total === 0 ? 100.0 : round(($onTime / $total) * 100, 1);

        return $this->buildOkrMetric(
            key: 'issue_on_time',
            label: 'Issue selesai tepat waktu',
            actual: $actual,
            target: 80,
            totalItems: $total,
            onTimeItems: $onTime,
            emptyLabel: $total === 0 ? 'Belum ada issue baru minggu ini.' : null,
        );
    }

    /** @return array<string, mixed> */
    private function buildFeatureRequestOnTimeMetric(CarbonImmutable $periodStart, CarbonImmutable $periodEnd): array
    {
        $periodQuery = FeatureRequest::query()->whereBetween('requested_at', [$periodStart, $periodEnd]);
        $total = (clone $periodQuery)->count();
        $onTime = (clone $periodQuery)->where('is_on_time', true)->count();
        $actual = $total === 0 ? 100.0 : round(($onTime / $total) * 100, 1);

        return $this->buildOkrMetric(
            key: 'feature_request_on_time',
            label: 'Feature request tepat waktu',
            actual: $actual,
            target: 90,
            totalItems: $total,
            onTimeItems: $onTime,
            emptyLabel: $total === 0 ? 'Belum ada feature request baru minggu ini.' : null,
        );
    }

    /** @return array<string, mixed> */
    private function buildOkrMetric(
        string $key,
        string $label,
        float $actual,
        int $target,
        int $totalItems,
        ?int $onTimeItems,
        ?string $emptyLabel,
    ): array {
        return [
            'key' => $key,
            'label' => $label,
            'actual' => $actual,
            'target' => $target,
            'delta' => round($actual - $target, 1),
            'achieved' => $actual >= $target,
            'total_items' => $totalItems,
            'on_time_items' => $onTimeItems,
            'empty_label' => $emptyLabel,
        ];
    }

    /** @return array<string, int> */
    private function buildOperationalHealth(): array
    {
        return [
            'total_projects' => Project::count(),
            'deployed_maintenance' => Project::where('status', ProjectStatus::DeployedMaintenance->value)->count(),
            'open_issues' => Issue::where('status', IssueStatus::Open->value)->count(),
            'overdue_issues' => Issue::where('status', IssueStatus::Open->value)
                ->where('due_date', '<', now())
                ->count(),
            'open_feature_requests' => FeatureRequest::whereIn('status', [
                FeatureRequestStatus::Open->value,
                FeatureRequestStatus::InProgress->value,
            ])->count(),
            'overdue_feature_requests' => FeatureRequest::where('status', '!=', FeatureRequestStatus::Fulfilled->value)
                ->where('due_date', '<', now())
                ->count(),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function buildProjectStatusDistribution(): array
    {
        $counts = Project::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $distribution = collect(ProjectStatus::cases())
            ->map(fn (ProjectStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
                'count' => (int) ($counts[$status->value] ?? 0),
            ])
            ->values()
            ->all();

        return array_values($distribution);
    }

    /** @return list<array<string, mixed>> */
    private function buildOverdueIssues(): array
    {
        $issues = Issue::query()
            ->where('status', IssueStatus::Open->value)
            ->where('due_date', '<', now())
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn (Issue $issue): array => [
                'id' => $issue->id,
                'title' => $issue->title,
                'project_name' => $this->projectName($issue->project_id),
                'priority' => $issue->priority->value,
                'status' => $issue->status->value,
                'due_date' => $issue->due_date->toIso8601String(),
                'hours_overdue' => (int) $issue->due_date->diffInHours(now()),
                'href' => route('issues.show', $issue, false),
            ])
            ->all();

        return array_values($issues);
    }

    /** @return list<array<string, mixed>> */
    private function buildOverdueFeatureRequests(): array
    {
        $featureRequests = FeatureRequest::query()
            ->where('status', '!=', FeatureRequestStatus::Fulfilled->value)
            ->where('due_date', '<', now())
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn (FeatureRequest $featureRequest): array => [
                'id' => $featureRequest->id,
                'title' => $featureRequest->title,
                'project_name' => $this->projectName($featureRequest->project_id),
                'priority' => $featureRequest->priority->value,
                'status' => $featureRequest->status->value,
                'due_date' => $featureRequest->due_date->toIso8601String(),
                'hours_overdue' => (int) $featureRequest->due_date->diffInHours(now()),
                'href' => route('feature-requests.show', $featureRequest, false),
            ])
            ->all();

        return array_values($featureRequests);
    }

    private function formatDateRange(CarbonImmutable $start, CarbonImmutable $end): string
    {
        return sprintf('%s - %s', $this->formatDate($start), $this->formatDate($end));
    }

    private function projectName(?int $projectId): string
    {
        if ($projectId === null) {
            return 'Tidak terikat sistem';
        }

        $name = Project::query()
            ->whereKey($projectId)
            ->value('name');

        return is_string($name) ? $name : 'Tidak terikat sistem';
    }

    private function formatDate(CarbonImmutable $date): string
    {
        $months = [
            1 => 'Jan',
            2 => 'Feb',
            3 => 'Mar',
            4 => 'Apr',
            5 => 'Mei',
            6 => 'Jun',
            7 => 'Jul',
            8 => 'Agu',
            9 => 'Sep',
            10 => 'Okt',
            11 => 'Nov',
            12 => 'Des',
        ];

        return sprintf('%d %s %d', $date->day, $months[$date->month], $date->year);
    }
}
