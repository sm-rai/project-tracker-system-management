<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;
use Symfony\Component\HttpFoundation\Response;

final class PasswordResetLinkResponse implements FailedPasswordResetLinkRequestResponse, SuccessfulPasswordResetLinkRequestResponse
{
    public const NEUTRAL_STATUS = 'Jika email terdaftar, tautan untuk mengatur ulang password akan dikirim ke inbox Anda.';

    public function __construct(private readonly string $status) {}

    /**
     * Create a neutral response for both known and unknown email addresses.
     *
     * @param  Request  $request
     */
    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return new JsonResponse(['message' => self::NEUTRAL_STATUS]);
        }

        return back()->with('status', self::NEUTRAL_STATUS);
    }
}
