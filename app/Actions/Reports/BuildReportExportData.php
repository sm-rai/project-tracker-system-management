<?php

namespace App\Actions\Reports;

use App\Models\ReportSnapshot;
use App\Support\AppDateTime;
use Carbon\CarbonImmutable;

class BuildReportExportData
{
    /**
     * @return array<string, mixed>
     */
    public function handle(ReportSnapshot $snapshot): array
    {
        $projects = $snapshot->project_breakdown_json;
        $issues = $snapshot->issue_breakdown_json;
        $featureRequests = $snapshot->feature_request_breakdown_json;

        return [
            'snapshot' => [
                'id' => $snapshot->id,
                'period_label' => $this->formatDateRange(
                    CarbonImmutable::parse($snapshot->period_start_date, AppDateTime::businessTimezone()),
                    CarbonImmutable::parse($snapshot->period_end_date, AppDateTime::businessTimezone()),
                ),
                'period_type_label' => $snapshot->period_type === ReportSnapshot::PeriodWeeklyDefault
                    ? 'Minggu berjalan'
                    : 'Rentang tanggal',
                'generated_at' => AppDateTime::inBusinessTimezone($snapshot->generated_at)->format('d M Y, H:i'),
            ],
            'okr' => [
                'brief_realization' => $this->projectMetric($projects),
                'issue_on_time' => $this->itemMetric(
                    label: 'Issue SLA',
                    actual: (float) $snapshot->okr2_issue_percentage,
                    target: 80,
                    breakdown: $issues,
                    emptyLabel: 'Tidak ada issue baru',
                ),
                'feature_request_on_time' => $this->itemMetric(
                    label: 'Feature Request SLA',
                    actual: (float) $snapshot->okr2_feature_request_percentage,
                    target: 90,
                    breakdown: $featureRequests,
                    emptyLabel: 'Tidak ada Feature Request baru',
                ),
            ],
            'stats' => [
                'total_projects' => (int) ($projects['total'] ?? count($projects['projects'] ?? [])),
                'active_projects' => (int) ($projects['active_total'] ?? 0),
                'issues' => (int) ($issues['total'] ?? 0),
                'feature_requests' => (int) ($featureRequests['total'] ?? 0),
            ],
            'projects' => $projects['projects'] ?? [],
            'issues' => [
                'empty_label' => $issues['empty_label']
                    ?? ((int) ($issues['total'] ?? 0) === 0
                        ? 'Tidak ada issue baru pada periode ini.'
                        : null),
                'total' => (int) ($issues['total'] ?? 0),
                'on_time' => (int) ($issues['on_time'] ?? 0),
                'items' => $this->formatIssueItems($issues['items'] ?? []),
            ],
            'feature_requests' => [
                'empty_label' => $featureRequests['empty_label']
                    ?? ((int) ($featureRequests['total'] ?? 0) === 0
                        ? 'Tidak ada Feature Request baru pada periode ini.'
                        : null),
                'total' => (int) ($featureRequests['total'] ?? 0),
                'on_time' => (int) ($featureRequests['on_time'] ?? 0),
                'items' => $this->formatFeatureRequestItems($featureRequests['items'] ?? []),
            ],
            'breakdowns' => [
                'issues' => [
                    'by_status' => $issues['by_status'] ?? [],
                    'by_priority' => $issues['by_priority'] ?? [],
                    'by_root_cause' => $issues['by_root_cause'] ?? [],
                ],
                'feature_requests' => [
                    'by_status' => $featureRequests['by_status'] ?? [],
                    'by_priority' => $featureRequests['by_priority'] ?? [],
                ],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $breakdown
     * @return array<string, mixed>
     */
    private function projectMetric(array $breakdown): array
    {
        $evaluableProjects = (int) ($breakdown['evaluable_total'] ?? 0);
        $achievedProjects = (int) ($breakdown['achieved_total'] ?? 0);

        return [
            'label' => 'Realisasi brief per project',
            'target' => (int) ($breakdown['target_percentage'] ?? 75),
            'total_projects' => (int) ($breakdown['active_total'] ?? 0),
            'evaluable_projects' => $evaluableProjects,
            'achieved_projects' => $achievedProjects,
            'achievement_percentage' => array_key_exists('project_achievement_percentage', $breakdown)
                ? $breakdown['project_achievement_percentage']
                : ($evaluableProjects === 0
                    ? null
                    : round(($achievedProjects / $evaluableProjects) * 100, 2)),
        ];
    }

    /**
     * @param  array<string, mixed>  $breakdown
     * @return array<string, mixed>
     */
    private function itemMetric(
        string $label,
        float $actual,
        int $target,
        array $breakdown,
        string $emptyLabel,
    ): array {
        $totalItems = (int) ($breakdown['total'] ?? 0);

        return [
            'label' => $label,
            'actual' => round($actual, 2),
            'target' => $target,
            'achieved' => $actual >= $target,
            'total_items' => $totalItems,
            'on_time_items' => (int) ($breakdown['on_time'] ?? 0),
            'empty_label' => $totalItems === 0 ? $emptyLabel : null,
        ];
    }

    private function formatDateRange(CarbonImmutable $start, CarbonImmutable $end): string
    {
        return sprintf('%s - %s', $this->formatDate($start), $this->formatDate($end));
    }

    private function formatDate(CarbonImmutable $date): string
    {
        $date = AppDateTime::inBusinessTimezone($date);

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

    private function formatDateTime(CarbonImmutable $date): string
    {
        $date = AppDateTime::inBusinessTimezone($date);

        return sprintf('%s, %s', $this->formatDate($date), $date->format('H:i'));
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function formatIssueItems(array $items): array
    {
        return array_map(function (array $issue): array {
            $issue['reported_at_label'] = $this->formatDate(
                AppDateTime::inBusinessTimezone((string) $issue['reported_at']),
            );
            $issue['due_date_label'] = $this->formatDateTime(
                AppDateTime::inBusinessTimezone((string) $issue['due_date']),
            );

            return $issue;
        }, $items);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function formatFeatureRequestItems(array $items): array
    {
        return array_map(function (array $request): array {
            $request['requested_at_label'] = $this->formatDate(
                AppDateTime::inBusinessTimezone((string) $request['requested_at']),
            );
            $request['due_date_label'] = $this->formatDateTime(
                AppDateTime::inBusinessTimezone((string) $request['due_date']),
            );

            return $request;
        }, $items);
    }
}
