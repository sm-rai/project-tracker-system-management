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
        ->and($snapshot->project_breakdown_json['active_total'])->toBe(1)
        ->and($snapshot->project_breakdown_json['evaluable_total'])->toBe(1)
        ->and($snapshot->project_breakdown_json['achieved_total'])->toBe(0)
        ->and((float) $snapshot->project_breakdown_json['projects'][0]['realization_percentage'])->toBe(50.0)
        ->and($snapshot->project_breakdown_json['projects'][0]['achieved'])->toBe(false)
        ->and($snapshot->project_breakdown_json['projects'][0]['name'])->toBe('CRM Stabilization');
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

test('report snapshot calculates okr metrics for the selected period', function (): void {
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

    expect($snapshot->project_breakdown_json['active_total'])->toBe(1)
        ->and($snapshot->project_breakdown_json['evaluable_total'])->toBe(1)
        ->and($snapshot->project_breakdown_json['achieved_total'])->toBe(1)
        ->and((float) $snapshot->project_breakdown_json['projects'][0]['realization_percentage'])->toBe(75.0)
        ->and($snapshot->project_breakdown_json['projects'][0]['achieved'])->toBe(true)
        ->and((float) $snapshot->okr2_issue_percentage)->toBe(50.0)
        ->and((float) $snapshot->okr2_feature_request_percentage)->toBe(50.0)
        ->and($snapshot->issue_breakdown_json['total'])->toBe(2)
        ->and($snapshot->issue_breakdown_json['on_time'])->toBe(1)
        ->and($snapshot->feature_request_breakdown_json['total'])->toBe(2)
        ->and($snapshot->feature_request_breakdown_json['on_time'])->toBe(1);
});

test('report snapshot returns one hundred percent sla metrics when selected period is empty', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();

    Issue::factory()->create(['reported_at' => '2026-07-20 09:00:00']);
    FeatureRequest::factory()->create(['requested_at' => '2026-07-20 09:00:00']);

    $this->actingAs($user)
        ->post('/reports', ['period_type' => 'weekly_default'])
        ->assertRedirect();

    $snapshot = ReportSnapshot::query()->firstOrFail();

    expect((float) $snapshot->okr2_issue_percentage)->toBe(100.0)
        ->and((float) $snapshot->okr2_feature_request_percentage)->toBe(100.0)
        ->and($snapshot->issue_breakdown_json['total'])->toBe(0)
        ->and($snapshot->feature_request_breakdown_json['total'])->toBe(0)
        ->and($snapshot->issue_breakdown_json['empty_label'])->toBe('Tidak ada issue baru pada periode ini.')
        ->and($snapshot->feature_request_breakdown_json['empty_label'])->toBe('Tidak ada Feature Request baru pada periode ini.');

    $this->actingAs($user)
        ->get("/reports/{$snapshot->id}")
        ->assertInertia(fn ($page) => $page
            ->where('report.okr.issue_on_time.empty_label', 'Tidak ada issue baru')
            ->where('report.okr.feature_request_on_time.empty_label', 'Tidak ada Feature Request baru')
            ->where('report.breakdowns.issues.empty_label', 'Tidak ada issue baru pada periode ini.')
            ->where('report.breakdowns.feature_requests.empty_label', 'Tidak ada Feature Request baru pada periode ini.')
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
            ->where('report.period.label', '27 Jul 2026 - 2 Agu 2026')
            ->where('report.okr.brief_realization.total_projects', 1)
            ->where('report.okr.brief_realization.evaluable_projects', 1)
            ->where('report.okr.brief_realization.achieved_projects', 1)
        );
});
