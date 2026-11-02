<?php

use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\ReportSnapshot;
use App\Models\User;
use Carbon\Carbon;

afterEach(function (): void {
    Carbon::setTestNow();
});

test('guests are redirected to login when visiting reports', function (): void {
    $this->get('/reports')->assertRedirect('/login');
});

test('authenticated users receive the report index component', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reports/index')
            ->has('reports')
            ->has('defaultPeriod')
        );
});

test('report default period starts a new week at Sunday midnight in the business timezone', function (): void {
    Carbon::setTestNow('2026-08-01 17:00:00');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('defaultPeriod.start', '2026-08-02')
            ->where('defaultPeriod.end', '2026-08-08')
            ->where('defaultPeriod.label', '2 Agu 2026 - 8 Agu 2026')
        );
});

test('users can generate a weekly default report snapshot', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();
    $project = Project::factory()->inProgress()->create(['name' => 'CRM Stabilization']);
    BriefFeature::factory()->done()->create(['project_id' => $project->id]);
    BriefFeature::factory()->todo()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->post('/reports', ['period_type' => 'weekly_default'])
        ->assertRedirect();

    $snapshot = ReportSnapshot::query()->firstOrFail();

    expect($snapshot->period_type)->toBe('weekly_default')
        ->and($snapshot->period_start_date->toDateString())->toBe('2026-07-26')
        ->and($snapshot->period_end_date->toDateString())->toBe('2026-08-01')
        ->and($snapshot->format_version)->toBe(2)
        ->and($snapshot->project_breakdown_json['activities'])->toHaveCount(4)
        ->and($snapshot->project_breakdown_json['activities'][0]['title'])->toBe('CRM Stabilization');
});

test('users can generate a custom range report snapshot', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/reports', [
            'period_type' => 'custom_range',
            'period_start_date' => '2026-07-01',
            'period_end_date' => '2026-07-15',
        ])
        ->assertRedirect();

    $snapshot = ReportSnapshot::query()->firstOrFail();

    expect($snapshot->period_type)->toBe('custom_range')
        ->and($snapshot->period_start_date->toDateString())->toBe('2026-07-01')
        ->and($snapshot->period_end_date->toDateString())->toBe('2026-07-15');
});

test('report snapshot stores activity facts without weekly okr metrics', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();
    $project = Project::factory()->inProgress()->create();

    BriefFeature::factory()->done()->count(3)->create(['project_id' => $project->id]);
    BriefFeature::factory()->todo()->create(['project_id' => $project->id]);

    $onTimeIssue = Issue::factory()->create([
        'project_id' => $project->id,
        'reported_at' => '2026-07-28 09:00:00',
    ]);
    $onTimeIssue->forceFill([
        'resolved_at' => '2026-07-29 09:00:00',
        'status' => IssueStatus::Resolved,
        'is_on_time' => true,
    ])->saveQuietly();

    Issue::factory()->create([
        'project_id' => $project->id,
        'reported_at' => '2026-07-29 09:00:00',
        'status' => IssueStatus::Open,
    ]);

    $onTimeRequest = FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'requested_at' => '2026-07-28 09:00:00',
    ]);
    $onTimeRequest->forceFill([
        'fulfilled_at' => '2026-07-29 09:00:00',
        'status' => FeatureRequestStatus::Fulfilled,
        'is_on_time' => true,
    ])->saveQuietly();

    FeatureRequest::factory()->inProgress()->create([
        'project_id' => $project->id,
        'requested_at' => '2026-07-29 09:00:00',
    ]);

    $this->actingAs($user)
        ->post('/reports', ['period_type' => 'weekly_default'])
        ->assertRedirect();

    $snapshot = ReportSnapshot::query()->firstOrFail();

    expect($snapshot->format_version)->toBe(2)
        ->and($snapshot->okr1_avg_percentage)->toBeNull()
        ->and($snapshot->okr1_project_achievement_percentage)->toBeNull()
        ->and($snapshot->okr2_issue_percentage)->toBeNull()
        ->and($snapshot->okr2_feature_request_percentage)->toBeNull()
        ->and($snapshot->issue_breakdown_json['activities'])->toHaveCount(3)
        ->and($snapshot->feature_request_breakdown_json['activities'])->toHaveCount(3);
});

test('report snapshot returns empty activities when selected period is empty', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();

    $project = Project::factory()->create(['created_at' => '2026-07-20 00:00:00']);
    Issue::factory()->create(['project_id' => $project->id, 'reported_at' => '2026-07-20 09:00:00']);
    FeatureRequest::factory()->create(['project_id' => $project->id, 'requested_at' => '2026-07-20 09:00:00']);

    $this->actingAs($user)
        ->post('/reports', ['period_type' => 'weekly_default'])
        ->assertRedirect();

    $snapshot = ReportSnapshot::query()->firstOrFail();

    expect($snapshot->okr2_issue_percentage)->toBeNull()
        ->and($snapshot->okr2_feature_request_percentage)->toBeNull()
        ->and($snapshot->issue_breakdown_json['activities'])->toBe([])
        ->and($snapshot->feature_request_breakdown_json['activities'])->toBe([]);

    $this->actingAs($user)
        ->get("/reports/{$snapshot->id}")
        ->assertInertia(fn ($page) => $page
            ->where('report.format_version', 2)
            ->where('report.activity_summary.total_activities', 0)
            ->missing('report.okr')
            ->missing('report.breakdowns')
        );
});

test('users can preview a saved report snapshot', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();
    $snapshot = ReportSnapshot::factory()->create([
        'period_start_date' => '2026-07-27',
        'period_end_date' => '2026-08-02',
        'period_type' => 'weekly_default',
        'project_breakdown_json' => [
            'target_percentage' => 75,
            'active_total' => 1,
            'evaluable_total' => 1,
            'achieved_total' => 1,
            'projects' => [[
                'id' => 1,
                'name' => 'Project Snapshot',
                'status' => 'in_progress',
                'status_label' => 'Development',
                'is_active_development' => true,
                'brief_features_total' => 4,
                'brief_features_done' => 3,
                'realization_percentage' => 75,
                'target_percentage' => 75,
                'is_evaluable' => true,
                'achieved' => true,
                'empty_label' => null,
            ]],
            'status_distribution' => [],
        ],
        'okr2_issue_percentage' => 80,
        'okr2_feature_request_percentage' => 90,
    ]);

    $this->actingAs($user)
        ->get("/reports/{$snapshot->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reports/show')
            ->where('report.id', $snapshot->id)
            ->where('report.format_version', 1)
            ->where('report.period.label', '27 Jul 2026 - 2 Agu 2026')
            ->where('report.okr.brief_realization.total_projects', 1)
            ->where('report.okr.brief_realization.evaluable_projects', 1)
            ->where('report.okr.brief_realization.achieved_projects', 1)
        );
});
