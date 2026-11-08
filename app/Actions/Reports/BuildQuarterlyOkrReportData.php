<?php

namespace App\Actions\Reports;

use App\Actions\Dashboard\BuildQuarterlyOkrData;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\OkrQuarterSnapshot;
use App\Models\Project;
use App\Support\AppDateTime;
use Carbon\CarbonImmutable;

class BuildQuarterlyOkrReportData
{
    public function __construct(private BuildQuarterlyOkrData $buildQuarterlyOkrData) {}

    /** @return array<string, mixed> */
    public function handle(int $year, int $quarter): array
    {
        $now = AppDateTime::nowInBusinessTimezone();
        $periodStart = $this->periodStart($year, $quarter);
        $periodEnd = $periodStart->endOfQuarter();
        $isCurrent = $year === $now->year && $quarter === $now->quarter;

        if ($periodStart->gt($now)) {
            abort(404);
        }

        if (! $isCurrent) {
            $snapshot = OkrQuarterSnapshot::query()
                ->where('year', $year)
                ->where('quarter', $quarter)
                ->first();

            if ($snapshot !== null) {
                return $snapshot->report_data;
            }
        }

        $asOf = $isCurrent ? $now : $periodEnd->endOfDay();

        return $this->buildForPeriod($year, $quarter, $asOf, $now);
    }

    /** @return array<string, mixed> */
    public function buildForPeriod(
        int $year,
        int $quarter,
        CarbonImmutable $asOf,
        ?CarbonImmutable $generatedAt = null,
    ): array {
        $periodStart = $this->periodStart($year, $quarter);
        $periodEnd = $periodStart->endOfQuarter();
        $now = AppDateTime::nowInBusinessTimezone();
        $isCurrent = $year === $now->year && $quarter === $now->quarter;

        return [
            'period' => [
                'year' => $year,
                'quarter' => $quarter,
                'start' => $periodStart->toDateString(),
                'end' => $periodEnd->toDateString(),
                'label' => sprintf(
                    'Q%d %d · %s - %s',
                    $quarter,
                    $year,
                    $this->formatDate($periodStart),
                    $this->formatDate($periodEnd),
                ),
                'is_current' => $isCurrent,
                'generated_at' => ($generatedAt ?? $now)->format('Y-m-d H:i'),
            ],
            ...$this->buildQuarterlyOkrData->handle(
                $periodStart,
                $periodEnd,
                $asOf,
                includeDetails: true,
            ),
        ];
    }

    /** @return list<array{year: int, quarter: int, value: string, label: string}> */
    public function availablePeriods(): array
    {
        $now = AppDateTime::nowInBusinessTimezone();
        $firstRelevantDate = $this->firstRelevantDate() ?? $now;
        $cursor = $firstRelevantDate->startOfQuarter();
        $lastQuarterStart = $now->startOfQuarter();
        $periods = [];

        while ($cursor->lte($lastQuarterStart)) {
            $periods[] = [
                'year' => $cursor->year,
                'quarter' => $cursor->quarter,
                'value' => sprintf('%d-%d', $cursor->year, $cursor->quarter),
                'label' => sprintf('Q%d %d', $cursor->quarter, $cursor->year),
            ];
            $cursor = $cursor->addQuarter();
        }

        return $periods;
    }

    public function firstRelevantDate(): ?CarbonImmutable
    {
        $timestamps = [
            Project::query()->min('created_at'),
            BriefFeature::query()->min('created_at'),
            Issue::query()->min('reported_at'),
            FeatureRequest::query()->min('requested_at'),
        ];
        $timestamps = array_values(array_filter($timestamps, fn ($value): bool => $value !== null));

        if ($timestamps === []) {
            return null;
        }

        $earliestTimestamp = min($timestamps);

        return AppDateTime::inBusinessTimezone((string) $earliestTimestamp);
    }

    private function periodStart(int $year, int $quarter): CarbonImmutable
    {
        return CarbonImmutable::create($year, 1, 1, 0, 0, 0, AppDateTime::businessTimezone())
            ->addQuarters($quarter - 1)
            ->startOfQuarter();
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
