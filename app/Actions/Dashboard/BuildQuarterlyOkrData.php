<?php

namespace App\Actions\Dashboard;

use App\Enums\BriefFeatureStatus;
use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Enums\ProjectStatus;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Support\AppDateTime;
use Carbon\CarbonImmutable;
use DateTimeInterface;

class BuildQuarterlyOkrData
{
    /**
     * @return array{
     *     okr: array<string, mixed>,
     *     details?: array<string, mixed>
     * }
     */
    public function handle(
        CarbonImmutable $periodStart,
        CarbonImmutable $periodEnd,
        CarbonImmutable $asOf,
        bool $includeDetails = false,
    ): array {
        $periodStartUtc = $periodStart->utc();
        $periodEndUtc = $periodEnd->utc();
        $asOfUtc = $asOf->utc();
        $isHistorical = $asOf->lt(AppDateTime::nowInBusinessTimezone());

        $briefRealization = $this->buildBriefRealizationMetric(
            periodStart: $periodStart,
            periodStartUtc: $periodStartUtc,
            asOfUtc: $asOfUtc,
            isHistorical: $isHistorical,
            includeDetails: $includeDetails,
        );
        $issueData = $this->buildIssueOnTimeMetric($periodStartUtc, $asOfUtc, $includeDetails);
        $featureRequestData = $this->buildFeatureRequestOnTimeMetric($periodStartUtc, $asOfUtc, $includeDetails);

        $result = [
            'okr' => [
                'brief_realization' => $briefRealization['metric'],
                'issue_on_time' => $issueData['metric'],
                'feature_request_on_time' => $featureRequestData['metric'],
            ],
        ];

        if ($includeDetails) {
            $result['details'] = [
                'projects' => $briefRealization['details'],
                'issues' => $issueData['items'],
                'issue_resolutions' => $this->buildIssueResolutions($periodStartUtc, $periodEndUtc, $asOfUtc),
                'feature_requests' => $featureRequestData['items'],
                'feature_request_fulfillments' => $this->buildFeatureRequestFulfillments($periodStartUtc, $periodEndUtc, $asOfUtc),
            ];
        }

        return $result;
    }

    /**
     * @return array{metric: array<string, mixed>, details: list<array<string, mixed>>}
     */
    private function buildBriefRealizationMetric(
        CarbonImmutable $periodStart,
        CarbonImmutable $periodStartUtc,
        CarbonImmutable $asOfUtc,
        bool $isHistorical,
        bool $includeDetails,
    ): array {
        $activeStatuses = [
            ProjectStatus::Planning->value,
            ProjectStatus::InProgress->value,
            ProjectStatus::OnHold->value,
            ProjectStatus::CompletedPendingDeployment->value,
        ];

        $projectsQuery = Project::query()
            ->where('created_at', '<=', $asOfUtc)
            ->where(function ($query) use ($activeStatuses, $isHistorical, $periodStart): void {
                $query->whereIn('status', $activeStatuses);

                if ($isHistorical) {
                    $query->orWhereDate('actual_end_date', '>=', $periodStart->toDateString());
                }
            })
            ->withCount([
                'briefFeatures as brief_features_total' => fn ($query) => $query
                    ->where('created_at', '<=', $asOfUtc),
                'briefFeatures as brief_features_done' => fn ($query) => $query
                    ->where('created_at', '<=', $asOfUtc)
                    ->where('status', BriefFeatureStatus::Done->value)
                    ->where('completed_at', '<=', $asOfUtc),
            ])
            ->orderBy('name');

        if ($includeDetails) {
            $projectsQuery->with(['briefFeatures' => fn ($query) => $query
                ->where('created_at', '<=', $asOfUtc)
                ->orderBy('created_at')
                ->orderBy('id')]);
        }

        $projectMetrics = $projectsQuery
            ->get()
            ->map(fn (Project $project): array => $this->buildProjectBriefMetric($project, $asOfUtc, $isHistorical))
            ->values();

        $evaluableProjects = $projectMetrics->filter(
            fn (array $project): bool => $project['is_evaluable'] === true,
        );
        $achievedProjects = $evaluableProjects->filter(
            fn (array $project): bool => $project['achieved'] === true,
        );

        return [
            'metric' => [
                'key' => 'brief_realization',
                'label' => 'Realisasi brief per project',
                'target' => 75,
                'total_projects' => $projectMetrics->count(),
                'evaluable_projects' => $evaluableProjects->count(),
                'achieved_projects' => $achievedProjects->count(),
                'projects' => $projectMetrics->map(fn (array $project): array => $this->projectMetricSummary($project))->all(),
                'empty_label' => $projectMetrics->isEmpty()
                    ? 'Belum ada project dalam fase development.'
                    : null,
            ],
            'details' => $includeDetails ? $projectMetrics->all() : [],
        ];
    }

    /** @return array<string, mixed> */
    private function buildProjectBriefMetric(Project $project, CarbonImmutable $asOfUtc, bool $isHistorical): array
    {
        $total = (int) $project->brief_features_total;
        $done = (int) $project->brief_features_done;
        $isEvaluable = $total > 0;
        $realizationPercentage = $isEvaluable
            ? round(($done / $total) * 100, 1)
            : null;
        $statusAtCutoff = $this->projectStatusAtCutoff($project, $asOfUtc, $isHistorical);

        $metric = [
            'id' => $project->id,
            'name' => $project->name,
            'status' => $statusAtCutoff->value,
            'status_label' => $statusAtCutoff->label(),
            'brief_features_total' => $total,
            'brief_features_done' => $done,
            'realization_percentage' => $realizationPercentage,
            'target_percentage' => 75,
            'is_evaluable' => $isEvaluable,
            'achieved' => $isEvaluable ? $realizationPercentage >= 75 : null,
            'empty_label' => $isEvaluable ? null : 'Belum ada brief feature.',
            'href' => route('projects.show', $project, false),
        ];

        if ($project->relationLoaded('briefFeatures')) {
            $metric['brief_features'] = $project->briefFeatures
                ->map(fn (BriefFeature $briefFeature): array => $this->briefFeatureDetails($briefFeature, $asOfUtc, $isHistorical))
                ->all();
        }

        return $metric;
    }

    private function projectStatusAtCutoff(Project $project, CarbonImmutable $asOfUtc, bool $isHistorical): ProjectStatus
    {
        $completedStatuses = [
            ProjectStatus::CompletedPendingDeployment,
            ProjectStatus::DeployedRunning,
            ProjectStatus::DeployedMaintenance,
        ];
        $cutoffDate = AppDateTime::inBusinessTimezone($asOfUtc)->toDateString();

        if (
            $isHistorical
            && in_array($project->status, $completedStatuses, true)
            && $project->actual_end_date !== null
            && $project->actual_end_date->toDateString() > $cutoffDate
        ) {
            return ProjectStatus::InProgress;
        }

        return $project->status;
    }

    /** @return array<string, mixed> */
    private function briefFeatureDetails(BriefFeature $briefFeature, CarbonImmutable $asOfUtc, bool $isHistorical): array
    {
        $completedByCutoff = $briefFeature->completed_at !== null
            && $briefFeature->completed_at->lte($asOfUtc);
        $statusAtCutoff = match (true) {
            $completedByCutoff => BriefFeatureStatus::Done->value,
            $isHistorical || $briefFeature->status === BriefFeatureStatus::Done => 'not_done',
            default => $briefFeature->status->value,
        };
        $statusLabelAtCutoff = match ($statusAtCutoff) {
            BriefFeatureStatus::Done->value => BriefFeatureStatus::Done->label(),
            'not_done' => 'Belum selesai',
            default => $briefFeature->status->label(),
        };

        return [
            'id' => $briefFeature->id,
            'name' => $briefFeature->name,
            'description' => $briefFeature->description,
            'status' => $statusAtCutoff,
            'status_label' => $statusLabelAtCutoff,
            'created_at' => $this->formatTimestamp($briefFeature->created_at),
            'completed_at' => $completedByCutoff
                ? $this->formatTimestamp($briefFeature->completed_at)
                : null,
        ];
    }

    /** @param array<string, mixed> $project
     * @return array<string, mixed>
     */
    private function projectMetricSummary(array $project): array
    {
        unset($project['brief_features']);

        return $project;
    }

    /**
     * @return array{metric: array<string, mixed>, items: list<array<string, mixed>>}
     */
    private function buildIssueOnTimeMetric(
        CarbonImmutable $periodStartUtc,
        CarbonImmutable $asOfUtc,
        bool $includeDetails,
    ): array {
        $periodQuery = Issue::query()
            ->whereBetween('reported_at', [$periodStartUtc, $asOfUtc])
            ->where('created_at', '<=', $asOfUtc);
        $total = (clone $periodQuery)->count();
        $onTime = (clone $periodQuery)
            ->where('status', IssueStatus::Resolved->value)
            ->where('is_on_time', true)
            ->where('resolved_at', '<=', $asOfUtc)
            ->count();
        $actual = $total === 0 ? 100.0 : round(($onTime / $total) * 100, 1);

        return [
            'metric' => $this->buildOkrMetric(
                key: 'issue_on_time',
                label: 'Issue selesai tepat waktu',
                actual: $actual,
                target: 80,
                totalItems: $total,
                onTimeItems: $onTime,
                emptyLabel: $total === 0 ? 'Belum ada issue baru kuartal ini.' : null,
            ),
            'items' => $includeDetails
                ? (clone $periodQuery)->with('project:id,name')->orderBy('reported_at')->orderBy('id')
                    ->get()
                    ->map(fn (Issue $issue): array => $this->issueDetails($issue, $asOfUtc))
                    ->all()
                : [],
        ];
    }

    /**
     * @return array{metric: array<string, mixed>, items: list<array<string, mixed>>}
     */
    private function buildFeatureRequestOnTimeMetric(
        CarbonImmutable $periodStartUtc,
        CarbonImmutable $asOfUtc,
        bool $includeDetails,
    ): array {
        $periodQuery = FeatureRequest::query()
            ->whereBetween('requested_at', [$periodStartUtc, $asOfUtc])
            ->where('created_at', '<=', $asOfUtc);
        $total = (clone $periodQuery)->count();
        $onTime = (clone $periodQuery)
            ->where('status', FeatureRequestStatus::Fulfilled->value)
            ->where('is_on_time', true)
            ->where('fulfilled_at', '<=', $asOfUtc)
            ->count();
        $actual = $total === 0 ? 100.0 : round(($onTime / $total) * 100, 1);

        return [
            'metric' => $this->buildOkrMetric(
                key: 'feature_request_on_time',
                label: 'Feature request tepat waktu',
                actual: $actual,
                target: 90,
                totalItems: $total,
                onTimeItems: $onTime,
                emptyLabel: $total === 0 ? 'Belum ada feature request baru kuartal ini.' : null,
            ),
            'items' => $includeDetails
                ? (clone $periodQuery)->with('project:id,name')->orderBy('requested_at')->orderBy('id')
                    ->get()
                    ->map(fn (FeatureRequest $featureRequest): array => $this->featureRequestDetails($featureRequest, $asOfUtc))
                    ->all()
                : [],
        ];
    }

    /** @return array<string, mixed> */
    private function buildOkrMetric(
        string $key,
        string $label,
        float $actual,
        int $target,
        int $totalItems,
        int $onTimeItems,
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

    /** @return list<array<string, mixed>> */
    private function buildIssueResolutions(
        CarbonImmutable $periodStartUtc,
        CarbonImmutable $periodEndUtc,
        CarbonImmutable $asOfUtc,
    ): array {
        $periodEnd = $periodEndUtc->lt($asOfUtc) ? $periodEndUtc : $asOfUtc;

        return Issue::query()
            ->where('resolved_at', '>=', $periodStartUtc)
            ->where('resolved_at', '<=', $periodEnd)
            ->where('status', IssueStatus::Resolved->value)
            ->where('created_at', '<=', $asOfUtc)
            ->with('project:id,name')
            ->orderBy('resolved_at')
            ->orderBy('id')
            ->get()
            ->map(fn (Issue $issue): array => $this->issueDetails($issue, $asOfUtc))
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function buildFeatureRequestFulfillments(
        CarbonImmutable $periodStartUtc,
        CarbonImmutable $periodEndUtc,
        CarbonImmutable $asOfUtc,
    ): array {
        $periodEnd = $periodEndUtc->lt($asOfUtc) ? $periodEndUtc : $asOfUtc;

        return FeatureRequest::query()
            ->where('fulfilled_at', '>=', $periodStartUtc)
            ->where('fulfilled_at', '<=', $periodEnd)
            ->where('status', FeatureRequestStatus::Fulfilled->value)
            ->where('created_at', '<=', $asOfUtc)
            ->with('project:id,name')
            ->orderBy('fulfilled_at')
            ->orderBy('id')
            ->get()
            ->map(fn (FeatureRequest $featureRequest): array => $this->featureRequestDetails($featureRequest, $asOfUtc))
            ->all();
    }

    /** @return array<string, mixed> */
    private function issueDetails(Issue $issue, CarbonImmutable $asOfUtc): array
    {
        $resolvedByCutoff = $issue->status === IssueStatus::Resolved
            && $issue->resolved_at !== null
            && $issue->resolved_at->lte($asOfUtc);

        return [
            'id' => $issue->id,
            'title' => $issue->title,
            'description' => $issue->description,
            'project_name' => $issue->project?->name ?? 'Tidak terikat sistem',
            'priority' => $issue->priority->value,
            'root_cause_category' => $issue->root_cause_category->value,
            'reported_at' => $this->formatTimestamp($issue->reported_at),
            'due_date' => $this->formatTimestamp($issue->due_date),
            'resolved_at' => $this->formatTimestamp($issue->resolved_at),
            'status' => $issue->status->value,
            'status_at_period_end' => $resolvedByCutoff ? IssueStatus::Resolved->value : IssueStatus::Open->value,
            'is_on_time' => $resolvedByCutoff ? $issue->is_on_time : null,
            'resolution_note' => $issue->resolution_note,
            'href' => route('issues.show', $issue, false),
        ];
    }

    /** @return array<string, mixed> */
    private function featureRequestDetails(FeatureRequest $featureRequest, CarbonImmutable $asOfUtc): array
    {
        $fulfilledByCutoff = $featureRequest->status === FeatureRequestStatus::Fulfilled
            && $featureRequest->fulfilled_at !== null
            && $featureRequest->fulfilled_at->lte($asOfUtc);
        $statusAtPeriodEnd = $fulfilledByCutoff
            ? FeatureRequestStatus::Fulfilled
            : ($featureRequest->status === FeatureRequestStatus::Fulfilled
                ? FeatureRequestStatus::InProgress
                : $featureRequest->status);

        return [
            'id' => $featureRequest->id,
            'title' => $featureRequest->title,
            'description' => $featureRequest->description,
            'project_name' => $featureRequest->project?->name ?? 'Tidak terikat sistem',
            'priority' => $featureRequest->priority->value,
            'requested_at' => $this->formatTimestamp($featureRequest->requested_at),
            'due_date' => $this->formatTimestamp($featureRequest->due_date),
            'fulfilled_at' => $this->formatTimestamp($featureRequest->fulfilled_at),
            'status' => $featureRequest->status->value,
            'status_at_period_end' => $statusAtPeriodEnd->value,
            'is_on_time' => $fulfilledByCutoff ? $featureRequest->is_on_time : null,
            'fulfillment_note' => $featureRequest->fulfillment_note,
            'href' => route('feature-requests.show', $featureRequest, false),
        ];
    }

    private function formatTimestamp(?DateTimeInterface $timestamp): ?string
    {
        return $timestamp === null
            ? null
            : AppDateTime::inBusinessTimezone($timestamp)->toIso8601String();
    }
}
