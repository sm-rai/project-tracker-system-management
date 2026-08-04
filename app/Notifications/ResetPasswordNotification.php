<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPasswordNotification;
use Illuminate\Notifications\Messages\MailMessage;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\Part\DataPart;

class ResetPasswordNotification extends BaseResetPasswordNotification
{
    private const LOGO_CONTENT_ID = 'logo-rai@project-tracker';

    public function __construct(#[\SensitiveParameter] string $token)
    {
        parent::__construct($token);
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $userName = (string) data_get($notifiable, 'name', 'Pengguna');

        if ($userName === '') {
            $userName = 'Pengguna';
        }

        return (new MailMessage)
            ->subject('Atur Ulang Password Akun Anda')
            ->markdown('notifications.reset-password', [
                'url' => $this->resetUrl($notifiable),
                'userName' => $userName,
                'expiration' => config('auth.passwords.users.expire', 60),
                'logoContentId' => self::LOGO_CONTENT_ID,
            ])
            ->withSymfonyMessage(function (Email $message): void {
                $logoPath = public_path('images/Logo RAI Full.png');

                if (! is_file($logoPath)) {
                    return;
                }

                $message->addPart(
                    DataPart::fromPath($logoPath, 'Logo RAI Full.png')
                        ->asInline()
                        ->setContentId(self::LOGO_CONTENT_ID),
                );
            });
    }
}
