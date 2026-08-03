# Authentication Security: Profile, Password Recovery, and Google OAuth

## Status

Approved design for implementation planning.

## Context

Project Tracker currently uses Laravel Fortify for session-based email/password login. Public registration is disabled and users are created by an administrator. The existing `users` table supports soft deletion, and the current login page is an Inertia React page backed by Fortify.

The feature expands the existing authentication surface with:

- A profile page for every authenticated user.
- Self-service password changes.
- Email-based password recovery through SMTP.
- Google OAuth login for users already registered by an administrator.

## Goals

1. Let every active user view their registered identity and change their own password.
2. Let a guest request a password reset link from the login page.
3. Let a guest complete a password reset on a dedicated reset page.
4. Let an existing active user sign in with Google after their Google identity is linked on first successful matching login.
5. Preserve administrator-controlled account creation and roles.
6. Keep provider credentials and SMTP credentials environment-driven.

## Non-goals

- Public registration or automatic account creation from Google.
- Editing name or email from the profile page.
- Disconnecting or unlinking a Google identity.
- Additional OAuth providers.
- MFA, passkeys, or advanced session management.

## Recommended approach

Use Laravel Fortify for password workflows and Laravel Socialite for the Google OAuth handshake. Store provider linkage in a separate `user_identities` table instead of adding a provider-specific column to `users`.

This keeps the local account as the authorization source of truth while allowing the external identity to be identified by Google's stable `sub` value. The application does not store Google access or refresh tokens.

## Data model

Add a `user_identities` table with:

- `id`.
- `user_id` foreign key to `users`, cascading on user deletion.
- `provider`, initially `google`.
- `provider_id`, containing Google's stable `sub` value.
- `provider_email`, containing the verified email observed during linking for audit/debug context.
- timestamps.

Constraints:

- Unique `(provider, provider_id)` so one Google identity cannot belong to multiple users.
- Unique `(user_id, provider)` so one local user has at most one Google identity for a provider.

The `User` model exposes a `hasMany` relationship to identities. Soft-deleted users remain excluded by normal user queries and cannot authenticate through Google.

## Fortify configuration

Enable:

- `Features::updatePasswords()`.
- `Features::resetPasswords()`.

Keep registration, email verification, two-factor authentication, and passkeys disabled because they are outside this increment.

Register Inertia view callbacks in `FortifyServiceProvider` for:

- The forgot-password page.
- The reset-password page.

Use Fortify's existing password endpoints and password broker. The password change endpoint requires the current password, a new password, and confirmation. The password policy must remain consistent with the existing administrator user form: minimum 8 characters.

## Profile flow

Add an authenticated `GET /profile` route and expose it as `profile.show`.

Add `Profil Saya` to the existing user dropdown for every authenticated user. The page uses the existing application shell and shadcn/ui primitives.

The page contains:

1. An identity section showing the authenticated user's name and email as read-only values.
2. A security section with current password, new password, and password confirmation fields.

The password form submits to Fortify's user-password update endpoint. On success, it displays the existing global success feedback. Validation errors remain attached to their corresponding fields.

## Password recovery flow

Add the forgot-password link to the current login form. It navigates to Fortify's `/forgot-password` route.

The forgot-password page:

- Uses the guest authentication layout consistent with the login page.
- Accepts the registered email address.
- Submits to Fortify's password-reset-link endpoint.
- Shows the reset-link status or validation error through the Inertia form state.

The reset-password page is a separate guest page at Fortify's `/reset-password/{token}` route. It accepts the token, email, new password, and confirmation, then submits to Fortify's reset endpoint. A successful reset redirects to login with a success status.

The default Laravel password-reset notification is used initially. Mail delivery is environment-driven: local development may use the existing `log` mailer, while deployment will provide SMTP settings. No credentials are committed to the repository.

## Google OAuth flow

Add `laravel/socialite` as a Composer dependency and configure Google credentials under `config/services.php`:

- `GOOGLE_CLIENT_ID`.
- `GOOGLE_CLIENT_SECRET`.
- `GOOGLE_REDIRECT_URI`.

Add guest routes for Google redirect and callback, backed by a focused controller.

Redirect flow:

1. A guest visits the Google redirect route.
2. Socialite sends the user to Google with the `openid`, `profile`, and `email` scopes.
3. Google returns to the callback with the session-backed OAuth state.

Callback flow:

1. Retrieve the Google user through Socialite.
2. Require a non-empty email, a non-empty provider ID, and a verified Google email.
3. Look up an existing identity by `provider = google` and `provider_id`.
4. If the identity exists and belongs to an active user, authenticate that user.
5. If no identity exists, find an active local user by the normalized Google email.
6. If no local user matches, reject the attempt without creating an account.
7. If a local user matches, create the Google identity linkage and authenticate the user.
8. Regenerate the session before redirecting to `/dashboard`.

The callback must not use Socialite's stateless mode because this is a browser session flow protected by OAuth state. Invalid state, provider errors, missing identity data, unknown email, and identity conflicts return the user to login with a generic error message and no sensitive provider details.

## UI contract

Login page additions:

- `Lupa Password?` link near the password field.
- `Masuk dengan Google` secondary action.
- Existing email/password login remains unchanged.

Profile page copy and field labels are Indonesian and follow the current design tokens. Existing shadcn/ui `Card`, `Field`, `Input`, `Button`, and `FieldError` components should be reused before adding anything new.

Forgot-password and reset-password pages use the same logo/header language as the login page and provide a clear route back to login.

## Error and security behavior

- Only active administrator-created users may authenticate through Google.
- Google email matching is normalized to lowercase.
- Google email must be marked verified by the provider.
- A Google identity already linked to another user is rejected.
- Provider tokens are never persisted.
- Current password validation is required for self-service password changes.
- Password-reset token lifecycle is delegated to Laravel's password broker.
- SMTP and Google credentials are read from environment variables only.
- OAuth errors are logged using application logging without logging tokens or personal provider payloads.

## Testing strategy

Add focused Pest feature coverage for:

- Authenticated and guest access to `/profile`.
- Profile identity props and password-field non-disclosure.
- Successful password update.
- Rejected password update with an incorrect current password.
- Password confirmation and minimum-length validation.
- Forgot-password page rendering.
- Password-reset notification dispatch through the configured password broker.
- Successful reset with a valid token.
- Rejected reset with an invalid or expired token.
- Google redirect route.
- First Google callback linking an existing user and authenticating them.
- Subsequent callback login through an existing `provider_id` linkage.
- Unknown Google email rejection without user creation.
- Unverified Google email rejection.
- Identity conflict rejection.

Verification after implementation:

- `vendor/bin/pint --dirty --format agent`.
- Focused Pest auth test file(s).
- Targeted frontend lint for changed files.
- `npm run types:check`.
- `npm run build`.
- `git diff --check`.

## Acceptance criteria

- Every active user can open `Profil Saya`, view their registered name/email, and change their password.
- A guest can request a reset link from login and complete the reset on the dedicated reset page.
- The reset notification uses the configured mailer and is ready for SMTP credentials.
- A registered user with a verified matching Google account can log in.
- An unregistered Google account cannot create or access a local account.
- Repeated Google login uses the persisted provider identity.
- Existing email/password login and administrator user management continue to work.
- The focused backend and frontend verification commands pass.
