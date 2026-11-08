<?php

namespace App\Actions\Reports;

use App\Models\ReportSnapshot;

class BuildSimplifiedReportData
{
    /**
     * @return array{
     *     summary: array{active_project_count: int, resolved_issue_count: int, fulfilled_feature_request_count: int},
     *     active_projects: list<array<string, mixed>>,
     *     resolved_issues: list<array<string, mixed>>,
     *     fulfilled_feature_requests: list<array<string, mixed>>
     * }
     */
    public function handle(ReportSnapshot $snapshot): array
    {
        $activeProjects = array_values($snapshot->project_breakdown_json['active_projects'] ?? []);
        $resolvedIssues = array_values($snapshot->issue_breakdown_json['resolved_items'] ?? []);
        $fulfilledFeatureRequests = array_values($snapshot->feature_request_breakdown_json['fulfilled_items'] ?? []);

        return [
            'summary' => [
                'active_project_count' => count($activeProjects),
                'resolved_issue_count' => count($resolvedIssues),
                'fulfilled_feature_request_count' => count($fulfilledFeatureRequests),
            ],
            'active_projects' => $activeProjects,
            'resolved_issues' => $resolvedIssues,
            'fulfilled_feature_requests' => $fulfilledFeatureRequests,
        ];
    }
}
