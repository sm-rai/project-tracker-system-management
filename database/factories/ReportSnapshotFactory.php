<?php

namespace Database\Factories;

use App\Models\ReportSnapshot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReportSnapshot>
 */
class ReportSnapshotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'period_start_date' => now()->startOfWeek()->toDateString(),
            'period_end_date' => now()->endOfWeek()->toDateString(),
            'period_type' => ReportSnapshot::PeriodWeeklyDefault,
            'okr1_avg_percentage' => 0,
            'okr1_project_achievement_percentage' => null,
            'okr2_issue_percentage' => 100,
            'okr2_feature_request_percentage' => 100,
            'project_breakdown_json' => [
                'target_percentage' => 75,
                'active_total' => 0,
                'evaluable_total' => 0,
                'achieved_total' => 0,
                'projects' => [],
                'status_distribution' => [],
            ],
            'issue_breakdown_json' => [
                'empty_label' => null,
                'total' => 0,
                'on_time' => 0,
                'items' => [],
                'by_status' => [],
                'by_priority' => [],
                'by_root_cause' => [],
            ],
            'feature_request_breakdown_json' => [
                'empty_label' => null,
                'total' => 0,
                'on_time' => 0,
                'items' => [],
                'by_status' => [],
                'by_priority' => [],
            ],
            'generated_at' => now(),
        ];
    }
}
