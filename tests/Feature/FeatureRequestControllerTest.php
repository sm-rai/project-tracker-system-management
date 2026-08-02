<?php

use App\Enums\FeatureRequestStatus;
use App\Models\FeatureRequest;
use App\Models\Project;
use App\Models\SlaConfig;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    SlaConfig::updateOrCreate(['priority' => 'urgent'], ['target_resolution_days' => 1]);
    SlaConfig::updateOrCreate(['priority' => 'normal'], ['target_resolution_days' => 3]);
    SlaConfig::updateOrCreate(['priority' => 'low'], ['target_resolution_days' => 7]);
});

afterEach(function () {
    Carbon::setTestNow();
});

test('feature request can move through its supported workflow', function () {
    $featureRequest = FeatureRequest::factory()->create();

    $featureRequest->markInProgress();

    expect($featureRequest->fresh()->status)->toBe(FeatureRequestStatus::InProgress);

    Carbon::setTestNow($featureRequest->due_date->startOfDay());
    $featureRequest->fulfill('Sudah dirilis ke production.');
    $featureRequest->refresh();

    expect($featureRequest->status)->toBe(FeatureRequestStatus::Fulfilled)
        ->and($featureRequest->fulfilled_at)->not->toBeNull()
        ->and($featureRequest->is_on_time)->toBeTrue()
        ->and($featureRequest->fulfillment_note)->toBe('Sudah dirilis ke production.');

    $featureRequest->reopen();
    $featureRequest->refresh();

    expect($featureRequest->status)->toBe(FeatureRequestStatus::InProgress)
        ->and($featureRequest->fulfilled_at)->toBeNull()
        ->and($featureRequest->is_on_time)->toBeNull()
        ->and($featureRequest->fulfillment_note)->toBe('Sudah dirilis ke production.');

    $featureRequest->fulfill();

    expect($featureRequest->fresh()->fulfillment_note)->toBe('Sudah dirilis ke production.');
});

test('fulfillment note is optional and late fulfillment is recorded', function () {
    $featureRequest = FeatureRequest::factory()->create([
        'requested_at' => '2026-07-01 09:00:00',
        'priority' => 'urgent',
    ]);

    Carbon::setTestNow('2026-07-03 09:00:00');
    $featureRequest->fulfill();
    $featureRequest->refresh();

    expect($featureRequest->fulfillment_note)->toBeNull()
        ->and($featureRequest->is_on_time)->toBeFalse();
});

test('guest is redirected from feature request pages', function () {
    $this->get('/feature-requests')->assertRedirect('/login');
});

test('authenticated user can create a feature request for a deployed project', function () {
    $user = User::factory()->create();
    $project = Project::factory()->deployedRunning()->create();

    $response = $this->actingAs($user)->post('/feature-requests', [
        'project_id' => $project->id,
        'title' => 'Tambahkan approval berjenjang',
        'description' => 'Permintaan dari departemen Finance.',
        'priority' => 'normal',
        'requested_at' => '2026-07-30 09:00:00',
    ]);

    $featureRequest = FeatureRequest::first();

    $response->assertRedirect("/feature-requests/{$featureRequest->id}");
    expect($featureRequest->due_date->format('Y-m-d'))->toBe('2026-08-02')
        ->and($featureRequest->status)->toBe(FeatureRequestStatus::Open);
});

test('create page preselects an eligible project from the query string', function () {
    $user = User::factory()->create();
    $project = Project::factory()->deployedMaintenance()->create();

    $this->actingAs($user)->get("/feature-requests/create?project_id={$project->id}")
        ->assertInertia(fn ($page) => $page
            ->component('feature-requests/create')
            ->where('initialProjectId', $project->id)
        );
});

test('development project cannot be attached to a feature request', function () {
    $user = User::factory()->create();
    $project = Project::factory()->inProgress()->create();

    $this->actingAs($user)->post('/feature-requests', [
        'project_id' => $project->id,
        'title' => 'Permintaan tidak valid',
        'description' => 'Project belum live.',
        'priority' => 'normal',
        'requested_at' => now()->toDateTimeString(),
    ])->assertSessionHasErrors('project_id');
});

test('editing a fulfilled request recalculates due date and on time result', function () {
    $user = User::factory()->create();
    $project = Project::factory()->deployedMaintenance()->create();
    $featureRequest = FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'priority' => 'urgent',
        'requested_at' => '2026-07-01 09:00:00',
    ]);

    Carbon::setTestNow('2026-07-03 09:00:00');
    $featureRequest->fulfill('Rilis tahap pertama.');
    expect($featureRequest->fresh()->is_on_time)->toBeFalse();

    $this->actingAs($user)->put("/feature-requests/{$featureRequest->id}", [
        'project_id' => $project->id,
        'title' => $featureRequest->title,
        'description' => $featureRequest->description,
        'priority' => 'low',
        'requested_at' => '2026-07-01 09:00:00',
    ])->assertRedirect("/feature-requests/{$featureRequest->id}");

    $featureRequest->refresh();

    expect($featureRequest->due_date->format('Y-m-d'))->toBe('2026-07-08')
        ->and($featureRequest->is_on_time)->toBeTrue();
});

test('index exposes filters and paginated feature requests', function () {
    Carbon::setTestNow('2026-07-30 12:00:00');
    $user = User::factory()->create();
    $project = Project::factory()->deployedRunning()->create(['name' => 'POS Atsiri']);

    $onTime = FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'title' => 'Cetak ulang struk',
        'requested_at' => '2026-07-28 09:00:00',
        'priority' => 'low',
    ]);
    $onTime->fulfill();

    FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'title' => 'Tambah metode bayar',
        'requested_at' => '2026-07-29 09:00:00',
        'status' => FeatureRequestStatus::InProgress,
    ]);

    $response = $this->actingAs($user)->get('/feature-requests?search=Cetak&status=fulfilled');

    $response->assertOk()->assertInertia(fn ($page) => $page
        ->component('feature-requests/index', false)
        ->has('featureRequests.data', 1)
        ->has('featureRequests.links')
        ->where('filters.search', 'Cetak')
    );
});

test('index does not load summary props', function () {
    Carbon::setTestNow('2026-07-30 12:00:00');
    $user = User::factory()->create();

    $this->actingAs($user)->get('/feature-requests')
        ->assertInertia(fn ($page) => $page
            ->component('feature-requests/index', false)
            ->missing('metrics')
            ->missing('okr')
        );
});

test('index can filter overdue requests', function () {
    Carbon::setTestNow('2026-07-30 12:00:00');
    $user = User::factory()->create();
    $project = Project::factory()->deployedRunning()->create();

    FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'title' => 'Request terlambat',
        'requested_at' => '2026-07-01 09:00:00',
        'priority' => 'urgent',
    ]);
    FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'title' => 'Request baru',
        'requested_at' => '2026-07-30 09:00:00',
        'priority' => 'low',
    ]);

    $this->actingAs($user)->get('/feature-requests?overdue=1')
        ->assertInertia(fn ($page) => $page
            ->has('featureRequests.data', 1)
            ->where('featureRequests.data.0.title', 'Request terlambat')
        );
});

test('authenticated user can render show and edit pages', function () {
    $user = User::factory()->create();
    $featureRequest = FeatureRequest::factory()->create();

    $this->actingAs($user)->get("/feature-requests/{$featureRequest->id}")
        ->assertInertia(fn ($page) => $page
            ->component('feature-requests/show')
            ->where('featureRequest.id', $featureRequest->id)
        );

    $this->actingAs($user)->get("/feature-requests/{$featureRequest->id}/edit")
        ->assertInertia(fn ($page) => $page
            ->component('feature-requests/edit')
            ->where('featureRequest.id', $featureRequest->id)
        );
});

test('status action endpoints enforce the workflow', function () {
    $user = User::factory()->create();
    $featureRequest = FeatureRequest::factory()->create();

    $this->actingAs($user)->patch("/feature-requests/{$featureRequest->id}/start")
        ->assertRedirect();
    expect($featureRequest->fresh()->status)->toBe(FeatureRequestStatus::InProgress);

    $this->actingAs($user)->patch("/feature-requests/{$featureRequest->id}/fulfill", [
        'fulfillment_note' => 'Selesai diuji pengguna.',
    ])->assertRedirect();
    expect($featureRequest->fresh()->status)->toBe(FeatureRequestStatus::Fulfilled);

    $this->actingAs($user)->patch("/feature-requests/{$featureRequest->id}/start")
        ->assertSessionHasErrors('status');
});

test('only admin can delete a feature request', function () {
    $user = User::factory()->create();
    $admin = User::factory()->admin()->create();
    $featureRequest = FeatureRequest::factory()->create();

    $this->actingAs($user)->delete("/feature-requests/{$featureRequest->id}")
        ->assertForbidden();

    $this->actingAs($admin)->delete("/feature-requests/{$featureRequest->id}")
        ->assertRedirect('/feature-requests');

    expect(FeatureRequest::find($featureRequest->id))->toBeNull();
});
