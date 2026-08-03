<?php

use App\Models\User;
use App\Models\UserIdentity;
use Illuminate\Database\UniqueConstraintViolationException;
use Laravel\Socialite\Facades\Socialite;

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

test('guests can start Google authentication', function () {
    $provider = Mockery::mock();
    $provider->shouldReceive('scopes')
        ->once()
        ->with(['openid', 'profile', 'email'])
        ->andReturnSelf();
    $provider->shouldReceive('redirect')
        ->once()
        ->andReturn(redirect()->away('https://accounts.google.test/oauth'));

    Socialite::shouldReceive('driver')
        ->once()
        ->with('google')
        ->andReturn($provider);

    $this->get(route('auth.google.redirect'))
        ->assertRedirect('https://accounts.google.test/oauth');
});

test('verified Google users with a matching email are linked and authenticated', function () {
    $user = User::factory()->create(['email' => 'user@example.com']);
    $googleUser = Mockery::mock();
    $googleUser->shouldReceive('getId')->andReturn('google-sub-123');
    $googleUser->shouldReceive('getEmail')->andReturn('USER@example.com');
    $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    mockGoogleUser($googleUser);

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
    $this->assertDatabaseHas('user_identities', [
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_id' => 'google-sub-123',
        'provider_email' => 'user@example.com',
    ]);
});

test('an existing Google identity authenticates its linked user when the email changes', function () {
    $user = User::factory()->create(['email' => 'registered@example.com']);
    $user->identities()->create([
        'provider' => 'google',
        'provider_id' => 'google-sub-stable',
        'provider_email' => 'old-google@example.com',
    ]);

    $googleUser = Mockery::mock();
    $googleUser->shouldReceive('getId')->andReturn('google-sub-stable');
    $googleUser->shouldReceive('getEmail')->andReturn('new-google@example.com');
    $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    mockGoogleUser($googleUser);

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
    expect($user->identities()->first()->provider_email)->toBe('new-google@example.com');
    expect($user->fresh()->email)->toBe('registered@example.com');
});

test('unknown Google emails cannot authenticate or create users', function () {
    $googleUser = Mockery::mock();
    $googleUser->shouldReceive('getId')->andReturn('google-sub-unknown');
    $googleUser->shouldReceive('getEmail')->andReturn('unknown@example.com');
    $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    mockGoogleUser($googleUser);

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('login'))
        ->assertSessionHas('error');

    $this->assertGuest();
    expect(User::query()->count())->toBe(0)
        ->and(UserIdentity::query()->count())->toBe(0);
});

test('unverified Google emails cannot authenticate or create identities', function () {
    $user = User::factory()->create(['email' => 'unverified@example.com']);
    $googleUser = Mockery::mock();
    $googleUser->shouldReceive('getId')->andReturn('google-sub-unverified');
    $googleUser->shouldReceive('getEmail')->andReturn($user->email);
    $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => false]);

    mockGoogleUser($googleUser);

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
    expect($user->identities()->count())->toBe(0);
});

test('a user linked to Google cannot receive a second Google identity', function () {
    $user = User::factory()->create(['email' => 'linked@example.com']);
    $user->identities()->create([
        'provider' => 'google',
        'provider_id' => 'google-sub-existing',
        'provider_email' => $user->email,
    ]);

    $googleUser = Mockery::mock();
    $googleUser->shouldReceive('getId')->andReturn('google-sub-second');
    $googleUser->shouldReceive('getEmail')->andReturn($user->email);
    $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

    mockGoogleUser($googleUser);

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
    expect($user->identities()->count())->toBe(1);
});

function mockGoogleUser(object $googleUser): void
{
    $provider = Mockery::mock();
    $provider->shouldReceive('user')->once()->andReturn($googleUser);

    Socialite::shouldReceive('driver')
        ->once()
        ->with('google')
        ->andReturn($provider);
}
