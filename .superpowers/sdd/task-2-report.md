# Task 2 Report: Fortify Profile and Password Backend

## Scope completed

Implemented only Task 2 from `task-2-brief.md`:

- Enabled Fortify password-reset and authenticated password-update features.
- Added application-owned Fortify password validation, update, and reset actions.
- Registered the Fortify action bindings and Inertia view contracts without adding the forgot/reset UI.
- Added the authenticated `profile.show` backend route with a minimal, password-free identity prop.
- Shared Fortify's session `status` prop without changing the existing `auth` or `flash` props.

Forgot/reset page implementation, Google OAuth, the profile UI, navigation changes, and generated Wayfinder frontend consumers remain deferred to their later tasks.

## Files changed

Created:

- `app/Actions/Fortify/PasswordValidationRules.php`
- `app/Actions/Fortify/UpdateUserPassword.php`
- `app/Actions/Fortify/ResetUserPassword.php`
- `app/Http/Controllers/ProfileController.php`
- `tests/Feature/ProfileTest.php`

Modified:

- `app/Http/Middleware/HandleInertiaRequests.php`
- `app/Providers/FortifyServiceProvider.php`
- `config/fortify.php`
- `routes/web.php`

## Historical pre-fix TDD evidence

### Historical pre-fix RED

Before production changes, `php artisan test --compact tests/Feature/ProfileTest.php` failed as expected:

- 4 tests failed, 0 passed, 4 assertions.
- `GET /profile` and `PUT /user/password` returned 404 because the Task 2 routes/features/actions did not exist.

### Historical pre-fix GREEN

After the minimal Task 2 implementation and the test-harness correction described below:

- `php artisan test --compact tests/Feature/ProfileTest.php` passed: 4 tests, 20 assertions.
- Route verification confirmed `profile.show` plus Fortify's `password.request`, `password.email`, `password.reset`, `password.update`, and `user-password.update` routes.

The profile component assertion uses `component('profile', false)`. Inertia otherwise treats the assertion as a filesystem check for `resources/js/pages/profile.tsx`; that UI is explicitly Task 5. The test still verifies that the backend returns the required `profile` Inertia component and exposes only the permitted identity props.

The incorrect-current-password assertion reads the `updatePassword` error bag. This matches Task 2's required `validateWithBag('updatePassword')` action contract and Fortify's direct propagation of that validation exception.

## Verification results

| Check | Result |
| --- | --- |
| `vendor/bin/pint --dirty --format agent` | Historical pre-fix pass; formatted Task 2 PHP files. |
| `php artisan test --compact tests/Feature/ProfileTest.php` | Historical pre-fix pass: 4 tests, 20 assertions. Superseded by the final 7-test verification below. |
| `php artisan test --compact` | Historical pre-fix final rerun: 116 tests, 631 assertions. Superseded by the final 119-test verification below. |
| `php artisan route:list --except-vendor --path=profile` | Passed: authenticated `profile.show` route registered. |
| `php artisan route:list --only-vendor --name=password` | Passed: Fortify forgot/reset/update password routes registered. |
| `php -l` for every changed PHP file | Passed: no syntax errors. |
| `git diff --check` | Passed: no whitespace errors. |

## Self-review

- Password updates validate `current_password:web`, use `Password::default()` plus confirmation, and hash the replacement before persistence.
- Password-reset behavior is registered through the application `ResetUserPassword` action, not by modifying vendor code.
- `ProfileController` explicitly verifies the authenticated principal is an application `User` and returns only name and email; no role, password, remember token, or reset token is exposed.
- The profile route remains inside the existing `auth` middleware group.
- Existing login view, rate limiter, `auth` shared prop, and flash behavior remain intact.
- No forgot/reset frontend, Google OAuth, profile UI, navigation, or unrelated progress changes were included.

## Concerns

- The first full-suite run had one order/state-sensitive failure in the unrelated project-search test (expected one result, received two). The same test passed in isolation and the final full rerun passed 116/116; no Project code was changed.
- `.superpowers/sdd/progress.md` was already modified before Task 2 and is intentionally excluded from the commit.

## Review findings fix

### Changes

- Removed `user.role` from the profile Inertia prop. The profile identity contract is now exactly `name` and `email`; regression assertions also prove `role`, `password`, and `remember_token` are absent.
- Added a real Fortify reset-broker success test. It obtains the raw usable reset token only through `Password::broker('users')->createToken($user)`, submits it to `POST /reset-password`, and verifies the persisted password changed.
- Added invalid-token coverage for `POST /reset-password`; Fortify returns an `email` validation error and leaves the original password intact.
- Added Inertia shared-prop coverage proving session `status` reaches the page response while `auth.user`, `flash.success`, and `flash.error` remain present.

### TDD RED evidence

Command:

```powershell
php artisan test --compact tests/Feature/ProfileTest.php
```

Result: failed as expected with 7 tests, 6 passed, 42 assertions, 1 failure. The identity response exposed three `user` fields instead of the required two because it still contained `role`.

### TDD GREEN and final verification

Commands:

```powershell
php artisan test --compact tests/Feature/ProfileTest.php
vendor/bin/pint --dirty --format agent
php artisan test --compact tests/Feature/ProfileTest.php
php artisan test --compact
git diff --check
```

Results:

- First GREEN run: 7 tests passed, 49 assertions.
- Pint: passed.
- Post-format focused run: 7 tests passed, 49 assertions.
- Full suite: 119 tests passed, 660 assertions.
- `git diff --check`: passed with no output.

## Report-only cleanup

The 4-test/20-assertion focused result and 116-test/631-assertion suite result above are historical pre-fix evidence from the original Task 2 commit. The authoritative final verification after the review fixes is:

- `php artisan test --compact tests/Feature/ProfileTest.php`: 7 tests passed, 49 assertions.
- `php artisan test --compact`: 119 tests passed, 660 assertions.

Result: this cleanup changes only this report; no production code or test files changed.
