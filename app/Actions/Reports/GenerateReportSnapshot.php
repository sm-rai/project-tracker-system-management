<?php

namespace App\Actions\Reports;

use App\Models\ReportSnapshot;
use App\Support\AppDateTime;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class GenerateReportSnapshot
{
    public function __construct(private CollectSimplifiedReportData $collectSimplifiedReportData) {}

    public function handle(CarbonImmutable $periodStart, CarbonImmutable $periodEnd, string $periodType): ReportSnapshot
    {
        $generatedAt = AppDateTime::nowInBusinessTimezone()->utc();

        return DB::transaction(function () use ($periodStart, $periodEnd, $periodType, $generatedAt): ReportSnapshot {
            $reportData = $this->collectSimplifiedReportData->handle($periodStart, $periodEnd, $generatedAt);

            return ReportSnapshot::create([
                'period_start_date' => AppDateTime::inBusinessTimezone($periodStart)->toDateString(),
                'period_end_date' => AppDateTime::inBusinessTimezone($periodEnd)->toDateString(),
                'period_type' => $periodType,
                'format_version' => 3,
                'okr1_avg_percentage' => null,
                'okr1_project_achievement_percentage' => null,
                'okr2_issue_percentage' => null,
                'okr2_feature_request_percentage' => null,
                'project_breakdown_json' => ['active_projects' => $reportData['active_projects']],
                'issue_breakdown_json' => ['resolved_items' => $reportData['resolved_issues']],
                'feature_request_breakdown_json' => ['fulfilled_items' => $reportData['fulfilled_feature_requests']],
                'generated_at' => $generatedAt,
            ]);
        });
    }
}
