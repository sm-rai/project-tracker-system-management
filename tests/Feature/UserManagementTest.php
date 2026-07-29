<?php

use App\Models\User;

test('admin can view user list with pagination and search filter', function () {
    $admin = User::factory()->admin()->create(['name' => 'Admin Boss']);
    User::factory()->create(['name' => 'Charlie Alpha', 'email' => 'charlie@example.com']);
    User::factory()->create(['name' => 'Delta Echo', 'email' => 'delta@example.com']);

    $response = $this->actingAs($admin)
        ->get(route('users.index', ['search' => 'Charlie']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('users/index')
        ->has('users.data', 1)
        ->where('users.data.0.name', 'Charlie Alpha')
        ->where('filters.search', 'Charlie')
    );
});

test('admin can view create user page', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get(route('users.create'));

    $response->assertOk();
});

test('admin can store new user', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post(route('users.store'), [
            'name' => 'New Team Member',
            'email' => 'member@example.com',
            'role' => 'user',
            'password' => 'password123',
        ]);

    $response->assertRedirect(route('users.index'));
    expect(User::where('email', 'member@example.com')->exists())->toBeTrue();
});

test('admin can view user edit page', function () {
    $admin = User::factory()->admin()->create();
    $targetUser = User::factory()->create();

    $response = $this->actingAs($admin)
        ->get(route('users.edit', $targetUser));

    $response->assertOk();
});

test('admin can update user details', function () {
    $admin = User::factory()->admin()->create();
    $targetUser = User::factory()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
    ]);

    $response = $this->actingAs($admin)
        ->put(route('users.update', $targetUser), [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'role' => 'admin',
        ]);

    $response->assertRedirect(route('users.index'));
    expect($targetUser->fresh())
        ->name->toBe('Updated Name')
        ->email->toBe('updated@example.com')
        ->role->value->toBe('admin');
});

test('admin can soft delete another user', function () {
    $admin = User::factory()->admin()->create();
    $targetUser = User::factory()->create();

    $response = $this->actingAs($admin)
        ->delete(route('users.destroy', $targetUser));

    $response->assertRedirect();
    expect($targetUser->fresh()->trashed())->toBeTrue();
});

test('admin cannot soft delete themselves', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->delete(route('users.destroy', $admin));

    $response->assertForbidden();
    expect($admin->fresh()->trashed())->toBeFalse();
});

test('regular user cannot delete users', function () {
    $user = User::factory()->create();
    $targetUser = User::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('users.destroy', $targetUser));

    $response->assertForbidden();
    expect($targetUser->fresh()->trashed())->toBeFalse();
});

test('admin can restore a soft deleted user', function () {
    $admin = User::factory()->admin()->create();
    $targetUser = User::factory()->create();
    $targetUser->delete();

    expect($targetUser->fresh()->trashed())->toBeTrue();

    $response = $this->actingAs($admin)
        ->post(route('users.restore', $targetUser->id));

    $response->assertRedirect();
    expect($targetUser->fresh()->trashed())->toBeFalse();
});
