# Task 3 Report: Forgot/Reset Password UI

## Scope delivered

- Added guest forgot-password and reset-password pages using the incumbent login visual system.
- Extracted the shared guest auth shell and reused it for login.
- Added the `Lupa Password?` recovery entry point and neutral reset-success feedback on login.
- Used generated Wayfinder Fortify helpers for forgot-password and reset-password form submissions.
- Did not add profile UI, Google OAuth, or unrelated authentication work.

## Files changed

- `resources/js/components/auth/auth-page-layout.tsx`
- `resources/js/components/login-form.tsx`
- `resources/js/pages/auth/forgot-password.tsx`
- `resources/js/pages/auth/reset-password.tsx`
- `resources/js/pages/login.tsx`
- `tests/Feature/PasswordResetTest.php`

Wayfinder was regenerated with `php artisan wayfinder:generate --no-interaction --with-form`. Its `resources/js/routes` and `resources/js/actions` outputs are gitignored in this repository, so no generated file changes are staged.

## TDD and verification evidence

### Red

`php artisan test --compact tests/Feature/PasswordResetTest.php` initially produced 3 expected failures:

- `auth/forgot-password` Inertia component file did not exist.
- `auth/reset-password` Inertia component file did not exist.
- The notification assertion already passed because Task 2 had completed the Fortify callback/action foundation.

### Green

- `php artisan test --compact tests/Feature/PasswordResetTest.php` — passed: 4 tests, 24 assertions.
- `npx eslint` against all five changed TSX files — passed.
- `vendor/bin/pint --dirty --format agent` — passed.
- `npm run types:check` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.
- Targeted Prettier write completed for the changed TSX files.

`npm run lint:check` was also run. It remains failing only on existing, out-of-scope files: `chart-area-interactive.tsx`, `confirm-dialog.tsx`, `data-table.tsx`, `nav-documents.tsx`, `nav-main.tsx`, and `nav-secondary.tsx` (12 errors and 1 warning). The changed Task 3 files pass their targeted ESLint check.

## Visual and accessibility considerations

- Preserved the existing logo/header, `bg-background-soft`, `min-h-svh`, `max-w-sm`, Card, Field, Input, and Button vocabulary.
- Uses the documented warm neutral status surface rather than error styling for successful recovery feedback.
- Inputs have explicit labels, autocomplete semantics, `aria-invalid`, and field-level `FieldError` messages.
- Status feedback uses `role="status"` and `aria-live="polite"`; shadcn `FieldError` supplies `role="alert"` for validation failures.
- Keyboard-accessible Inertia links provide both recovery entry and a return path to login. The narrow one-column auth layout remains usable at mobile widths.

## Self-review

- Forgot form submits only `email` via `password.email.form()`.
- Reset form submits exactly `token`, `email`, `password`, and `password_confirmation` via `password.update.form()`.
- Reset fields use `autoComplete="new-password"`; email and token from the reset link remain available to the form.
- Login now uses `AuthPageLayout`, shows reset success feedback, and keeps the secondary Google action unimplemented for Task 4.
- The raw broker-token regression test avoids the hashed `password_reset_tokens` value and confirms the updated password hash.

## Concerns

- Repository-wide ESLint is not clean because of the pre-existing out-of-scope findings listed above.
- Vite emits its existing advisory warning that optional `fontaine` is not installed; the production build nevertheless exits successfully.

## Inline security hardening after review

- Added `PasswordResetLinkResponse` and bound it to both Fortify success and failure reset-link response contracts.
- Known and unknown valid email addresses now receive the same neutral status without an email validation error, preventing account enumeration.
- Added a regression test that posts both paths, asserts matching status/no errors, and confirms no notification is sent for an unknown address.
- Verification after hardening: `php artisan test --compact` passed 124 tests/694 assertions; `vendor/bin/pint --dirty --format agent`, targeted ESLint, `npm run types:check`, `npm run build`, and `git diff --check` passed.
