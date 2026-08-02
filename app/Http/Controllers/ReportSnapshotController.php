<?php

namespace App\Http\Controllers;

use App\Actions\Reports\GenerateReportSnapshot;
use App\Http\Requests\StoreReportSnapshotRequest;
use App\Models\ReportSnapshot;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReportSnapshotController extends Controller
{
    public function index(): Response
    {
        $now = CarbonImmutable::now();
        $periodStart = $now->startOfWeek()->startOfDay();
        $periodEnd = $now->endOfWeek()->endOfDay();

        return Inertia::render('reports/index', [
            'defaultPeriod' => [
                'start' => $periodStart->toDateString(),
                'end' => $periodEnd->toDateString(),
                'label' => $this->formatDateRange($periodStart, $periodEnd),
            ],
            'reports' => ReportSnapshot::query()
                ->latest('generated_at')
                ->latest('id')
                ->limit(20)
                ->get()
                ->map(fn (ReportSnapshot $snapshot): array => $this->reportSummary($snapshot))
                ->values()
                ->all(),
        ]);
    }

    public function store(StoreReportSnapshotRequest $request, GenerateReportSnapshot $generateReportSnapshot): RedirectResponse
    {
        $validated = $request->validated();
        $periodType = (string) $validated['period_type'];

        if ($periodType === ReportSnapshot::PeriodCustomRange) {
            $periodStart = CarbonImmutable::parse((string) $validated['period_start_date'])->startOfDay();
            $periodEnd = CarbonImmutable::parse((string) $validated['period_end_date'])->endOfDay();
        } else {
            $now = CarbonImmutable::now();
            $periodStart = $now->startOfWeek()->startOfDay();
            $periodEnd = $now->endOfWeek()->endOfDay();
        }

        $snapshot = $generateReportSnapshot->handle($periodStart, $periodEnd, $periodType);

        return redirect()
            ->route('reports.show', $snapshot)
            ->with('success', 'Report snapshot berhasil dibuat.');
    }

    public function show(ReportSnapshot $reportSnapshot): Response
    {
        return Inertia::render('reports/show', [
            'report' => $this->reportDetail($reportSnapshot),
        ]);
    }

    /** @return array<string, mixed> */
    private function reportSummary(ReportSnapshot $snapshot): array
    {
        $projectOkr = $this->projectOkrSummary($snapshot->project_breakdown_json);

        return [
            'id' => $snapshot->id,
            'period_type' => $snapshot->period_type,
            'period_label' => $this->formatDateRange(
                CarbonImmutable::parse($snapshot->period_start_date),
                CarbonImmutable::parse($snapshot->period_end_date),
            ),
            'generated_at' => $snapshot->generated_at->format('Y-m-d H:i'),
            'okr' => [
                'brief_realization' => $projectOkr,
                'issue_on_time' => (float) $snapshot->okr2_issue_percentage,
                'feature_request_on_time' => (float) $snapshot->okr2_feature_request_percentage,
            ],
            'href' => route('reports.show', $snapshot, false),
        ];
    }

    /** @return array<string, mixed> */
    private function reportDetail(ReportSnapshot $snapshot): array
    {
        $projectOkr = $this->projectOkrSummary($snapshot->project_breakdown_json);

        return [
            'id' => $snapshot->id,
            'period' => [
                'type' => $snapshot->period_type,
                'start' => $snapshot->period_start_date->toDateString(),
                'end' => $snapshot->period_end_date->toDateString(),
                'label' => $this->formatDateRange(
                    CarbonImmutable::parse($snapshot->period_start_date),
                    CarbonImmutable::parse($snapshot->period_end_date),
                ),
            ],
            'generated_at' => $snapshot->generated_at->format('Y-m-d H:i'),
            'okr' => [
                'brief_realization' => [
                    'key' => 'brief_realization',
                    'label' => 'Realisasi brief per project',
                    ...$projectOkr,
                ],
                'issue_on_time' => $this->okrMetric(
                    key: 'issue_on_time',
                    label: 'Issue SLA',
                    actual: (float) $snapshot->okr2_issue_percentage,
                    target: 80,
                    totalItems: (int) ($snapshot->issue_breakdown_json['total'] ?? 0),
                    onTimeItems: (int) ($snapshot->issue_breakdown_json['on_time'] ?? 0),
                    emptyLabel: (($snapshot->issue_breakdown_json['total'] ?? 0) === 0)
                        ? 'Tidak ada issue baru'
                        : null,
                ),
                'feature_request_on_time' => $this->okrMetric(
                    key: 'feature_request_on_time',
                    label: 'Feature Request SLA',
                    actual: (float) $snapshot->okr2_feature_request_percentage,
                    target: 90,
                    totalItems: (int) ($snapshot->feature_request_breakdown_json['total'] ?? 0),
                    onTimeItems: (int) ($snapshot->feature_request_breakdown_json['on_time'] ?? 0),
                    emptyLabel: (($snapshot->feature_request_breakdown_json['total'] ?? 0) === 0)
                        ? 'Tidak ada Feature Request baru'
                        : null,
                ),
            ],
            'breakdowns' => [
                'projects' => $snapshot->project_breakdown_json,
                'issues' => $snapshot->issue_breakdown_json,
                'feature_requests' => $snapshot->feature_request_breakdown_json,
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function projectOkrSummary(array $breakdown): array
    {
        $projects = collect($breakdown['projects'] ?? []);
        $activeProjects = $projects->filter(
            fn (array $project): bool => ($project['is_active_development'] ?? false) === true
        );
        $evaluableProjects = $activeProjects->filter(
            fn (array $project): bool => ($project['is_evaluable'] ?? ((int) ($project['brief_features_total'] ?? 0) > 0)) === true
        );
        $achievedProjects = $evaluableProjects->filter(
            fn (array $project): bool => ($project['achieved'] ?? ((float) ($project['realization_percentage'] ?? 0) >= 75)) === true
        );
        $evaluableTotal = (int) ($breakdown['evaluable_total'] ?? $evaluableProjects->count());
        $achievedTotal = (int) ($breakdown['achieved_total'] ?? $achievedProjects->count());

        return [
            'target' => (int) ($breakdown['target_percentage'] ?? 75),
            'total_projects' => (int) ($breakdown['active_total'] ?? $activeProjects->count()),
            'evaluable_projects' => $evaluableTotal,
            'achieved_projects' => $achievedTotal,
            'achievement_percentage' => array_key_exists('project_achievement_percentage', $breakdown)
                ? $breakdown['project_achievement_percentage']
                : ($evaluableTotal === 0 ? null : round(($achievedTotal / $evaluableTotal) * 100, 2)),
        ];
    }

    /** @return array<string, mixed> */
    private function okrMetric(
        string $key,
        string $label,
        float $actual,
        int $target,
        int $totalItems,
        ?int $onTimeItems,
        ?string $emptyLabel = null,
    ): array {
        return [
            'key' => $key,
            'label' => $label,
            'actual' => round($actual, 2),
            'target' => $target,
            'achieved' => $actual >= $target,
            'total_items' => $totalItems,
            'on_time_items' => $onTimeItems,
            'empty_label' => $emptyLabel,
        ];
    }

    private function formatDateRange(CarbonImmutable $start, CarbonImmutable $end): string
    {
        return sprintf('%s - %s', $this->formatDate($start), $this->formatDate($end));
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
