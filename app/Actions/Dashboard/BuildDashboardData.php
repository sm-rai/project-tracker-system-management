<?php

namespace App\Actions\Dashboard;

use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Enums\ProjectStatus;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Support\AppDateTime;
use Carbon\CarbonImmutable;

class BuildDashboardData
{
    public function __construct(private BuildQuarterlyOkrData $buildQuarterlyOkrData) {}

    /** @return array<string, mixed> */
    public function handle(): array
    {
        $now = AppDateTime::nowInBusinessTimezone();
        $periodStart = $now->startOfQuarter();
        $periodEnd = $now->endOfQuarter();
        $nowUtc = $now->utc();
        $okr = $this->buildQuarterlyOkrData->handle($periodStart, $periodEnd, $now)['okr'];

        return [
            'period' => [
                'start' => $periodStart->toDateString(),
                'end' => $periodEnd->toDateString(),
                'quarter' => $now->quarter,
                'year' => $now->year,
                'label' => sprintf('Q%d %d · %s', $now->quarter, $now->year, $this->formatDateRange($periodStart, $periodEnd)),
                'generated_at' => $now->format('Y-m-d H:i'),
            ],
            'okr' => $okr,
            'operational' => $this->buildOperationalHealth($nowUtc),
            'projectStatusDistribution' => $this->buildProjectStatusDistribution(),
            'attention' => [
                'issues' => $this->buildOverdueIssues($nowUtc),
                'feature_requests' => $this->buildOverdueFeatureRequests($nowUtc),
            ],
        ];
    }

    /** @return array<string, int> */
    private function buildOperationalHealth(CarbonImmutable $now): array
    {
        return [
            'total_projects' => Project::count(),
            'deployed_maintenance' => Project::where('status', ProjectStatus::DeployedMaintenance->value)->count(),
            'open_issues' => Issue::where('status', IssueStatus::Open->value)->count(),
            'overdue_issues' => Issue::where('status', IssueStatus::Open->value)
                ->where('due_date', '<', $now)
                ->count(),
            'open_feature_requests' => FeatureRequest::whereIn('status', [
                FeatureRequestStatus::Open->value,
                FeatureRequestStatus::InProgress->value,
            ])->count(),
            'overdue_feature_requests' => FeatureRequest::where('status', '!=', FeatureRequestStatus::Fulfilled->value)
                ->where('due_date', '<', $now)
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
    private function buildOverdueIssues(CarbonImmutable $now): array
    {
        $issues = Issue::query()
            ->where('status', IssueStatus::Open->value)
            ->where('due_date', '<', $now)
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
                'hours_overdue' => (int) $issue->due_date->diffInHours($now),
                'href' => route('issues.show', $issue, false),
            ])
            ->all();

        return array_values($issues);
    }

    /** @return list<array<string, mixed>> */
    private function buildOverdueFeatureRequests(CarbonImmutable $now): array
    {
        $featureRequests = FeatureRequest::query()
            ->where('status', '!=', FeatureRequestStatus::Fulfilled->value)
            ->where('due_date', '<', $now)
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
                'hours_overdue' => (int) $featureRequest->due_date->diffInHours($now),
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
