# Historical Issue Resolution Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Allow an authenticated user to resolve an open Issue using the actual completion time between \`reported_at\` and the current application time.

**Architecture:** Keep the existing \`PATCH /issues/{issue}/resolve\` endpoint and detail-page dialog. Move resolve validation into a focused \`ResolveIssueRequest\`, let the existing \`Issue\` model recompute status and \`is_on_time\`, and add bounded date-time input support to the existing shared \`DateTimePicker\`.

**Tech Stack:** Laravel 13, PHP 8.3, Pest 4, Inertia React 3, React 19, TypeScript, shadcn/ui, Radix/react-day-picker, date-fns, Laravel Wayfinder.

## Global Constraints

- \`resolved_at\` is optional for backward compatibility; when omitted, the backend uses \`now()\`.
- A supplied \`resolved_at\` must be greater than or equal to \`reported_at\` and less than or equal to the current application time.
- Do not add a migration, dependency, Issue status, audit table, or new resolve endpoint.
- Reuse the existing \`DateTimePicker\`, shadcn/ui primitives, flash feedback, and \`Issue\` model save behavior.
- Keep user-facing labels, helper text, and validation messages in Indonesian.
- Use Wayfinder route helpers for backend route calls from the changed Issue detail page.
- Every production change must have a failing Pest test first and must be formatted and verified before completion.

---

### Task 1: Add failing backend coverage for historical resolution

**Files:**
- Modify: \`tests/Feature/IssueBackendTest.php\` near the existing resolve test
- Test: \`tests/Feature/IssueBackendTest.php\`

**Interfaces:**
- Consumes: Existing \`issues.resolve\` route, \`IssueFactory\`, \`SlaConfig\` setup, and \`Carbon::setTestNow()\` convention.
- Produces: Regression coverage proving the resolve endpoint accepts a valid historical timestamp and rejects timestamps outside the Issue/request bounds.

- [ ] **Step 1: Add the historical success test before changing production code**

Add this Pest test after the current \`user can resolve issue...\` test:

~~~php
test('user can resolve issue at a valid historical time', function () {
    $user = User::factory()->create();
    $issue = Issue::factory()->create([
        'priority' => 'urgent',
        'reported_at' => '2026-08-01 10:00:00',
        'due_date' => '2026-08-02 10:00:00',
        'status' => 'open',
    ]);

    Carbon::setTestNow('2026-08-03 10:00:00');

    $response = $this->actingAs($user)->patch(route('issues.resolve', $issue), [
        'resolved_at' => '2026-08-02 09:30:00',
        'resolution_note' => 'Perbaikan sudah selesai kemarin.',
    ]);

    $response->assertRedirect();
    $issue->refresh();

    expect($issue->resolved_at?->format('Y-m-d H:i:s'))->toBe('2026-08-02 09:30:00');
    expect($issue->is_on_time)->toBeTrue();
    expect($issue->resolution_note)->toBe('Perbaikan sudah selesai kemarin.');
});
~~~

- [ ] **Step 2: Add late, too-early, and future timestamp tests**

Add these tests. Each invalid request must leave the Issue open and attach an error to \`resolved_at\`:

~~~php
test('late historical resolution is marked as late', function () {
    $user = User::factory()->create();
    $issue = Issue::factory()->create([
        'reported_at' => '2026-08-01 10:00:00',
        'due_date' => '2026-08-02 10:00:00',
        'status' => 'open',
    ]);

    Carbon::setTestNow('2026-08-03 10:00:00');

    $response = $this->actingAs($user)->patch(route('issues.resolve', $issue), [
        'resolved_at' => '2026-08-02 10:00:01',
    ]);

    $response->assertRedirect();
    $issue->refresh();

    expect($issue->resolved_at?->format('Y-m-d H:i:s'))->toBe('2026-08-02 10:00:01');
    expect($issue->is_on_time)->toBeFalse();
});

test('resolution before reported time is rejected', function () {
    $user = User::factory()->create();
    $issue = Issue::factory()->create([
        'reported_at' => '2026-08-01 10:00:00',
        'due_date' => '2026-08-02 10:00:00',
        'status' => 'open',
    ]);

    Carbon::setTestNow('2026-08-03 10:00:00');

    $response = $this
        ->actingAs($user)
        ->from(route('issues.show', $issue))
        ->patch(route('issues.resolve', $issue), [
            'resolved_at' => '2026-08-01 09:59:59',
        ]);

    $response->assertRedirect(route('issues.show', $issue));
    $response->assertSessionHasErrors('resolved_at');
    expect($issue->fresh()->status->value)->toBe('open');
});

test('resolution in the future is rejected', function () {
    $user = User::factory()->create();
    $issue = Issue::factory()->create([
        'reported_at' => '2026-08-01 10:00:00',
        'due_date' => '2026-08-02 10:00:00',
        'status' => 'open',
    ]);

    Carbon::setTestNow('2026-08-03 10:00:00');

    $response = $this
        ->actingAs($user)
        ->from(route('issues.show', $issue))
        ->patch(route('issues.resolve', $issue), [
            'resolved_at' => '2026-08-03 10:00:01',
        ]);

    $response->assertRedirect(route('issues.show', $issue));
    $response->assertSessionHasErrors('resolved_at');
    expect($issue->fresh()->status->value)->toBe('open');
});
~~~

- [ ] **Step 3: Run only the Issue backend test file and confirm the new behavior fails**

Run:

~~~text
php artisan test --compact tests/Feature/IssueBackendTest.php
~~~

Expected: the existing resolve test passes, while the historical timestamp assertion and boundary tests fail because the current controller ignores \`resolved_at\` and has no bounds validation.

- [ ] **Step 4: Commit the red tests**

~~~text
git add tests/Feature/IssueBackendTest.php
git commit -m "test: cover historical issue resolution time"
~~~

### Task 2: Implement server-side resolve validation and persistence

**Files:**
- Create: \`app/Http/Requests/ResolveIssueRequest.php\`
- Modify: \`app/Http/Controllers/IssueController.php\` in \`resolve\`
- Test: \`tests/Feature/IssueBackendTest.php\`

**Interfaces:**
- Consumes: Route-bound \`Issue $issue\` and the red tests from Task 1.
- Produces: \`ResolveIssueRequest::rules()\` validating \`resolved_at\`, and \`IssueController::resolve(ResolveIssueRequest $request, Issue $issue)\` persisting the selected timestamp.

- [ ] **Step 1: Create the focused Form Request with exact bounds validation**

Create \`app/Http/Requests/ResolveIssueRequest.php\` with this structure:

~~~php
<?php

namespace App\Http\Requests;

use App\Models\Issue;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class ResolveIssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $issue = $this->route('issue');

        return [
            'resolved_at' => [
                'bail',
                'nullable',
                'date',
                function (string $attribute, mixed $value, Closure $fail) use ($issue): void {
                    if (! $issue instanceof Issue) {
                        return;
                    }

                    $resolvedAt = Carbon::parse((string) $value);

                    if ($resolvedAt->lt($issue->reported_at)) {
                        $fail('Waktu selesai tidak boleh mendahului waktu laporan.');
                    }

                    if ($resolvedAt->gt(now())) {
                        $fail('Waktu selesai tidak boleh berada di masa depan.');
                    }
                },
            ],
            'resolution_note' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'resolved_at.date' => 'Waktu selesai harus berupa tanggal dan waktu yang valid.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'resolved_at' => 'waktu selesai',
            'resolution_note' => 'catatan penyelesaian',
        ];
    }
}
~~~

- [ ] **Step 2: Replace inline resolve validation and persist the requested timestamp**

Import \`ResolveIssueRequest\` in \`IssueController.php\` and replace only the resolve method with:

~~~php
public function resolve(ResolveIssueRequest $request, Issue $issue): RedirectResponse
{
    $validated = $request->validated();

    $issue->resolved_at = isset($validated['resolved_at'])
        ? Carbon::parse($validated['resolved_at'])
        : now();
    $issue->resolution_note = $validated['resolution_note'] ?? null;
    $issue->save();

    return redirect()->back()->with('success', 'Issue berhasil ditandai selesai.');
}
~~~

The existing \`Issue::saving\` callback remains responsible for setting \`status\` and computing \`is_on_time\`.

- [ ] **Step 3: Run the backend tests and formatter**

Run:

~~~text
php artisan test --compact tests/Feature/IssueBackendTest.php
vendor/bin/pint --dirty --format agent
~~~

Expected: all Issue backend tests pass, including historical, on-time, late, too-early, future, default-now, and reopen behavior; Pint reports the changed PHP files formatted.

- [ ] **Step 4: Commit the backend implementation**

~~~text
git add app/Http/Requests/ResolveIssueRequest.php app/Http/Controllers/IssueController.php tests/Feature/IssueBackendTest.php
git commit -m "feat: accept historical issue resolution time"
~~~

### Task 3: Wire the bounded date-time picker into the Issue detail dialog

**Files:**
- Modify: \`resources/js/components/ui/date-time-picker.tsx\`
- Modify: \`resources/js/pages/issues/show.tsx\`
- Test/verification: TypeScript, Prettier, and Vite build commands

**Interfaces:**
- Consumes: \`ResolveIssueRequest\` payload names (\`resolved_at\`, \`resolution_note\`) and existing generated \`resolve\`, \`reopen\`, \`destroy\`, and \`edit\` Wayfinder helpers in \`resources/js/actions/App/Http/Controllers/IssueController.ts\`.
- Produces: \`DateTimePicker\` optional \`minDate\`/\`maxDate\` props and a resolve dialog that submits a \`yyyy-MM-dd'T'HH:mm\` local value.

- [ ] **Step 1: Extend \`DateTimePicker\` with optional calendar and time bounds**

Add \`minDate?: Date\` and \`maxDate?: Date\` to \`DateTimePickerProps\`. Use date-fns helpers to:

~~~text
Calendar disabled dates before minDate and after maxDate.
Time input min/max are applied when the selected date is the same day as the bound.
handleTimeChange rejects a candidate outside minDate/maxDate before calling onChange.
Existing callers without bounds keep their current behavior.
~~~

Keep the existing \`DateTimePicker\` value contract and shadcn field layout unchanged. The shared component must still emit \`yyyy-MM-dd'T'HH:mm\` values.

- [ ] **Step 2: Add the historical timestamp field to \`issues/show.tsx\`**

Import \`format\` from \`date-fns\`, \`DateTimePicker\`, and the generated IssueController helpers. Initialize the existing resolve form as:

~~~tsx
const { data, setData, patch, processing, errors } = useForm({
    resolved_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    resolution_note: issue.resolution_note || '',
});
~~~

In the resolve dialog, render the picker before the textarea:

~~~tsx
<div className="space-y-2 py-4">
    <div className="grid gap-2">
        <Label htmlFor="resolved_at">Waktu selesai</Label>
        <DateTimePicker
            id="resolved_at"
            value={data.resolved_at}
            onChange={(value) => setData('resolved_at', value)}
            minDate={new Date(issue.reported_at)}
            maxDate={new Date()}
            aria-invalid={Boolean(errors.resolved_at)}
            aria-describedby={errors.resolved_at ? 'resolved_at-error' : 'resolved_at-help'}
        />
        <p id="resolved_at-help" className="text-xs leading-relaxed text-muted-foreground">
            Isi waktu sebenarnya saat issue selesai. Waktu harus berada setelah waktu laporan dan tidak boleh melewati waktu sekarang.
        </p>
        {errors.resolved_at && (
            <p id="resolved_at-error" className="text-xs font-medium text-danger">
                {errors.resolved_at}
            </p>
        )}
    </div>
    <Textarea
        rows={4}
        placeholder="Catatan penanganan atau solusi perbaikan..."
        value={data.resolution_note}
        onChange={(event) => setData('resolution_note', event.target.value)}
    />
</div>
~~~

Update the resolve submit to call \`patch(resolve.url(issue.id), ...)\`. Use \`reopen.url(issue.id)\`, \`destroy.url(issue.id)\`, and \`edit.url(issue.id)\` for the other backend calls already present in this page so the changed surface follows the project Wayfinder contract.

- [ ] **Step 3: Verify the frontend changes**

Run:

~~~text
npx prettier --check resources/js/components/ui/date-time-picker.tsx resources/js/pages/issues/show.tsx
npm run types:check
npm run build
~~~

Expected: Prettier reports both files formatted, TypeScript completes without errors, and Vite produces a successful production build.

- [ ] **Step 4: Commit the frontend implementation**

~~~text
git add resources/js/components/ui/date-time-picker.tsx resources/js/pages/issues/show.tsx
git commit -m "feat: add historical issue resolution picker"
~~~

### Task 4: Run final scoped verification

**Files:**
- Verify: all changed files from Tasks 1-3
- Test: \`tests/Feature/IssueBackendTest.php\`

**Interfaces:**
- Consumes: Complete backend and frontend implementation from Tasks 1-3.
- Produces: Evidence that the feature works, formatting is clean, and no unrelated files changed.

- [ ] **Step 1: Run the focused backend test again**

~~~text
php artisan test --compact tests/Feature/IssueBackendTest.php
~~~

Expected: the full Issue backend file passes.

- [ ] **Step 2: Run PHP formatting and repository diff checks**

~~~text
vendor/bin/pint --dirty --format agent
git diff --check
git diff --name-only HEAD~3..HEAD
git status --short
~~~

Expected: Pint makes no further changes, \`git diff --check\` is clean, and the changed file list contains only the approved spec/plan plus the Issue request/controller/test/detail picker files.

- [ ] **Step 3: Review the final diff against the spec**

Confirm all of the following in the diff:

~~~text
No supplied resolved_at can be before reported_at.
No supplied resolved_at can be after now().
Omitted resolved_at still resolves at now().
The Issue model remains the source of status/is_on_time calculation.
The dialog defaults to the current local minute and exposes an Indonesian helper/error message.
The shared picker remains backward compatible for existing callers.
~~~

- [ ] **Step 4: Commit any formatter-only correction, then report verification evidence**

If a formatter changes a tracked implementation file, run the affected tests again and commit the correction:

~~~text
git add app/Http/Requests/ResolveIssueRequest.php app/Http/Controllers/IssueController.php tests/Feature/IssueBackendTest.php resources/js/components/ui/date-time-picker.tsx resources/js/pages/issues/show.tsx
git commit -m "style: format historical issue resolution changes"
~~~

Do not claim completion until the final test, type-check, build, Pint, and diff checks have produced successful output.

