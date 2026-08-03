<?php

use App\Models\User;
use App\Models\UserIdentity;
use Illuminate\Database\UniqueConstraintViolationException;

test('a user can have one identity per provider', function () {
    $user = User::factory()->create();

    $identity = UserIdentity::factory()->create([
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_id' => 'google-sub-123',
        'provider_email' => $user->email,
    ]);

    expect($user->fresh()->identities)->toHaveCount(1)
        ->and($identity->user->is($user))->toBeTrue();
});

test('a provider subject cannot be linked to the same provider more than once', function () {
    UserIdentity::factory()->create([
        'provider' => 'google',
        'provider_id' => 'google-sub-123',
    ]);

    expect(fn () => UserIdentity::factory()->create([
        'provider' => 'google',
        'provider_id' => 'google-sub-123',
    ]))->toThrow(UniqueConstraintViolationException::class);
});

test('a user cannot have more than one identity for the same provider', function () {
    $user = User::factory()->create();

    UserIdentity::factory()->create([
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_id' => 'google-sub-123',
    ]);

    expect(fn () => UserIdentity::factory()->create([
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_id' => 'google-sub-456',
    ]))->toThrow(UniqueConstraintViolationException::class);
});

test('a provider subject can be reused by a different provider', function () {
    UserIdentity::factory()->create([
        'provider' => 'google',
        'provider_id' => 'provider-sub-123',
    ]);

    $identity = UserIdentity::factory()->create([
        'provider' => 'github',
        'provider_id' => 'provider-sub-123',
    ]);

    $this->assertModelExists($identity);
});
