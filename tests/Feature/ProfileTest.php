<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

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
            ->where('user.name', 'Erwin User')
            ->where('user.email', 'erwin@example.com')
            ->missing('user.password')
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
