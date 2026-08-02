<?php

use App\Models\User;

test('guests are redirected to login from the root route', function () {
    $this->get(route('home'))
        ->assertRedirect(route('login'));
});

test('authenticated users are redirected to the dashboard from the root route', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('home'))
        ->assertRedirect(route('dashboard'));
});
