<?php

use App\Actions\Reports\GenerateReportSnapshot;
use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\ReportSnapshot;
use App\Models\User;
use App\Support\AppDateTime;
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
        ->and($snapshot->format_version)->toBe(3)
        ->and($snapshot->project_breakdown_json['active_projects'])->toHaveCount(1)
        ->and($snapshot->project_breakdown_json['active_projects'][0])->toMatchArray([
            'name' => 'CRM Stabilization',
            'brief_features_done' => 1,
            'brief_features_total' => 2,
            'progress_percentage' => 50.0,
        ]);
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

    expect($snapshot->format_version)->toBe(3)
        ->and($snapshot->okr1_avg_percentage)->toBeNull()
        ->and($snapshot->okr1_project_achievement_percentage)->toBeNull()
        ->and($snapshot->okr2_issue_percentage)->toBeNull()
        ->and($snapshot->okr2_feature_request_percentage)->toBeNull()
        ->and($snapshot->project_breakdown_json['active_projects'][0]['progress_percentage'])->toBe(75)
        ->and($snapshot->issue_breakdown_json['resolved_items'])->toHaveCount(1)
        ->and($snapshot->feature_request_breakdown_json['fulfilled_items'])->toHaveCount(1);
});

test('new snapshots save active project progress and only issue and feature request resolutions in the period', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $project = Project::factory()->inProgress()->create([
        'name' => 'CRM Stabilization',
        'created_at' => '2026-06-01 00:00:00',
    ]);
    $unmeasuredProject = Project::factory()->planning()->create([
        'name' => 'Data Catalog',
        'created_at' => '2026-06-01 00:00:00',
    ]);
    Project::factory()->deployedRunning()->create([
        'name' => 'Portal Live',
        'created_at' => '2026-06-01 00:00:00',
    ]);

    BriefFeature::factory()->done()->createQuietly([
        'project_id' => $project->id,
        'created_at' => '2026-06-02 00:00:00',
        'completed_at' => '2026-06-03 00:00:00',
    ]);
    BriefFeature::factory()->todo()->count(2)->create([
        'project_id' => $project->id,
        'created_at' => '2026-06-04 00:00:00',
    ]);

    $issue = Issue::factory()->create([
        'project_id' => $project->id,
        'title' => 'Login gagal setelah sesi habis',
        'description' => 'Pengguna harus kembali ke halaman login setelah sesi berakhir.',
        'reported_at' => '2026-06-15 09:00:00',
    ]);
    $issue->forceFill([
        'status' => IssueStatus::Resolved,
        'resolved_at' => '2026-07-28 09:30:00',
    ])->saveQuietly();

    Issue::factory()->create([
        'project_id' => $project->id,
        'title' => 'Issue belum selesai',
        'reported_at' => '2026-07-29 09:00:00',
    ]);

    $featureRequest = FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'title' => 'Tambahkan filter status',
        'description' => 'Pengguna ingin menyaring daftar berdasarkan status.',
        'requested_at' => '2026-06-20 09:00:00',
    ]);
    $featureRequest->forceFill([
        'status' => FeatureRequestStatus::Fulfilled,
        'fulfilled_at' => '2026-07-29 10:15:00',
    ])->saveQuietly();

    FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'title' => 'Permintaan belum dipenuhi',
        'requested_at' => '2026-07-29 11:00:00',
    ]);

    $snapshot = app(GenerateReportSnapshot::class)->handle(
        AppDateTime::startOfBusinessDate('2026-07-26'),
        AppDateTime::endOfBusinessDate('2026-08-01'),
        ReportSnapshot::PeriodWeeklyDefault,
    );

    expect($snapshot->format_version)->toBe(3)
        ->and($snapshot->project_breakdown_json['active_projects'])->toHaveCount(2)
        ->and($snapshot->project_breakdown_json['active_projects'][0])->toMatchArray([
            'id' => $project->id,
            'name' => 'CRM Stabilization',
            'progress_percentage' => 33.3,
        ])
        ->and($snapshot->project_breakdown_json['active_projects'][1])->toMatchArray([
            'id' => $unmeasuredProject->id,
            'name' => 'Data Catalog',
            'progress_percentage' => null,
        ])
        ->and($snapshot->issue_breakdown_json['resolved_items'])->toHaveCount(1)
        ->and($snapshot->issue_breakdown_json['resolved_items'][0])->toMatchArray([
            'id' => $issue->id,
            'title' => 'Login gagal setelah sesi habis',
            'description' => 'Pengguna harus kembali ke halaman login setelah sesi berakhir.',
            'project_name' => 'CRM Stabilization',
            'solved_at' => '2026-07-28T09:30:00+00:00',
        ])
        ->and($snapshot->feature_request_breakdown_json['fulfilled_items'])->toHaveCount(1)
        ->and($snapshot->feature_request_breakdown_json['fulfilled_items'][0])->toMatchArray([
            'id' => $featureRequest->id,
            'title' => 'Tambahkan filter status',
            'description' => 'Pengguna ingin menyaring daftar berdasarkan status.',
            'project_name' => 'CRM Stabilization',
            'solved_at' => '2026-07-29T10:15:00+00:00',
        ]);
});

test('report snapshot returns empty activities when selected period is empty', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();

    $project = Project::factory()->deployedRunning()->create(['created_at' => '2026-07-20 00:00:00']);
    Issue::factory()->create(['project_id' => $project->id, 'reported_at' => '2026-07-20 09:00:00']);
    FeatureRequest::factory()->create(['project_id' => $project->id, 'requested_at' => '2026-07-20 09:00:00']);

    $this->actingAs($user)
        ->post('/reports', ['period_type' => 'weekly_default'])
        ->assertRedirect();

    $snapshot = ReportSnapshot::query()->firstOrFail();

    expect($snapshot->format_version)->toBe(3)
        ->and($snapshot->okr2_issue_percentage)->toBeNull()
        ->and($snapshot->okr2_feature_request_percentage)->toBeNull()
        ->and($snapshot->project_breakdown_json['active_projects'])->toBe([])
        ->and($snapshot->issue_breakdown_json['resolved_items'])->toBe([])
        ->and($snapshot->feature_request_breakdown_json['fulfilled_items'])->toBe([]);

    $this->actingAs($user)
        ->get("/reports/{$snapshot->id}")
        ->assertInertia(fn ($page) => $page
            ->where('report.format_version', 3)
            ->where('report.active_projects', [])
            ->where('report.resolved_issues', [])
            ->where('report.fulfilled_feature_requests', [])
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
