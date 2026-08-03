<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserIdentity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Throwable;

class GoogleAuthenticationController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            $email = Str::lower(trim((string) $googleUser->getEmail()));
            $providerId = trim((string) $googleUser->getId());
            $verified = (bool) data_get($googleUser->getRaw(), 'email_verified', false);

            if ($email === '' || $providerId === '' || ! $verified) {
                return $this->failure('Akun Google tidak dapat digunakan untuk masuk.');
            }

            $identity = UserIdentity::query()
                ->with(['user' => fn ($query) => $query->withTrashed()])
                ->where('provider', 'google')
                ->where('provider_id', $providerId)
                ->first();

            if ($identity) {
                if (! $identity->user || $identity->user->trashed()) {
                    return $this->failure('Akun Google tidak dapat digunakan untuk masuk.');
                }

                $identity->update(['provider_email' => $email]);

                return $this->authenticate($request, $identity->user);
            }

            $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

            if (! $user || $user->identities()->where('provider', 'google')->exists()) {
                return $this->failure('Akun Google belum terdaftar atau sudah memiliki koneksi lain.');
            }

            $user->identities()->create([
                'provider' => 'google',
                'provider_id' => $providerId,
                'provider_email' => $email,
            ]);

            return $this->authenticate($request, $user);
        } catch (InvalidStateException) {
            Log::warning('Google OAuth state validation failed.');

            return $this->failure('Sesi login Google sudah tidak valid. Silakan coba lagi.');
        } catch (Throwable $exception) {
            Log::warning('Google OAuth callback failed.', ['exception' => $exception::class]);

            return $this->failure('Login dengan Google gagal. Silakan coba lagi.');
        }
    }

    private function authenticate(Request $request, User $user): RedirectResponse
    {
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    private function failure(string $message): RedirectResponse
    {
        return redirect()->route('login')->with('error', $message);
    }
}
