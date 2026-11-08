<?php

namespace App\Actions\Reports;

use App\Models\OkrQuarterSnapshot;
use App\Support\AppDateTime;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class CaptureClosedOkrQuarterSnapshots
{
    public function __construct(private BuildQuarterlyOkrReportData $buildQuarterlyOkrReportData) {}

    public function handle(): int
    {
        $now = AppDateTime::nowInBusinessTimezone();
        $cursor = $this->buildQuarterlyOkrReportData->firstRelevantDate()?->startOfQuarter();
        $currentQuarterStart = $now->startOfQuarter();

        if ($cursor === null) {
            return 0;
        }

        $createdCount = 0;

        while ($cursor->lt($currentQuarterStart)) {
            $createdCount += $this->captureQuarter($cursor, $now);
            $cursor = $cursor->addQuarter();
        }

        return $createdCount;
    }

    private function captureQuarter(CarbonImmutable $periodStart, CarbonImmutable $generatedAt): int
    {
        $year = $periodStart->year;
        $quarter = $periodStart->quarter;
        $periodEnd = $periodStart->endOfQuarter();
        $report = $this->buildQuarterlyOkrReportData->buildForPeriod(
            $year,
            $quarter,
            $periodEnd->endOfDay(),
            $generatedAt,
        );

        return DB::transaction(function () use ($year, $quarter, $periodStart, $periodEnd, $generatedAt, $report): int {
            $snapshot = OkrQuarterSnapshot::query()->firstOrCreate(
                [
                    'year' => $year,
                    'quarter' => $quarter,
                ],
                [
                    'period_start_date' => $periodStart->toDateString(),
                    'period_end_date' => $periodEnd->toDateString(),
                    'report_data' => $report,
                    'generated_at' => $generatedAt->utc(),
                ],
            );

            return $snapshot->wasRecentlyCreated ? 1 : 0;
        });
    }
}
