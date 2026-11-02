<?php

namespace App\Actions\Reports;

use App\Models\ReportSnapshot;
use App\Support\AppDateTime;
use Carbon\CarbonImmutable;

class BuildActivityReportData
{
    /** @return array{activity_summary: array<string, mixed>, activities: list<array<string, mixed>>} */
    public function handle(ReportSnapshot $snapshot): array
    {
        $activities = collect([
            ...($snapshot->project_breakdown_json['activities'] ?? []),
            ...($snapshot->issue_breakdown_json['activities'] ?? []),
            ...($snapshot->feature_request_breakdown_json['activities'] ?? []),
        ])->sort(function (array $left, array $right): int {
            $leftTime = CarbonImmutable::parse($left['occurred_at'], AppDateTime::businessTimezone())->getTimestamp();
            $rightTime = CarbonImmutable::parse($right['occurred_at'], AppDateTime::businessTimezone())->getTimestamp();

            return ($rightTime <=> $leftTime)
                ?: ([$left['entity_type'], $left['entity_id'], $left['activity_type']] <=> [$right['entity_type'], $right['entity_id'], $right['activity_type']]);
        })->values();

        $groups = [];
        foreach (['project' => 'Project', 'brief_feature' => 'Brief Feature', 'issue' => 'Issue', 'feature_request' => 'Feature Request'] as $entityType => $label) {
            $items = $activities->where('entity_type', $entityType);
            $groups[] = [
                'entity_type' => $entityType,
                'label' => $label,
                'new_items' => $items->where('activity_type', 'created')->count(),
                'completed_items' => $items->where('activity_type', 'completed')->count(),
                'total_activities' => $items->count(),
                'unique_items' => $items->unique('entity_id')->count(),
            ];
        }

        return [
            'activity_summary' => [
                'total_activities' => $activities->count(),
                'unique_items' => $activities->unique(fn (array $activity): string => $activity['entity_type'].':'.$activity['entity_id'])->count(),
                'groups' => $groups,
            ],
            'activities' => $activities->all(),
        ];
    }
}
