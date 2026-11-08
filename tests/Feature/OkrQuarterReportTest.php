<?php

use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\OkrQuarterSnapshot;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

afterEach(function (): void {
    Carbon::setTestNow();
});

test('authenticated users can view quarterly okr metrics and item details', function (): void {
    Carbon::setTestNow('2026-11-08 12:00:00');

    $user = User::factory()->create();
    $project = Project::factory()->inProgress()->create([
        'name' => 'Portal Internal',
        'created_at' => '2026-10-05 00:00:00',
    ]);

    BriefFeature::factory()->done()->createQuietly([
        'project_id' => $project->id,
        'name' => 'Pencarian project',
        'created_at' => '2026-10-06 00:00:00',
        'completed_at' => '2026-10-20 00:00:00',
    ]);
    BriefFeature::factory()->inProgress()->create([
        'project_id' => $project->id,
        'name' => 'Filter status',
        'created_at' => '2026-10-07 00:00:00',
    ]);

    $issue = Issue::factory()->create([
        'title' => 'Pencarian gagal',
        'reported_at' => '2026-10-12 09:00:00',
        'due_date' => '2026-10-15 09:00:00',
    ]);
    $issue->forceFill([
        'status' => IssueStatus::Resolved,
        'resolved_at' => '2026-10-14 09:00:00',
        'is_on_time' => true,
    ])->saveQuietly();

    $featureRequest = FeatureRequest::factory()->create([
        'title' => 'Tambahkan filter kategori',
        'requested_at' => '2026-10-13 09:00:00',
        'due_date' => '2026-10-16 09:00:00',
    ]);
    $featureRequest->forceFill([
        'status' => FeatureRequestStatus::Fulfilled,
        'fulfilled_at' => '2026-10-15 09:00:00',
        'is_on_time' => true,
    ])->saveQuietly();

    Issue::factory()->create([
        'title' => 'Issue kuartal sebelumnya',
        'reported_at' => '2026-09-30 09:00:00',
    ]);

    $this->actingAs($user)
        ->get('/okr-reports?year=2026&quarter=4')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('okr-reports/index')
            ->where('report.period.label', 'Q4 2026 · 1 Okt 2026 - 31 Des 2026')
            ->where('report.period.is_current', true)
            ->where('report.okr.brief_realization.projects.0.name', 'Portal Internal')
            ->where('report.okr.brief_realization.projects.0.realization_percentage', 50)
            ->where('report.okr.issue_on_time.total_items', 1)
            ->where('report.okr.issue_on_time.on_time_items', 1)
            ->where('report.okr.feature_request_on_time.total_items', 1)
            ->where('report.okr.feature_request_on_time.on_time_items', 1)
            ->where('report.details.projects.0.brief_features.0.name', 'Pencarian project')
            ->where('report.details.issues.0.title', 'Pencarian gagal')
            ->where('report.details.feature_requests.0.title', 'Tambahkan filter kategori')
        );
});

test('historical quarter report uses its end date for okr scores and item details', function (): void {
    Carbon::setTestNow('2026-11-08 12:00:00');

    $user = User::factory()->create();
    $project = Project::factory()->deployedRunning()->create([
        'created_at' => '2026-07-01 00:00:00',
    ]);

    $issue = Issue::factory()->create([
        'title' => 'Issue selesai setelah Q3',
        'project_id' => $project->id,
        'reported_at' => '2026-09-28 09:00:00',
        'due_date' => '2026-10-05 09:00:00',
        'created_at' => '2026-09-28 09:00:00',
    ]);
    $issue->forceFill([
        'status' => IssueStatus::Resolved,
        'resolved_at' => '2026-10-02 09:00:00',
        'is_on_time' => true,
    ])->saveQuietly();

    Issue::factory()->create([
        'title' => 'Issue Q4',
        'project_id' => $project->id,
        'reported_at' => '2026-10-01 09:00:00',
    ]);

    $this->actingAs($user)
        ->get('/okr-reports?year=2026&quarter=3')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('okr-reports/index')
            ->where('report.period.is_current', false)
            ->where('report.okr.issue_on_time.total_items', 1)
            ->where('report.okr.issue_on_time.on_time_items', 0)
            ->where('report.details.issues.0.title', 'Issue selesai setelah Q3')
            ->where('report.details.issues.0.status_at_period_end', 'open')
        );
});

test('closed quarter snapshots are created once and keep their original details', function (): void {
    Carbon::setTestNow('2026-11-08 12:00:00');

    $project = Project::factory()->deployedRunning()->create([
        'created_at' => '2026-07-01 00:00:00',
    ]);
    $issue = Issue::factory()->create([
        'title' => 'Q3 issue original',
        'project_id' => $project->id,
        'reported_at' => '2026-09-10 09:00:00',
        'created_at' => '2026-09-10 09:00:00',
    ]);
    $issue->forceFill([
        'status' => IssueStatus::Resolved,
        'resolved_at' => '2026-09-12 09:00:00',
        'is_on_time' => true,
    ])->saveQuietly();

    $this->artisan('okr:snapshot-closed-quarters')->assertSuccessful();

    $snapshot = OkrQuarterSnapshot::query()
        ->where('year', 2026)
        ->where('quarter', 3)
        ->firstOrFail();

    $issue->forceFill([
        'title' => 'Q3 issue changed later',
        'status' => IssueStatus::Open,
        'resolved_at' => null,
        'is_on_time' => null,
    ])->saveQuietly();

    $this->artisan('okr:snapshot-closed-quarters')->assertSuccessful();

    expect(OkrQuarterSnapshot::query()->where('year', 2026)->where('quarter', 3)->count())->toBe(1)
        ->and($snapshot->refresh()->report_data['details']['issues'][0]['title'])->toBe('Q3 issue original');
});

test('guests are redirected to login when visiting quarterly okr reports', function (): void {
    $this->get('/okr-reports')->assertRedirect('/login');
});
