# Konfigurasi SLA & Manajemen Issue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun modul Konfigurasi SLA dan CRUD Manajemen Issue (Kendala System) secara lengkap dari backend API, kalkulasi otomatis due date & SLA `is_on_time`, hingga tampilan halaman React (Inertia.js + Wayfinder + shadcn/ui).

**Architecture:** Menggunakan Laravel Controller & Request Validation untuk backend endpoint, Pest PHP untuk pengujian otomatis (TDD), serta Inertia React dengan Wayfinder untuk halaman frontend UI terstruktur.

**Tech Stack:** PHP 8.3, Laravel 13, Inertia.js React v3, TypeScript, Tailwind CSS v4, shadcn/ui, Pest 4.

## Global Constraints

- Sesuai `docs/PRD.md` (§7.4, 7.5, 9.2, 9.4) dan `docs/superpowers/specs/2026-07-29-sla-issue-management-design.md`.
- Hanya project berstatus `deployed_running` atau `deployed_maintenance` yang muncul di dropdown `project_id` saat input Issue.
- `project_id` bersifat opsional (`nullable`).
- `reported_at` default `now()` tetapi dapat di-custom date & time.
- `due_date` dihitung otomatis: `reported_at + target_resolution_days`.
- Status `resolved` menghitung `is_on_time = (resolved_at <= due_date 23:59:59)`.

---

### Task 1: Konfigurasi SLA (Backend & Frontend)

**Files:**
- Create: `app/Http/Controllers/SlaConfigController.php`
- Create: `resources/js/pages/sla/index.tsx`
- Create: `tests/Feature/SlaConfigTest.php`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `SlaConfig` model (`priority`, `target_resolution_days`)
- Produces: `sla.index` and `sla.update` routes

- [ ] **Step 1: Write failing Pest test for SLA Configs**

```php
<?php

use App\Models\SlaConfig;
use App\Models\User;

test('authenticated user can view sla configuration page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('sla.index'));

    $response->assertOk();
});

test('user can update target resolution days for sla priorities', function () {
    $user = User::factory()->create();
    
    SlaConfig::updateOrCreate(['priority' => 'urgent'], ['target_resolution_days' => 1]);
    SlaConfig::updateOrCreate(['priority' => 'normal'], ['target_resolution_days' => 3]);
    SlaConfig::updateOrCreate(['priority' => 'low'], ['target_resolution_days' => 7]);

    $response = $this->actingAs($user)->put(route('sla.update'), [
        'configs' => [
            'urgent' => 2,
            'normal' => 4,
            'low' => 10,
        ],
    ]);

    $response->assertRedirect();
    expect(SlaConfig::where('priority', 'urgent')->first()->target_resolution_days)->toBe(2);
    expect(SlaConfig::where('priority', 'normal')->first()->target_resolution_days)->toBe(4);
    expect(SlaConfig::where('priority', 'low')->first()->target_resolution_days)->toBe(10);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=SlaConfigTest`
Expected: FAIL (route or controller not found)

- [ ] **Step 3: Create SlaConfigController & register routes**

```php
<?php

namespace App\Http\Controllers;

use App\Models\SlaConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SlaConfigController extends Controller
{
    public function index(): Response
    {
        $priorities = ['urgent' => 1, 'normal' => 3, 'low' => 7];
        foreach ($priorities as $priority => $defaultDays) {
            SlaConfig::firstOrCreate(
                ['priority' => $priority],
                ['target_resolution_days' => $defaultDays]
            );
        }

        $configs = SlaConfig::all()->pluck('target_resolution_days', 'priority');

        return Inertia::render('sla/index', [
            'configs' => $configs,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'configs' => 'required|array',
            'configs.urgent' => 'required|integer|min:1|max:365',
            'configs.normal' => 'required|integer|min:1|max:365',
            'configs.low' => 'required|integer|min:1|max:365',
        ]);

        foreach ($validated['configs'] as $priority => $days) {
            SlaConfig::updateOrCreate(
                ['priority' => $priority],
                ['target_resolution_days' => $days]
            );
        }

        return redirect()->back()->with('success', 'Konfigurasi SLA berhasil diperbarui.');
    }
}
```

Add routes to `routes/web.php`:
```php
Route::get('/settings/sla', [SlaConfigController::class, 'index'])->name('sla.index');
Route::put('/settings/sla', [SlaConfigController::class, 'update'])->name('sla.update');
```

- [ ] **Step 4: Create SLA Frontend page `resources/js/pages/sla/index.tsx`**

Implement page with React form using Inertia `useForm` and shadcn UI components.

- [ ] **Step 5: Run tests to verify they pass**

Run: `php artisan test --filter=SlaConfigTest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/SlaConfigController.php resources/js/pages/sla/index.tsx routes/web.php tests/Feature/SlaConfigTest.php
git commit -m "feat: add SLA configuration controller, routes, page and tests"
```

---

### Task 2: Issue Controller & Backend Logic (CRUD, SLA Calculation, Filter)

**Files:**
- Create: `app/Http/Controllers/IssueController.php`
- Create: `tests/Feature/IssueBackendTest.php`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `Issue` model, `Project` model (`deployed_running`, `deployed_maintenance`), `SlaConfig` model
- Produces: `issues.index`, `issues.create`, `issues.store`, `issues.show`, `issues.edit`, `issues.update`, `issues.resolve`, `issues.reopen`, `issues.destroy`

- [ ] **Step 1: Write failing Pest tests for Issue CRUD and SLA calculation**

```php
<?php

use App\Models\Issue;
use App\Models\Project;
use App\Models\SlaConfig;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    SlaConfig::updateOrCreate(['priority' => 'urgent'], ['target_resolution_days' => 1]);
    SlaConfig::updateOrCreate(['priority' => 'normal'], ['target_resolution_days' => 3]);
    SlaConfig::updateOrCreate(['priority' => 'low'], ['target_resolution_days' => 7]);
});

test('user can create issue and due date is calculated based on sla config', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['status' => 'deployed_running']);

    $reportedAt = '2026-08-01 10:00:00';
    $response = $this->actingAs($user)->post(route('issues.store'), [
        'project_id' => $project->id,
        'title' => 'Error Server 500 saat Checkout',
        'description' => 'Terjadi error 500 pada API checkout.',
        'priority' => 'urgent',
        'root_cause_category' => 'system_error',
        'reported_at' => $reportedAt,
    ]);

    $response->assertRedirect(route('issues.index'));

    $issue = Issue::first();
    expect($issue->title)->toBe('Error Server 500 saat Checkout');
    expect($issue->due_date->format('Y-m-d'))->toBe('2026-08-02');
    expect($issue->status)->toBe('open');
});

test('only deployed_running or deployed_maintenance projects can be attached to an issue', function () {
    $user = User::factory()->create();
    $inProgressProject = Project::factory()->create(['status' => 'in_progress']);

    $response = $this->actingAs($user)->post(route('issues.store'), [
        'project_id' => $inProgressProject->id,
        'title' => 'Fitur belum rilis',
        'description' => 'Test',
        'priority' => 'normal',
        'root_cause_category' => 'system_error',
        'reported_at' => now()->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors('project_id');
});

test('user can resolve issue and is_on_time is computed accurately', function () {
    $user = User::factory()->create();
    $issue = Issue::factory()->create([
        'priority' => 'urgent',
        'reported_at' => '2026-08-01 10:00:00',
        'due_date' => '2026-08-02',
        'status' => 'open',
    ]);

    Carbon::setTestNow('2026-08-02 14:00:00');

    $response = $this->actingAs($user)->patch(route('issues.resolve', $issue), [
        'resolution_note' => 'Perbaikan query database berhasil dilakukan.',
    ]);

    $response->assertRedirect();
    $issue->refresh();

    expect($issue->status)->toBe('resolved');
    expect($issue->is_on_time)->toBeTrue();
    expect($issue->resolution_note)->toBe('Perbaikan query database berhasil dilakukan.');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=IssueBackendTest`
Expected: FAIL (Controller/routes missing)

- [ ] **Step 3: Implement `IssueController` with CRUD & SLA calculation logic**

Implement actions: `index`, `create`, `store`, `show`, `edit`, `update`, `resolve`, `reopen`, `destroy`.

- [ ] **Step 4: Register issue routes in `routes/web.php`**

```php
Route::resource('issues', IssueController::class);
Route::patch('/issues/{issue}/resolve', [IssueController::class, 'resolve'])->name('issues.resolve');
Route::patch('/issues/{issue}/reopen', [IssueController::class, 'reopen'])->name('issues.reopen');
```

- [ ] **Step 5: Run test to verify it passes**

Run: `php artisan test --filter=IssueBackendTest`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/IssueController.php routes/web.php tests/Feature/IssueBackendTest.php
git commit -m "feat: add IssueController CRUD, SLA calculation, and tests"
```

---

### Task 3: Issue Index Page Frontend (`resources/js/pages/issues/index.tsx`)

**Files:**
- Create: `resources/js/pages/issues/index.tsx`
- Modify: `resources/js/components/app-sidebar.tsx` or Navigation layout

**Interfaces:**
- Consumes: Wayfinder routes `@/routes/issues`, props `issues`, `metrics`, `filters`, `projects`
- Produces: Issues index UI with search/filter, header metric cards, and data table

- [ ] **Step 1: Build `resources/js/pages/issues/index.tsx`**

Includes:
- Summary Metric Cards: Total Issues, Open Issues, Overdue Issues, % On-Time Resolution.
- Filter Controls: Search query, Project filter dropdown, Priority filter, Root Cause filter, Status filter, Overdue toggle.
- Table Layout with badge formatting, overdue highlighting, and action links to Show, Edit, Resolve, Delete.

- [ ] **Step 2: Run Wayfinder generator to ensure typescript route functions are updated**

Run: `php artisan wayfinder:generate`

- [ ] **Step 3: Test frontend build**

Run: `npm run build`
Expected: Successful build without TypeScript or Vite compilation errors.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/issues/index.tsx
git commit -m "feat: add Issue index page with metrics and filters"
```

---

### Task 4: Issue Create & Edit Pages Frontend (`create.tsx` & `edit.tsx`)

**Files:**
- Create: `resources/js/pages/issues/create.tsx`
- Create: `resources/js/pages/issues/edit.tsx`

**Interfaces:**
- Consumes: Inertia form hooks, `projects` (deployed only), `priorities`, `rootCauses`
- Produces: Form for creating and editing issues

- [ ] **Step 1: Build `resources/js/pages/issues/create.tsx`**
  - Select Project (deployed only + "Tidak Terikat System"), Title input, Description textarea, Priority select with SLA info badge, Root Cause select, Date-time picker for `reported_at`.

- [ ] **Step 2: Build `resources/js/pages/issues/edit.tsx`**
  - Form pre-populated with existing issue details for editing.

- [ ] **Step 3: Test frontend compilation**

Run: `npm run build`
Expected: Successful build with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/issues/create.tsx resources/js/pages/issues/edit.tsx
git commit -m "feat: add Issue create and edit pages"
```

---

### Task 5: Issue Detail Page Frontend & Resolve Action (`show.tsx`)

**Files:**
- Create: `resources/js/pages/issues/show.tsx`

**Interfaces:**
- Consumes: `issue` object with project, SLA details, timeline, `resolve` and `reopen` actions
- Produces: Detailed issue view with status banner and resolution modal/action

- [ ] **Step 1: Build `resources/js/pages/issues/show.tsx`**
  - Status banner (Open / Overdue / Resolved On Time / Resolved Late).
  - Detailed metadata grid (System, Reported Date, Due Date, Resolved Date, Priority, Root Cause).
  - Description display.
  - Action buttons: "Mark as Resolved" (opens resolution note form/modal), "Re-open", "Edit Issue", "Hapus Issue".

- [ ] **Step 2: Run full test suite & frontend build**

Run: `php artisan test` and `npm run build`
Expected: All tests pass and assets compile cleanly.

- [ ] **Step 3: Commit**

```bash
git add resources/js/pages/issues/show.tsx
git commit -m "feat: add Issue show page with resolution action"
```
