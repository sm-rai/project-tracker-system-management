<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

test('guests can render forgot password', function () {
    $this->get('/forgot-password')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('auth/forgot-password'));
});

test('guests can render reset password with token and email', function () {
    $this->get('/reset-password/test-token?email=user@example.com')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/reset-password')
            ->where('email', 'user@example.com')
            ->where('token', 'test-token')
        );
});

test('guests can request a password reset link for an existing email', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class);
});

test('forgot password does not reveal whether the email is registered', function () {
    Notification::fake();

    $user = User::factory()->create();

    $unknownResponse = $this->from('/forgot-password')->post('/forgot-password', [
        'email' => 'not-registered@example.com',
    ]);

    $unknownResponse
        ->assertRedirect('/forgot-password')
        ->assertSessionHas('status')
        ->assertSessionMissing('errors');

    Notification::assertNothingSent();

    $knownResponse = $this->from('/forgot-password')->post('/forgot-password', [
        'email' => $user->email,
    ]);

    $knownResponse
        ->assertRedirect('/forgot-password')
        ->assertSessionHas('status', $unknownResponse->getSession()->get('status'))
        ->assertSessionMissing('errors');

    Notification::assertSentTo($user, ResetPassword::class);
});

test('guests can reset their password with a raw broker token', function () {
    $user = User::factory()->create(['password' => 'password']);
    $token = Password::broker('users')->createToken($user);

    $this->post('/reset-password', [
        'token' => $token,
        'email' => $user->email,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertRedirect('/login');

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});
