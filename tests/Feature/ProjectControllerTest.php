<?php

use App\Enums\ProjectStatus;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\User;

test('authenticated user can view projects list with pagination and search filter', function () {
    $user = User::factory()->admin()->create();
    Project::factory()->create(['name' => 'POS System', 'created_by' => $user->id]);
    Project::factory()->create(['name' => 'ERP Inventory', 'created_by' => $user->id]);

    $response = $this->actingAs($user)
        ->get(route('projects.index', ['search' => 'POS']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('projects/index')
        ->has('projects.data', 1)
        ->where('projects.data.0.name', 'POS System')
        ->where('filters.search', 'POS')
    );
});

test('project index summarizes okr one by project instead of an average', function () {
    $user = User::factory()->admin()->create();
    $achievedProject = Project::factory()->inProgress()->create(['created_by' => $user->id]);
    BriefFeature::factory()->done()->count(3)->create(['project_id' => $achievedProject->id]);
    BriefFeature::factory()->todo()->create(['project_id' => $achievedProject->id]);
    Project::factory()->inProgress()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->get(route('projects.index'))
        ->assertInertia(fn ($page) => $page
            ->where('summary.okr1_total_projects', 2)
            ->where('summary.okr1_evaluable_projects', 1)
            ->where('summary.okr1_achieved_projects', 1)
            ->missing('summary.okr1_avg_realization')
        );
});

test('authenticated user can store new project with brief features and assigned users', function () {
    $admin = User::factory()->admin()->create();
    $dev1 = User::factory()->create(['name' => 'Developer Alpha']);
    $dev2 = User::factory()->create(['name' => 'Developer Beta']);

    $response = $this->actingAs($admin)
        ->post(route('projects.store'), [
            'name' => 'WMS Atsiri',
            'description' => 'Warehouse management system',
            'status' => 'in_progress',
            'start_date' => '2026-08-01',
            'target_end_date' => '2026-09-01',
            'user_ids' => [$dev1->id, $dev2->id],
            'brief_features' => [
                ['name' => 'Stock Inward', 'description' => 'Input barang masuk'],
                ['name' => 'Stock Outward', 'description' => 'Input barang keluar'],
            ],
        ]);

    $project = Project::where('name', 'WMS Atsiri')->first();
    expect($project)->not->toBeNull();
    $response->assertRedirect(route('projects.show', $project));
    expect($project->briefFeatures)->toHaveCount(2);
    expect($project->users)->toHaveCount(2);
    expect($project->users->pluck('id')->toArray())->toContain($dev1->id, $dev2->id);
});

test('authenticated user can view project show page with brief features and assigned developers', function () {
    $user = User::factory()->admin()->create();
    $dev = User::factory()->create();
    $project = Project::factory()->create(['created_by' => $user->id]);
    $project->users()->attach($dev);
    BriefFeature::factory()->create(['project_id' => $project->id, 'name' => 'Fitur 1', 'status' => 'done']);
    BriefFeature::factory()->create(['project_id' => $project->id, 'name' => 'Fitur 2', 'status' => 'todo']);

    $response = $this->actingAs($user)
        ->get(route('projects.show', $project));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('projects/show')
        ->where('project.id', $project->id)
        ->where('project.realization_percentage', 50)
        ->has('project.users', 1)
    );
});

test('authenticated user can update project assigned developers and auto fill actual_end_date when deployed', function () {
    $user = User::factory()->admin()->create();
    $dev = User::factory()->create();
    $project = Project::factory()->create([
        'created_by' => $user->id,
        'status' => ProjectStatus::InProgress->value,
        'actual_end_date' => null,
    ]);

    $response = $this->actingAs($user)
        ->put(route('projects.update', $project), [
            'name' => $project->name,
            'description' => 'Updated Description',
            'status' => ProjectStatus::DeployedRunning->value,
            'user_ids' => [$dev->id],
        ]);

    $response->assertRedirect(route('projects.show', $project));
    $project->refresh();
    expect($project->status)->toBe(ProjectStatus::DeployedRunning);
    expect($project->actual_end_date)->not->toBeNull();
    expect($project->users)->toHaveCount(1);
    expect($project->users->first()->id)->toBe($dev->id);
});

test('legacy running project keeps unknown actual end date when edited', function () {
    $user = User::factory()->admin()->create();
    $project = Project::factory()->deployedRunning()->create([
        'created_by' => $user->id,
        'start_date' => null,
        'target_end_date' => null,
        'actual_end_date' => null,
    ]);

    $response = $this->actingAs($user)
        ->put(route('projects.update', $project), [
            'name' => $project->name,
            'description' => $project->description,
            'status' => ProjectStatus::DeployedRunning->value,
            'start_date' => null,
            'target_end_date' => null,
            'actual_end_date' => null,
            'user_ids' => [],
        ]);

    $response->assertRedirect(route('projects.show', $project));
    $project->refresh();

    expect($project->actual_end_date)->toBeNull();
});

test('authenticated user can delete project', function () {
    $user = User::factory()->admin()->create();
    $project = Project::factory()->create(['created_by' => $user->id]);

    $response = $this->actingAs($user)
        ->delete(route('projects.destroy', $project));

    $response->assertRedirect(route('projects.index'));
    expect(Project::find($project->id))->toBeNull();
});

test('project detail includes operational issue and feature request history', function () {
    $user = User::factory()->admin()->create();
    $project = Project::factory()->deployedRunning()->create(['created_by' => $user->id]);
    Issue::factory()->create(['project_id' => $project->id, 'title' => 'Gangguan sinkronisasi']);
    FeatureRequest::factory()->create(['project_id' => $project->id, 'title' => 'Tambah export']);

    $this->actingAs($user)->get(route('projects.show', $project))
        ->assertInertia(fn ($page) => $page
            ->has('project.issues', 1)
            ->where('project.issues.0.title', 'Gangguan sinkronisasi')
            ->has('project.feature_requests', 1)
            ->where('project.feature_requests.0.title', 'Tambah export')
        );
});
