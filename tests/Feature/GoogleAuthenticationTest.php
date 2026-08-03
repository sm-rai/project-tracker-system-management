<?php

use App\Models\User;
use App\Models\UserIdentity;

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
