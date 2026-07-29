<?php

use App\Enums\BriefFeatureStatus;
use App\Models\BriefFeature;
use App\Models\Project;
use App\Models\User;

test('authenticated user can add brief feature to project', function () {
    $user = User::factory()->admin()->create();
    $project = Project::factory()->create(['created_by' => $user->id]);

    $response = $this->actingAs($user)
        ->post(route('projects.brief-features.store', $project), [
            'name' => 'Feature Live Chat',
            'description' => 'Integrasi chat',
            'status' => 'todo',
        ]);

    $response->assertRedirect();
    expect(BriefFeature::where('name', 'Feature Live Chat')->where('project_id', $project->id)->exists())->toBeTrue();
});

test('authenticated user can update brief feature status and completed_at is set', function () {
    $user = User::factory()->admin()->create();
    $project = Project::factory()->create(['created_by' => $user->id]);
    $feature = BriefFeature::factory()->create([
        'project_id' => $project->id,
        'status' => BriefFeatureStatus::Todo->value,
        'completed_at' => null,
    ]);

    $response = $this->actingAs($user)
        ->patch(route('brief-features.update-status', $feature), [
            'status' => BriefFeatureStatus::Done->value,
        ]);

    $response->assertRedirect();
    $feature->refresh();
    expect($feature->status)->toBe(BriefFeatureStatus::Done);
    expect($feature->completed_at)->not->toBeNull();
});

test('authenticated user can reset status from done to todo and completed_at becomes null', function () {
    $user = User::factory()->admin()->create();
    $project = Project::factory()->create(['created_by' => $user->id]);
    $feature = BriefFeature::factory()->create([
        'project_id' => $project->id,
        'status' => BriefFeatureStatus::Done->value,
        'completed_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->patch(route('brief-features.update-status', $feature), [
            'status' => BriefFeatureStatus::Todo->value,
        ]);

    $response->assertRedirect();
    $feature->refresh();
    expect($feature->status)->toBe(BriefFeatureStatus::Todo);
    expect($feature->completed_at)->toBeNull();
});

test('authenticated user can delete brief feature', function () {
    $user = User::factory()->admin()->create();
    $project = Project::factory()->create(['created_by' => $user->id]);
    $feature = BriefFeature::factory()->create(['project_id' => $project->id]);

    $response = $this->actingAs($user)
        ->delete(route('brief-features.destroy', $feature));

    $response->assertRedirect();
    expect(BriefFeature::find($feature->id))->toBeNull();
});
