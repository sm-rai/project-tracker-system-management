<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

test('guests cannot access the profile page', function () {
    $this->get('/profile')->assertRedirect('/login');
});

test('authenticated users see only their registered identity', function () {
    $user = User::factory()->create([
        'name' => 'Erwin User',
        'email' => 'erwin@example.com',
    ]);

    $this->actingAs($user)->get('/profile')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('profile', false)
            ->has('user', 2)
            ->where('user.name', 'Erwin User')
            ->where('user.email', 'erwin@example.com')
            ->missing('user.role')
            ->missing('user.password')
            ->missing('user.remember_token')
        );
});

test('inertia responses share session status while preserving auth and flash props', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession([
            'status' => 'Password has been reset.',
            'success' => 'Saved.',
            'error' => 'No error.',
        ])
        ->get('/profile')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('profile', false)
            ->where('status', 'Password has been reset.')
            ->where('auth.user.id', $user->id)
            ->where('flash.success', 'Saved.')
            ->where('flash.error', 'No error.')
        );
});

test('users can update their password with the current password', function () {
    $user = User::factory()->create(['password' => 'password']);

    $this->actingAs($user)->put('/user/password', [
        'current_password' => 'password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertRedirect();

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

test('an incorrect current password is rejected', function () {
    $user = User::factory()->create(['password' => 'password']);

    $this->actingAs($user)->put('/user/password', [
        'current_password' => 'wrong-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertSessionHasErrorsIn('updatePassword', 'current_password');

    expect(Hash::check('password', $user->refresh()->password))->toBeTrue();
});

test('users can reset their password with a raw broker token', function () {
    $user = User::factory()->create(['password' => 'password']);
    $token = Password::broker('users')->createToken($user);

    $this->post('/reset-password', [
        'token' => $token,
        'email' => $user->email,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])
        ->assertRedirect('/login')
        ->assertSessionHas('status');

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

test('an invalid password reset token is rejected', function () {
    $user = User::factory()->create(['password' => 'password']);

    $this->from('/reset-password/invalid-token')
        ->post('/reset-password', [
            'token' => 'invalid-token',
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertRedirect('/reset-password/invalid-token')
        ->assertSessionHasErrors('email');

    expect(Hash::check('password', $user->refresh()->password))->toBeTrue();
});
