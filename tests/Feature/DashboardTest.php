<?php

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
            ->where('dashboard.period.start', '2026-07-27')
            ->where('dashboard.period.end', '2026-08-02')
            ->where('dashboard.period.label', '27 Jul 2026 - 2 Agu 2026')
            ->where('dashboard.period.generated_at', '2026-07-30 12:00')
        );
});

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

test('dashboard calculates current week issue okr with unresolved items in denominator', function (): void {
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
        'resolved_at' => '2026-07-21 09:00:00',
        'status' => IssueStatus::Resolved,
        'is_on_time' => true,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('dashboard.okr.issue_on_time.actual', 50)
            ->where('dashboard.okr.issue_on_time.target', 80)
            ->where('dashboard.okr.issue_on_time.delta', -30)
            ->where('dashboard.okr.issue_on_time.total_items', 2)
            ->where('dashboard.okr.issue_on_time.on_time_items', 1)
            ->where('dashboard.okr.issue_on_time.achieved', false)
        );
});

test('dashboard returns one hundred percent issue okr when current week has no issues', function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');

    $user = User::factory()->create();

    Issue::factory()->create(['reported_at' => '2026-07-20 09:00:00']);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('dashboard.okr.issue_on_time.actual', 100)
            ->where('dashboard.okr.issue_on_time.total_items', 0)
            ->where('dashboard.okr.issue_on_time.achieved', true)
        );
});

test('dashboard calculates current week feature request okr', function (): void {
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
