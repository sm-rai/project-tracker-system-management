# Authentication Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only user profile, self-service password changes, SMTP-backed password recovery, and existing-user-only Google OAuth login.

**Architecture:** Fortify owns password update/reset endpoints. Socialite owns the stateful Google OAuth handshake. A separate `user_identities` table stores Google's stable `sub`, while the local `users` row remains the authorization source of truth. Inertia React pages reuse existing shadcn/ui components and Wayfinder-generated helpers.

**Tech Stack:** PHP 8.3, Laravel 13.22, Fortify 1.37, Socialite 5.x, Inertia Laravel 3.1, Inertia React 3.6, React 19.2, Wayfinder 0.1, Pest 4.7, MySQL, Tailwind CSS 4.

## Global Constraints

- Google callback may authenticate only an active user already created by an administrator; it may never create a user.
- First Google login requires a verified Google email matching an active local user by lowercase email.
- Persist `provider = google` and Google's stable `provider_id = sub`; never persist provider access/refresh tokens.
- Profile name/email are read-only; only password fields are editable by the user.
- Password rules remain minimum 8 characters, matching the current administrator user form.
- Use Fortify's `/user/password`, `/forgot-password`, and `/reset-password/{token}` contracts.
- Reuse existing shadcn/ui primitives and existing app/guest shells.
- Regenerate Wayfinder with `php artisan wayfinder:generate --no-interaction --with-form`; never hand-edit generated files.
- Keep real Google/SMTP credentials out of source control. Update `.env.example` with empty/documented keys only.
- Run `vendor/bin/pint --dirty --format agent` after PHP changes.
- Final verification includes focused Pest, changed-file ESLint, `npm run types:check`, `npm run build`, and `git diff --check`.

## File Map

- Dependency/config: `composer.json`, `composer.lock`, `.env.example`, `config/services.php`, `config/fortify.php`.
- Auth backend: `app/Providers/FortifyServiceProvider.php`, `app/Http/Middleware/HandleInertiaRequests.php`, `app/Http/Controllers/ProfileController.php`, `app/Http/Controllers/GoogleAuthenticationController.php`, `routes/web.php`.
- Identity persistence: `app/Models/UserIdentity.php`, `app/Models/User.php`, `database/migrations/*_create_user_identities_table.php`, `database/factories/UserIdentityFactory.php`.
- Fortify actions: `app/Actions/Fortify/PasswordValidationRules.php`, `UpdateUserPassword.php`, `ResetUserPassword.php`.
- Tests: `tests/Feature/ProfileTest.php`, `PasswordResetTest.php`, `GoogleAuthenticationTest.php`.
- Frontend: `resources/js/components/auth/auth-page-layout.tsx`, `components/login-form.tsx`, `components/nav-user.tsx`, `pages/login.tsx`, `pages/auth/forgot-password.tsx`, `pages/auth/reset-password.tsx`, `pages/profile.tsx`, `types/auth.ts`.
- Generated: `resources/js/routes/*` and `resources/js/actions/*`.

---

### Task 1: Add Socialite, Environment Contracts, and Identity Persistence

**Files:** Create `UserIdentity.php`, `UserIdentityFactory.php`, and the identity migration; modify `User.php`, `composer.json`, `composer.lock`, `config/services.php`, `.env.example`; test `tests/Feature/GoogleAuthenticationTest.php`.

**Produces:** `User::identities()`, `UserIdentity::user()`, unique provider linkage, and `config('services.google.*')`.

- [ ] **Step 1: Write the failing persistence test**

~~~php
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
~~~

- [ ] **Step 2: Run it and verify it fails**

~~~powershell
php artisan test --compact tests/Feature/GoogleAuthenticationTest.php --filter="a user can have one identity per provider"
~~~

Expected: FAIL because the model/table do not exist.

- [ ] **Step 3: Install the approved Socialite dependency and scaffold files**

~~~powershell
composer require laravel/socialite --no-interaction
php artisan make:model UserIdentity --migration --factory --no-interaction
~~~

- [ ] **Step 4: Implement the identity model/factory/migration**

Use the following model and factory:

~~~php
<?php

namespace App\Models;

use Database\Factories\UserIdentityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'provider', 'provider_id', 'provider_email'])]
class UserIdentity extends Model
{
    /** @use HasFactory<UserIdentityFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
~~~

~~~php
<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserIdentity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserIdentity>
 */
class UserIdentityFactory extends Factory
{
    protected $model = UserIdentity::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'provider' => 'google',
            'provider_id' => fake()->unique()->numerify('google-sub-########'),
            'provider_email' => fake()->unique()->safeEmail(),
        ];
    }
}
~~~

Use this migration body:

~~~php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_identities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 50);
            $table->string('provider_id');
            $table->string('provider_email');
            $table->timestamps();
            $table->unique(['provider', 'provider_id']);
            $table->unique(['user_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_identities');
    }
};
~~~

Add `public function identities(): HasMany` to `User.php`, returning `$this->hasMany(UserIdentity::class)`.

- [ ] **Step 5: Add configuration and documented environment keys**

Add to `config/services.php`:

~~~php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
~~~

Add to `.env.example`:

~~~dotenv
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Local default is log. Uncomment/configure these for SMTP delivery.
# MAIL_MAILER=smtp
# MAIL_SCHEME=smtp
# MAIL_HOST=smtp.gmail.com
# MAIL_PORT=587
# MAIL_USERNAME=
# MAIL_PASSWORD=
# MAIL_EHLO_DOMAIN=localhost
# MAIL_FROM_ADDRESS=
# MAIL_FROM_NAME=Project Tracker
~~~

The actual `.env` values will be supplied later; no secret belongs in the repository. The Google Cloud authorized redirect URI must exactly equal `GOOGLE_REDIRECT_URI`.

- [ ] **Step 6: Run migration/test and commit**

~~~powershell
php artisan migrate --no-interaction
php artisan test --compact tests/Feature/GoogleAuthenticationTest.php --filter="a user can have one identity per provider"
vendor/bin/pint --dirty --format agent
git add composer.json composer.lock .env.example config/services.php app/Models/User.php app/Models/UserIdentity.php database/factories/UserIdentityFactory.php database/migrations tests/Feature/GoogleAuthenticationTest.php
git commit -m "feat: add external user identity foundation"
~~~

Expected: migration/test/Pint pass.

---

### Task 2: Enable Fortify and Add Profile/Password Backend

**Files:** Create `app/Actions/Fortify/PasswordValidationRules.php`, `UpdateUserPassword.php`, `ResetUserPassword.php`, `app/Http/Controllers/ProfileController.php`, and `tests/Feature/ProfileTest.php`; modify `config/fortify.php`, `app/Providers/FortifyServiceProvider.php`, `routes/web.php`, and `HandleInertiaRequests.php`.

**Produces:** `profile.show`, Fortify password routes, and application-owned password actions.

- [ ] **Step 1: Write failing profile/password tests**

~~~php
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
            ->component('profile')
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
    ])->assertSessionHasErrors('current_password');

    expect(Hash::check('password', $user->refresh()->password))->toBeTrue();
});
~~~

- [ ] **Step 2: Run it and verify missing routes/actions**

~~~powershell
php artisan test --compact tests/Feature/ProfileTest.php
~~~

Expected: FAIL.

- [ ] **Step 3: Add Fortify action classes**

Create these three files.

~~~php
<?php

namespace App\Actions\Fortify;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::default(), 'confirmed'];
    }
}
~~~

~~~php
<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\UpdatesUserPasswords;

class UpdateUserPassword implements UpdatesUserPasswords
{
    use PasswordValidationRules;

    /**
     * @param array<string, string> $input
     *
     * @throws ValidationException
     */
    public function update(User $user, array $input): void
    {
        Validator::make($input, [
            'current_password' => ['required', 'string', 'current_password:web'],
            'password' => $this->passwordRules(),
        ])->validateWithBag('updatePassword');

        $user->forceFill(['password' => Hash::make($input['password'])])->save();
    }
}
~~~

~~~php
<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    /**
     * @param array<string, string> $input
     *
     * @throws ValidationException
     */
    public function reset(User $user, array $input): void
    {
        Validator::make($input, [
            'password' => $this->passwordRules(),
        ])->validate();

        $user->forceFill(['password' => Hash::make($input['password'])])->save();
    }
}
~~~


- [ ] **Step 4: Enable features and bind actions/views**

Set `config/fortify.php` features to:

~~~php
'features' => [
    Features::resetPasswords(),
    Features::updatePasswords(),
],
~~~

In `FortifyServiceProvider::boot()`, add:

~~~php
Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
Fortify::requestPasswordResetLinkView(
    fn () => Inertia::render('auth/forgot-password')
);
Fortify::resetPasswordView(
    fn (Request $request) => Inertia::render('auth/reset-password', [
        'email' => (string) $request->query('email', ''),
        'token' => (string) $request->route('token'),
    ])
);
~~~

Keep the existing login view and limiter.

- [ ] **Step 5: Add the profile controller/route/status prop**

Create `ProfileController::show(Request $request): Response` with an explicit user guard:

~~~php
$user = $request->user();
abort_unless($user instanceof User, 401);

return Inertia::render('profile', [
    'user' => [
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role->value,
    ],
]);
~~~

Add `GET /profile` named `profile.show` inside the existing `auth` group`.

Add this to shared Inertia props:

~~~php
'status' => fn () => $request->session()->get('status'),
~~~

Do not alter existing auth/flash behavior.

- [ ] **Step 6: Run focused backend checks and commit**

~~~powershell
php artisan test --compact tests/Feature/ProfileTest.php
vendor/bin/pint --dirty --format agent
git add app/Actions/Fortify app/Http/Controllers/ProfileController.php app/Providers/FortifyServiceProvider.php app/Http/Middleware/HandleInertiaRequests.php config/fortify.php routes/web.php tests/Feature/ProfileTest.php
git commit -m "feat: add profile and password workflows"
~~~

---

### Task 3: Build Forgot/Reset Password UI

**Files:** Create `resources/js/components/auth/auth-page-layout.tsx`, `resources/js/pages/auth/forgot-password.tsx`, `resources/js/pages/auth/reset-password.tsx`, and `tests/Feature/PasswordResetTest.php`; modify `resources/js/pages/login.tsx` and `resources/js/components/login-form.tsx`.

**Produces:** dedicated guest forgot/reset pages and login recovery entry point.

- [ ] **Step 1: Write failing page/notification tests**

Cover:

~~~php
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
            ->where('token', 'test-token'));
});
~~~

Also fake the `Illuminate\Auth\Notifications\ResetPassword` notification, post an existing email to `/forgot-password`, and assert the notification. For a valid reset, create the raw token through the broker instead of reading the hashed database value:

~~~php
$token = Password::broker('users')->createToken($user);

$this->post('/reset-password', [
    'token' => $token,
    'email' => $user->email,
    'password' => 'new-password',
    'password_confirmation' => 'new-password',
])->assertRedirect('/login');
~~~

Import `Illuminate\Support\Facades\Password`; Laravel stores a hash, so the raw token must come from `createToken()`.

- [ ] **Step 2: Run tests and verify they fail**

~~~powershell
php artisan test --compact tests/Feature/PasswordResetTest.php
~~~

Expected: FAIL before callbacks/pages exist.

- [ ] **Step 3: Create the guest layout and pages**

`auth-page-layout.tsx` accepts `children: React.ReactNode` and reuses the existing login logo/header, `bg-background-soft`, `min-h-svh`, and `max-w-sm`.

The forgot page uses existing shadcn `Card`, `Field`, `FieldLabel`, `FieldError`, `Input`, and `Button`, with a field named `email` and the generated Fortify `password.email` form helper. It displays the shared `status` as neutral Indonesian feedback and links back to `login.url()`.

The reset page receives typed `{ email: string; token: string }` props and posts exactly `token`, `email`, `password`, and `password_confirmation` using the generated reset helper. Use `autoComplete="new-password"` and field-level errors.

- [ ] **Step 4: Add login links and generate Wayfinder helpers**

Add `Lupa Password?` near the password field and reserve the secondary Google action for Task 4. Replace the duplicated login outer markup with `AuthPageLayout`. Display shared `status` after a successful reset without styling it as an error.

Run:

~~~powershell
php artisan wayfinder:generate --no-interaction --with-form
rg -n "password\.request|password\.email|password\.reset|user-password\.update" resources/js/routes resources/js/actions
~~~

Use generated exports and do not hand-edit generated files.

- [ ] **Step 5: Verify and commit**

~~~powershell
php artisan test --compact tests/Feature/PasswordResetTest.php
npx eslint resources/js/components/auth/auth-page-layout.tsx resources/js/pages/auth/forgot-password.tsx resources/js/pages/auth/reset-password.tsx resources/js/pages/login.tsx resources/js/components/login-form.tsx
npm run types:check
git add resources/js/components/auth resources/js/pages/auth resources/js/pages/login.tsx resources/js/components/login-form.tsx resources/js/routes resources/js/actions tests/Feature/PasswordResetTest.php
git commit -m "feat: add password recovery pages"
~~~

---

### Task 4: Implement Existing-User Google OAuth

**Files:** Create `app/Http/Controllers/GoogleAuthenticationController.php`; modify `routes/web.php`, `resources/js/components/login-form.tsx`, and `tests/Feature/GoogleAuthenticationTest.php`.

**Produces:** `auth.google.redirect` and `auth.google.callback`.

- [ ] **Step 1: Write mocked Socialite tests**

Mock `Laravel\Socialite\Facades\Socialite` and cover:

- Redirect returns the mocked provider redirect.
- Verified matching email links an active user and authenticates them.
- Existing `provider_id` authenticates the linked user even if the email changes.
- Unknown email returns to login, creates no user, and leaves the request unauthenticated.
- Unverified Google email returns to login and creates no identity.
- A local user already linked to another Google identity cannot receive a second identity.

The mock Google user exposes only `getId()`, `getEmail()`, and `getRaw()` with `email_verified`; never call Google from Pest.

- [ ] **Step 2: Run tests and verify OAuth is missing**

~~~powershell
php artisan test --compact tests/Feature/GoogleAuthenticationTest.php
~~~

Expected: Task 1 persistence test passes, OAuth tests fail.

- [ ] **Step 3: Implement the controller**

Create `app/Http/Controllers/GoogleAuthenticationController.php`:

~~~php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserIdentity;
use Illuminate\Database\Eloquent\Builder;
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
                ->with(['user' => fn (Builder $query): Builder => $query->withTrashed()])
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
~~~

The callback must use Socialite's stateful session flow and must not call `stateless()`.

- [ ] **Step 4: Add guest routes and login action**

Add before the authenticated group:

~~~php
Route::middleware('guest')->group(function (): void {
    Route::get('/auth/google/redirect', [GoogleAuthenticationController::class, 'redirect'])
        ->name('auth.google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthenticationController::class, 'callback'])
        ->name('auth.google.callback');
});
~~~

Add `Masuk dengan Google` as a normal browser link to the generated `auth.google.redirect` helper. Keep email/password login unchanged.

- [ ] **Step 5: Generate, test, format, and commit**

~~~powershell
php artisan wayfinder:generate --no-interaction --with-form
php artisan test --compact tests/Feature/GoogleAuthenticationTest.php
vendor/bin/pint --dirty --format agent
git add app/Http/Controllers/GoogleAuthenticationController.php routes/web.php resources/js/components/login-form.tsx resources/js/routes resources/js/actions tests/Feature/GoogleAuthenticationTest.php
git commit -m "feat: add existing-user google authentication"
~~~

---

### Task 5: Build Profile UI and User Menu Entry

**Files:** Create `resources/js/pages/profile.tsx`; modify `resources/js/components/nav-user.tsx`, `resources/js/types/auth.ts`, and `tests/Feature/ProfileTest.php` only for prop regressions.

- [ ] **Step 1: Implement the profile page**

Use the existing authenticated composition:

~~~tsx
<SidebarProvider>
    <AppSidebar />
    <SidebarInset>
        <SiteHeader title="Profil Saya" />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            {/* Identity Card: read-only name and email */}
            {/* Security Card: current/new/confirmation password */}
        </main>
    </SidebarInset>
</SidebarProvider>
~~~

Use existing `Card`, `Field`, `FieldGroup`, `FieldLabel`, `FieldError`, `Input`, and `Button`. Submit the generated `user-password.update.form()` with `current_password`, `password`, and `password_confirmation`. Do not render password values or editable identity fields.

- [ ] **Step 2: Add `Profil Saya` to `NavUser`**

Add an Inertia `Link` before the separator/logout item:

~~~tsx
<DropdownMenuItem asChild className="cursor-pointer rounded-md px-2 py-2">
    <Link href={profile.show.url()}>
        <IconUser className="mr-2 size-4" />
        Profil Saya
    </Link>
</DropdownMenuItem>
~~~

Keep logout unchanged.

- [ ] **Step 3: Keep frontend auth types explicit**

Update `resources/js/types/auth.ts` using existing types where possible. The profile contract must be equivalent to:

~~~ts
export interface ProfileUser {
    name: string;
    email: string;
    role: string;
}
~~~

No password/token field is allowed.

- [ ] **Step 4: Verify and commit**

~~~powershell
php artisan test --compact tests/Feature/ProfileTest.php
npx eslint resources/js/pages/profile.tsx resources/js/components/nav-user.tsx resources/js/types/auth.ts
npm run types:check
git add resources/js/pages/profile.tsx resources/js/components/nav-user.tsx resources/js/types/auth.ts tests/Feature/ProfileTest.php
git commit -m "feat: add profile and password settings UI"
~~~

---

### Task 6: Final Verification and Environment Handoff

- [ ] **Step 1: Inspect route/middleware contracts**

~~~powershell
php artisan route:list --except-vendor --path=profile
php artisan route:list --except-vendor --path=auth/google
php artisan route:list --only-vendor --name=password
~~~

Expected: profile is authenticated; Google redirect/callback are guest; Fortify forgot/reset/update routes exist.

- [ ] **Step 2: Run the focused auth suite sequentially**

~~~powershell
php artisan test --compact tests/Feature/LoginTest.php tests/Feature/ProfileTest.php tests/Feature/PasswordResetTest.php tests/Feature/GoogleAuthenticationTest.php
~~~

Expected: existing login/logout and all new auth tests pass together.

- [ ] **Step 3: Run quality gates**

~~~powershell
vendor/bin/pint --dirty --format agent
npx eslint resources/js/components/auth/auth-page-layout.tsx resources/js/pages/auth/forgot-password.tsx resources/js/pages/auth/reset-password.tsx resources/js/pages/login.tsx resources/js/components/login-form.tsx resources/js/pages/profile.tsx resources/js/components/nav-user.tsx resources/js/types/auth.ts
npm run types:check
npm run build
git diff --check
~~~

- [ ] **Step 4: Verify final scope**

~~~powershell
git diff --name-only HEAD~5..HEAD
git status --short --branch
~~~

Confirm no real `.env` secret was staged and no generated Wayfinder file was manually edited.

- [ ] **Step 5: Provide the environment handoff**

For local Google OAuth with `APP_URL=http://localhost:8000`:

~~~dotenv
GOOGLE_CLIENT_ID="<Google OAuth client ID>"
GOOGLE_CLIENT_SECRET="<Google OAuth client secret>"
GOOGLE_REDIRECT_URI="http://localhost:8000/auth/google/callback"
~~~

For SMTP:

~~~dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME="smtp-account@example.com"
MAIL_PASSWORD="smtp-password-or-app-password"
MAIL_EHLO_DOMAIN="example.com"
MAIL_FROM_ADDRESS="noreply@example.com"
MAIL_FROM_NAME="Project Tracker"
~~~

For local log-only mail:

~~~dotenv
MAIL_MAILER=log
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="Project Tracker"
~~~

Explain that Gmail uses `smtp.gmail.com`, port `587`, and an App Password when 2-Step Verification is enabled; never use the regular account password. Also explain that browser host and `APP_URL` must match exactly to preserve Socialite session state.

- [ ] **Step 6: Manual smoke test with real environment values**

1. Open `/login` with the exact `APP_URL` host.
2. Request a reset for an existing user and confirm SMTP/log delivery.
3. Complete reset and sign in with the new password.
4. Use `Masuk dengan Google` for the matching existing user and confirm `/dashboard`.
5. Open `Profil Saya` as different users and verify identity isolation.
6. Use an unknown Google account and verify no `users` row is created.

- [ ] **Step 7: Final handoff**

Report implementation commits, exact environment keys, Google Cloud redirect URI, mail inspection method, and all focused verification results.







