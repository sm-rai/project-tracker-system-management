<?php

use App\Enums\BriefFeatureStatus;
use App\Enums\Priority;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\SlaConfig;
use App\Models\User;

beforeEach(function () {
    SlaConfig::factory()->urgent()->create();
    SlaConfig::factory()->normal()->create();
    SlaConfig::factory()->low()->create();
});

// ─── Project Policy ──────────────────────────────────────────────

test('any user can view projects', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    expect($user->can('viewAny', Project::class))->toBeTrue()
        ->and($user->can('view', $project))->toBeTrue();
});

test('only admin can create projects', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    expect($admin->can('create', Project::class))->toBeTrue()
        ->and($user->can('create', Project::class))->toBeFalse();
});

test('only admin can delete projects', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $project = Project::factory()->create();

    expect($admin->can('delete', $project))->toBeTrue()
        ->and($user->can('delete', $project))->toBeFalse();
});

test('admin can update any project', function () {
    $admin = User::factory()->admin()->create();
    $project = Project::factory()->create();

    expect($admin->can('update', $project))->toBeTrue();
});

test('assigned user can update project details', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $project->users()->attach($user);

    expect($user->can('update', $project))->toBeTrue();
});

test('unassigned user cannot update project details', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();

    expect($user->can('update', $project))->toBeFalse();
});

test('only admin can update project status', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $project->users()->attach($user);

    expect($admin->can('updateStatus', $project))->toBeTrue()
        ->and($user->can('updateStatus', $project))->toBeFalse();
});

test('only admin can manage project assignment', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $project->users()->attach($user);

    expect($admin->can('manageAssignment', $project))->toBeTrue()
        ->and($user->can('manageAssignment', $project))->toBeFalse();
});

// ─── BriefFeature Policy ─────────────────────────────────────────

test('any user can view brief features', function () {
    $user = User::factory()->create();
    $briefFeature = BriefFeature::factory()->create();

    expect($user->can('viewAny', BriefFeature::class))->toBeTrue()
        ->and($user->can('view', $briefFeature))->toBeTrue();
});

test('assigned user can update and delete brief features in their project', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $project->users()->attach($user);
    $briefFeature = BriefFeature::factory()->create(['project_id' => $project->id]);

    expect($user->can('update', $briefFeature))->toBeTrue()
        ->and($user->can('delete', $briefFeature))->toBeTrue();
});

test('unassigned user cannot update or delete brief features', function () {
    $user = User::factory()->create();
    $briefFeature = BriefFeature::factory()->create();

    expect($user->can('update', $briefFeature))->toBeFalse()
        ->and($user->can('delete', $briefFeature))->toBeFalse();
});

test('admin can update and delete any brief feature', function () {
    $admin = User::factory()->admin()->create();
    $briefFeature = BriefFeature::factory()->create();

    expect($admin->can('update', $briefFeature))->toBeTrue()
        ->and($admin->can('delete', $briefFeature))->toBeTrue();
});

// ─── Issue Policy ────────────────────────────────────────────────

test('any user can create and update issues regardless of assignment', function () {
    $user = User::factory()->create();
    $issue = Issue::factory()->create();

    expect($user->can('create', Issue::class))->toBeTrue()
        ->and($user->can('update', $issue))->toBeTrue();
});

test('only admin can delete issues', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $issue = Issue::factory()->create();

    expect($admin->can('delete', $issue))->toBeTrue()
        ->and($user->can('delete', $issue))->toBeFalse();
});

// ─── FeatureRequest Policy ───────────────────────────────────────

test('any user can create and update feature requests regardless of assignment', function () {
    $user = User::factory()->create();
    $featureRequest = FeatureRequest::factory()->create();

    expect($user->can('create', FeatureRequest::class))->toBeTrue()
        ->and($user->can('update', $featureRequest))->toBeTrue();
});

test('only admin can delete feature requests', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $featureRequest = FeatureRequest::factory()->create();

    expect($admin->can('delete', $featureRequest))->toBeTrue()
        ->and($user->can('delete', $featureRequest))->toBeFalse();
});

// ─── SlaConfig Policy ───────────────────────────────────────────

test('any user can view SLA configs', function () {
    $user = User::factory()->create();
    $slaConfig = SlaConfig::first();

    expect($user->can('viewAny', SlaConfig::class))->toBeTrue()
        ->and($user->can('view', $slaConfig))->toBeTrue();
});

test('only admin can modify SLA configs', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $slaConfig = SlaConfig::first();

    expect($admin->can('update', $slaConfig))->toBeTrue()
        ->and($user->can('update', $slaConfig))->toBeFalse()
        ->and($admin->can('create', SlaConfig::class))->toBeTrue()
        ->and($user->can('create', SlaConfig::class))->toBeFalse();
});

// ─── User Policy ─────────────────────────────────────────────────

test('only admin can manage users', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    expect($admin->can('create', User::class))->toBeTrue()
        ->and($admin->can('update', $otherUser))->toBeTrue()
        ->and($admin->can('delete', $otherUser))->toBeTrue()
        ->and($user->can('create', User::class))->toBeFalse()
        ->and($user->can('update', $otherUser))->toBeFalse()
        ->and($user->can('delete', $otherUser))->toBeFalse();
});

// ─── Model Event Tests ──────────────────────────────────────────

test('brief feature sets completed_at when status changes to done', function () {
    $briefFeature = BriefFeature::factory()->create(['status' => BriefFeatureStatus::Todo]);

    expect($briefFeature->completed_at)->toBeNull();

    $briefFeature->update(['status' => BriefFeatureStatus::Done]);

    expect($briefFeature->fresh()->completed_at)->not->toBeNull();
});

test('brief feature clears completed_at when status changes away from done', function () {
    $briefFeature = BriefFeature::factory()->done()->create();

    expect($briefFeature->completed_at)->not->toBeNull();

    $briefFeature->update(['status' => BriefFeatureStatus::InProgress]);

    expect($briefFeature->fresh()->completed_at)->toBeNull();
});

test('issue due_date is auto-calculated from SLA config on creation', function () {
    $issue = Issue::factory()->create([
        'priority' => Priority::Urgent,
        'reported_at' => '2026-07-28 10:00:00',
    ]);

    expect($issue->due_date->format('Y-m-d'))->toBe('2026-07-29');
});

test('issue is_on_time is computed when resolved_at is set', function () {
    $issue = Issue::factory()->create([
        'priority' => Priority::Normal,
        'reported_at' => now(),
    ]);

    $issue->update(['resolved_at' => now()]);

    expect($issue->fresh()->is_on_time)->toBeTrue();
});

test('feature request due_date is auto-calculated from SLA config on creation', function () {
    $featureRequest = FeatureRequest::factory()->create([
        'priority' => Priority::Low,
        'requested_at' => '2026-07-28 10:00:00',
    ]);

    expect($featureRequest->due_date->format('Y-m-d'))->toBe('2026-08-04');
});

test('feature request is_on_time is computed when fulfilled_at is set', function () {
    $featureRequest = FeatureRequest::factory()->create([
        'priority' => Priority::Normal,
        'requested_at' => now(),
    ]);

    $featureRequest->update(['fulfilled_at' => now()]);

    expect($featureRequest->fresh()->is_on_time)->toBeTrue();
});

// ─── Realization Percentage ──────────────────────────────────────

test('project realization percentage is calculated correctly', function () {
    $project = Project::factory()->create();

    expect($project->realization_percentage)->toBe(0.0);

    BriefFeature::factory()->count(2)->create([
        'project_id' => $project->id,
        'status' => BriefFeatureStatus::Todo,
    ]);
    BriefFeature::factory()->done()->count(3)->create([
        'project_id' => $project->id,
    ]);

    expect($project->fresh()->realization_percentage)->toBe(60.0);
});
