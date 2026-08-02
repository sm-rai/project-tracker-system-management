<?php

use App\Models\Issue;
use App\Models\Project;
use App\Models\SlaConfig;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    SlaConfig::updateOrCreate(['priority' => 'urgent'], ['target_resolution_hours' => 24]);
    SlaConfig::updateOrCreate(['priority' => 'normal'], ['target_resolution_hours' => 72]);
    SlaConfig::updateOrCreate(['priority' => 'low'], ['target_resolution_hours' => 168]);
});

test('authenticated user can view issue list page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('issues.index'));

    $response->assertOk();
});

test('user can create issue and due date is calculated based on sla config', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'deployed_running']);

    $reportedAt = '2026-08-01 10:00:00';
    $response = $this->actingAs($user)->post(route('issues.store'), [
        'project_id' => $project->id,
        'title' => 'Error Server 500 saat Checkout',
        'description' => 'Terjadi error 500 pada API checkout.',
        'priority' => 'urgent',
        'root_cause_category' => 'system_error',
        'reported_at' => $reportedAt,
    ]);

    $response->assertRedirect(route('issues.index'));

    $issue = Issue::first();
    expect($issue->title)->toBe('Error Server 500 saat Checkout');
    expect($issue->due_date->format('Y-m-d H:i:s'))->toBe('2026-08-02 10:00:00');
    expect($issue->status->value)->toBe('open');
});

test('only deployed_running or deployed_maintenance projects can be attached to an issue', function () {
    $user = User::factory()->create();
    $inProgressProject = Project::factory()->create(['status' => 'in_progress']);

    $response = $this->actingAs($user)->post(route('issues.store'), [
        'project_id' => $inProgressProject->id,
        'title' => 'Fitur belum rilis',
        'description' => 'Test',
        'priority' => 'normal',
        'root_cause_category' => 'system_error',
        'reported_at' => now()->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors('project_id');
});

test('issue can be created without project_id for general infrastructure issues', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('issues.store'), [
        'project_id' => null,
        'title' => 'Koneksi Internet Wifi Kantor Down',
        'description' => 'Jaringan bermasalah.',
        'priority' => 'normal',
        'root_cause_category' => 'other',
        'reported_at' => now()->toDateTimeString(),
    ]);

    $response->assertRedirect(route('issues.index'));

    $issue = Issue::first();
    expect($issue->project_id)->toBeNull();
});

test('issue validation errors use Indonesian field names and guidance', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('issues.create'))
        ->post(route('issues.store'), [
            'project_id' => null,
            'priority' => 'normal',
            'reported_at' => now()->toDateTimeString(),
        ]);

    $response
        ->assertRedirect(route('issues.create'))
        ->assertSessionHasErrors([
            'title' => 'Ringkasan issue wajib diisi.',
            'description' => 'Kronologi dan dampak wajib diisi.',
            'root_cause_category' => 'Dugaan penyebab wajib dipilih.',
        ]);
});

test('user can resolve issue and is_on_time is computed accurately', function () {
    $user = User::factory()->create();
    $issue = Issue::factory()->create([
        'priority' => 'urgent',
        'reported_at' => '2026-08-01 10:00:00',
        'status' => 'open',
    ]);

    Carbon::setTestNow('2026-08-02 10:00:00');

    $response = $this->actingAs($user)->patch(route('issues.resolve', $issue), [
        'resolution_note' => 'Perbaikan query database berhasil dilakukan.',
    ]);

    $response->assertRedirect();
    $issue->refresh();

    expect($issue->status->value)->toBe('resolved');
    expect($issue->is_on_time)->toBeTrue();
    expect($issue->resolution_note)->toBe('Perbaikan query database berhasil dilakukan.');
});

test('user can reopen a resolved issue', function () {
    $user = User::factory()->create();
    $issue = Issue::factory()->resolved()->create();

    $response = $this->actingAs($user)->patch(route('issues.reopen', $issue));

    $response->assertRedirect();
    $issue->refresh();

    expect($issue->status->value)->toBe('open');
    expect($issue->resolved_at)->toBeNull();
    expect($issue->is_on_time)->toBeNull();
});
