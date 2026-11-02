<?php

use App\Actions\Dashboard\BuildDashboardData;
use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;

afterEach(function (): void {
    Carbon::setTestNow();
});

test('guests are redirected to login when visiting dashboard', function (): void {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated user receives dashboard summary component and period metadata', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('dashboard.period.start', '2026-07-01')
            ->where('dashboard.period.end', '2026-09-30')
            ->where('dashboard.period.quarter', 3)
            ->where('dashboard.period.year', 2026)
            ->where('dashboard.period.label', 'Q3 2026 · 1 Jul 2026 - 30 Sep 2026')
            ->where('dashboard.period.generated_at', '2026-07-30 19:00')
        );
});

test('dashboard changes quarter at local midnight in the business timezone', function (string $now, string $start, string $end, int $quarter, int $year): void {
    Carbon::setTestNow($now);

    $period = app(BuildDashboardData::class)->handle()['period'];

    expect($period)->toMatchArray([
        'start' => $start,
        'end' => $end,
        'quarter' => $quarter,
        'year' => $year,
    ]);
})->with([
    'before Q2' => ['2026-03-31 16:59:59', '2026-01-01', '2026-03-31', 1, 2026],
    'start Q2' => ['2026-03-31 17:00:00', '2026-04-01', '2026-06-30', 2, 2026],
    'before Q3' => ['2026-06-30 16:59:59', '2026-04-01', '2026-06-30', 2, 2026],
    'start Q3' => ['2026-06-30 17:00:00', '2026-07-01', '2026-09-30', 3, 2026],
    'before Q4' => ['2026-09-30 16:59:59', '2026-07-01', '2026-09-30', 3, 2026],
    'start Q4' => ['2026-09-30 17:00:00', '2026-10-01', '2026-12-31', 4, 2026],
    'before new year' => ['2026-12-31 16:59:59', '2026-10-01', '2026-12-31', 4, 2026],
    'start new year' => ['2026-12-31 17:00:00', '2027-01-01', '2027-03-31', 1, 2027],
]);

test('dashboard calculates okr one independently for each active development project', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();

    $halfDoneProject = Project::factory()->inProgress()->create([
        'name' => 'Project A',
    ]);
    BriefFeature::factory()->done()->create(['project_id' => $halfDoneProject->id]);
    BriefFeature::factory()->todo()->create(['project_id' => $halfDoneProject->id]);

    $fullyDoneProject = Project::factory()->completedPendingDeployment()->create();
    $fullyDoneProject->update(['name' => 'Project B']);
    BriefFeature::factory()->done()->count(3)->create(['project_id' => $fullyDoneProject->id]);
    BriefFeature::factory()->todo()->create(['project_id' => $fullyDoneProject->id]);

    $deployedProject = Project::factory()->deployedRunning()->create();
    BriefFeature::factory()->todo()->count(3)->create(['project_id' => $deployedProject->id]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('dashboard.okr.brief_realization.target', 75)
            ->where('dashboard.okr.brief_realization.total_projects', 2)
            ->where('dashboard.okr.brief_realization.evaluable_projects', 2)
            ->where('dashboard.okr.brief_realization.achieved_projects', 1)
            ->has('dashboard.okr.brief_realization.projects', 2)
            ->where('dashboard.okr.brief_realization.projects.0.name', 'Project A')
            ->where('dashboard.okr.brief_realization.projects.0.realization_percentage', 50)
            ->where('dashboard.okr.brief_realization.projects.0.achieved', false)
            ->where('dashboard.okr.brief_realization.projects.1.name', 'Project B')
            ->where('dashboard.okr.brief_realization.projects.1.realization_percentage', 75)
            ->where('dashboard.okr.brief_realization.projects.1.achieved', true)
        );
});

test('dashboard marks an active project without brief features as not evaluable', function (): void {
    $user = User::factory()->create();
    Project::factory()->inProgress()->create(['name' => 'Project Tanpa Brief']);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('dashboard.okr.brief_realization.total_projects', 1)
            ->where('dashboard.okr.brief_realization.evaluable_projects', 0)
            ->where('dashboard.okr.brief_realization.achieved_projects', 0)
            ->where('dashboard.okr.brief_realization.projects.0.name', 'Project Tanpa Brief')
            ->where('dashboard.okr.brief_realization.projects.0.realization_percentage', null)
            ->where('dashboard.okr.brief_realization.projects.0.is_evaluable', false)
            ->where('dashboard.okr.brief_realization.projects.0.achieved', null)
        );
});

test('dashboard calculates current quarter issue okr with unresolved and older same-quarter items in denominator', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();
    $project = Project::factory()->deployedRunning()->create();

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

    Issue::factory()->create([
        'project_id' => $project->id,
        'reported_at' => '2026-07-20 09:00:00',
        'due_date' => '2026-07-22 09:00:00',
        'resolved_at' => '2026-07-21 09:00:00',
        'status' => IssueStatus::Resolved,
        'is_on_time' => true,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('dashboard.okr.issue_on_time.actual', 66.7)
            ->where('dashboard.okr.issue_on_time.target', 80)
            ->where('dashboard.okr.issue_on_time.delta', -13.3)
            ->where('dashboard.okr.issue_on_time.total_items', 3)
            ->where('dashboard.okr.issue_on_time.on_time_items', 2)
            ->where('dashboard.okr.issue_on_time.achieved', false)
        );
});

test('dashboard returns one hundred percent okrs when current quarter has no items', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();

    Issue::factory()->create(['reported_at' => '2026-06-20 09:00:00']);
    FeatureRequest::factory()->create(['requested_at' => '2026-06-20 09:00:00']);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('dashboard.okr.issue_on_time.actual', 100)
            ->where('dashboard.okr.issue_on_time.total_items', 0)
            ->where('dashboard.okr.issue_on_time.achieved', true)
            ->where('dashboard.okr.issue_on_time.empty_label', 'Belum ada issue baru kuartal ini.')
            ->where('dashboard.okr.feature_request_on_time.actual', 100)
            ->where('dashboard.okr.feature_request_on_time.total_items', 0)
            ->where('dashboard.okr.feature_request_on_time.achieved', true)
            ->where('dashboard.okr.feature_request_on_time.empty_label', 'Belum ada feature request baru kuartal ini.')
        );
});

test('dashboard calculates current quarter feature request okr', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();
    $project = Project::factory()->deployedRunning()->create();

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
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('dashboard.okr.feature_request_on_time.actual', 50)
            ->where('dashboard.okr.feature_request_on_time.target', 90)
            ->where('dashboard.okr.feature_request_on_time.delta', -40)
            ->where('dashboard.okr.feature_request_on_time.total_items', 2)
            ->where('dashboard.okr.feature_request_on_time.on_time_items', 1)
            ->where('dashboard.okr.feature_request_on_time.achieved', false)
        );
});

test('dashboard bounds quarterly cohorts and requires valid completed on-time facts', function (string $model, string $reportedField, string $completedField, string $completedStatus, string $metric): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $project = Project::factory()->deployedRunning()->create();
    $base = ['project_id' => $project->id, $reportedField => '2026-07-01 00:00:00'];

    foreach ([
        [$reportedField => '2026-06-30 17:00:00', $completedField => '2026-07-01 01:00:00', 'status' => $completedStatus, 'is_on_time' => true],
        [$reportedField => '2026-07-30 12:00:00', $completedField => '2026-07-30 12:00:00', 'status' => $completedStatus, 'is_on_time' => true],
        [$completedField => '2026-07-30 12:00:01', 'status' => $completedStatus, 'is_on_time' => true],
        [$completedField => null, 'status' => $completedStatus, 'is_on_time' => true],
        [$completedField => '2026-07-02 00:00:00', 'status' => 'open', 'is_on_time' => true],
        [$completedField => '2026-07-02 00:00:00', 'status' => $completedStatus, 'is_on_time' => false],
        [$reportedField => '2026-06-30 16:59:59', $completedField => '2026-07-02 00:00:00', 'status' => $completedStatus, 'is_on_time' => true],
        [$reportedField => '2026-07-30 12:00:01', $completedField => null, 'status' => 'open', 'is_on_time' => null],
        ['created_at' => '2026-07-30 12:00:01', $completedField => '2026-07-02 00:00:00', 'status' => $completedStatus, 'is_on_time' => true],
    ] as $facts) {
        $item = $model::factory()->create($base);
        $item->forceFill($facts)->saveQuietly();
    }

    $data = app(BuildDashboardData::class)->handle();

    expect($data['okr'][$metric])->toMatchArray([
        'total_items' => 6,
        'on_time_items' => 2,
        'actual' => 33.3,
        'achieved' => false,
    ]);
})->with([
    'issues' => [Issue::class, 'reported_at', 'resolved_at', IssueStatus::Resolved->value, 'issue_on_time'],
    'feature requests' => [FeatureRequest::class, 'requested_at', 'fulfilled_at', FeatureRequestStatus::Fulfilled->value, 'feature_request_on_time'],
]);

test('dashboard retains cumulative project progress across quarters and excludes future facts', function (): void {
    Carbon::setTestNow('2026-06-30 16:59:59');

    $project = Project::factory()->inProgress()->create(['name' => 'Project Kumulatif']);
    BriefFeature::factory()->done()->count(3)->create(['project_id' => $project->id]);
    BriefFeature::factory()->todo()->create(['project_id' => $project->id]);

    $futureCompletion = BriefFeature::factory()->done()->create(['project_id' => $project->id]);
    $futureCompletion->forceFill(['completed_at' => '2026-07-02 00:00:00'])->saveQuietly();

    $futureFeature = BriefFeature::factory()->done()->create(['project_id' => $project->id]);
    $futureFeature->forceFill(['created_at' => '2026-07-02 00:00:00'])->saveQuietly();
    Project::factory()->inProgress()->create(['created_at' => '2026-07-02 00:00:00']);

    foreach (['2026-06-30 16:59:59', '2026-06-30 17:00:00'] as $now) {
        Carbon::setTestNow($now);

        $data = app(BuildDashboardData::class)->handle();

        expect($data['okr']['brief_realization'])->toMatchArray([
            'total_projects' => 1,
            'evaluable_projects' => 1,
            'achieved_projects' => 0,
        ])->and($data['okr']['brief_realization']['projects'][0])->toMatchArray([
            'id' => $project->id,
            'brief_features_total' => 5,
            'brief_features_done' => 3,
            'realization_percentage' => 60.0,
            'target_percentage' => 75,
        ])->and($data['operational']['total_projects'])->toBe(2);
    }
});

test('dashboard exposes operational health and project status distribution', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();

    Project::factory()->planning()->create();
    Project::factory()->inProgress()->create();
    Project::factory()->deployedMaintenance()->create();
    $running = Project::factory()->deployedRunning()->create();

    Issue::factory()->create([
        'project_id' => $running->id,
        'reported_at' => '2026-07-20 09:00:00',
        'due_date' => '2026-07-21',
        'status' => IssueStatus::Open,
    ]);

    FeatureRequest::factory()->inProgress()->create([
        'project_id' => $running->id,
        'requested_at' => '2026-07-20 09:00:00',
        'due_date' => '2026-07-21',
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('dashboard.operational.total_projects', 4)
            ->where('dashboard.operational.deployed_maintenance', 1)
            ->where('dashboard.operational.open_issues', 1)
            ->where('dashboard.operational.overdue_issues', 1)
            ->where('dashboard.operational.open_feature_requests', 1)
            ->where('dashboard.operational.overdue_feature_requests', 1)
            ->where('dashboard.projectStatusDistribution.0.value', 'planning')
            ->where('dashboard.projectStatusDistribution.0.count', 1)
            ->where('dashboard.projectStatusDistribution.1.value', 'in_progress')
            ->where('dashboard.projectStatusDistribution.1.count', 1)
            ->where('dashboard.projectStatusDistribution.5.value', 'deployed_maintenance')
            ->where('dashboard.projectStatusDistribution.5.count', 1)
        );
});

test('dashboard attention lists contain only oldest overdue active items and are limited to five', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();
    $project = Project::factory()->deployedRunning()->create();

    foreach (range(1, 6) as $index) {
        Issue::factory()->create([
            'project_id' => $project->id,
            'title' => "Issue overdue {$index}",
            'reported_at' => "2026-07-0{$index} 09:00:00",
            'due_date' => "2026-07-0{$index}",
            'status' => IssueStatus::Open,
        ]);

        FeatureRequest::factory()->inProgress()->create([
            'project_id' => $project->id,
            'title' => "Request overdue {$index}",
            'requested_at' => "2026-07-0{$index} 09:00:00",
            'due_date' => "2026-07-0{$index}",
        ]);
    }

    Issue::factory()->create([
        'project_id' => $project->id,
        'title' => 'Issue resolved overdue',
        'reported_at' => '2026-07-01 09:00:00',
        'due_date' => '2026-07-01',
        'resolved_at' => '2026-07-02 09:00:00',
        'status' => IssueStatus::Resolved,
    ]);

    $fulfilledRequest = FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'title' => 'Request fulfilled overdue',
        'requested_at' => '2026-07-01 09:00:00',
        'due_date' => '2026-07-01',
    ]);
    $fulfilledRequest->forceFill([
        'fulfilled_at' => '2026-07-02 09:00:00',
        'status' => FeatureRequestStatus::Fulfilled,
        'is_on_time' => false,
    ])->saveQuietly();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->has('dashboard.attention.issues', 5)
            ->where('dashboard.attention.issues.0.title', 'Issue overdue 1')
            ->where('dashboard.attention.issues.4.title', 'Issue overdue 5')
            ->has('dashboard.attention.feature_requests', 5)
            ->where('dashboard.attention.feature_requests.0.title', 'Request overdue 1')
            ->where('dashboard.attention.feature_requests.4.title', 'Request overdue 5')
        );
});
