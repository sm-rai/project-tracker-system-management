<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Symfony\Component\Mime\Email;

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

    Notification::assertSentTo($user, ResetPasswordNotification::class);
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

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

test('password reset notification is localized and includes the RAI logo', function () {
    $user = User::factory()->create(['name' => 'Erwin']);
    $notification = new ResetPasswordNotification('reset-token');
    $message = $notification->toMail($user);
    $html = (string) $message->render();

    expect($message->subject)->toBe('Atur Ulang Password Akun Anda')
        ->and($html)->toContain('Halo, Erwin!')
        ->and($html)->toContain('Kami menerima permintaan untuk mengatur ulang password akun Anda.')
        ->and($html)->toContain('Atur Ulang Password')
        ->and($html)->toContain('Tim IT')
        ->and($html)->not->toContain('Tim Project Tracker')
        ->and($html)->toContain('cid:logo-rai@project-tracker')
        ->and($html)->not->toContain('Reset your password')
        ->and($html)->not->toContain('Reset Password')
        ->and($html)->not->toContain('notification-logo-v2.1.png');

    $email = new Email;

    foreach ($message->callbacks as $callback) {
        $callback($email);
    }

    expect(file_exists(public_path('images/Logo RAI Full.png')))->toBeTrue()
        ->and($email->getAttachments())->toHaveCount(1)
        ->and($email->getAttachments()[0]->getContentId())->toBe('logo-rai@project-tracker')
        ->and($email->getAttachments()[0]->getFilename())->toBe('Logo RAI Full.png');
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
