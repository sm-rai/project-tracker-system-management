<?php

use App\Enums\UserRole;
use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\PersonalAccessToken;

afterEach(function (): void {
    Carbon::setTestNow();
});

test('an admin can issue an expiring project tracker MCP token', function (): void {
    Carbon::setTestNow('2026-08-31 12:00:00');
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->artisan('project-tracker:mcp-token', ['email' => $admin->email])
        ->expectsOutputToContain('PROJECT_TRACKER_MCP_TOKEN=')
        ->assertSuccessful();

    $token = PersonalAccessToken::sole();

    expect($token->tokenable_id)->toBe($admin->id)
        ->and($token->name)->toBe('Codex Project Tracker Production')
        ->and($token->abilities)->toBe(['mcp:use'])
        ->and($token->expires_at?->toDateTimeString())->toBe('2026-11-29 12:00:00');
});

test('a non-admin cannot receive a project tracker MCP token', function (): void {
    $user = User::factory()->create(['role' => UserRole::User]);

    $this->artisan('project-tracker:mcp-token', ['email' => $user->email])
        ->expectsOutputToContain('harus memiliki role admin')
        ->assertFailed();

    expect(PersonalAccessToken::count())->toBe(0);
});

test('issuing a new project tracker MCP token revokes the previous token', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $previousToken = $admin->createToken(
        'Codex Project Tracker Production',
        ['mcp:use'],
    )->accessToken;

    $this->artisan('project-tracker:mcp-token', ['email' => $admin->email])
        ->assertSuccessful();

    expect(PersonalAccessToken::count())->toBe(1)
        ->and(PersonalAccessToken::find($previousToken->id))->toBeNull();
});

test('the project tracker MCP token expiry must be a positive number of days', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->artisan('project-tracker:mcp-token', [
        'email' => $admin->email,
        '--days' => 0,
    ])
        ->expectsOutputToContain('bilangan bulat positif')
        ->assertFailed();

    expect(PersonalAccessToken::count())->toBe(0);
});
