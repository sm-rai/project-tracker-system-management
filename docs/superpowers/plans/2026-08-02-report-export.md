# Report Snapshot Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Add authenticated, on-demand PDF and PNG downloads for immutable OKR report snapshots.

**Architecture:** Reuse the persisted `ReportSnapshot` JSON as the only export source. A focused export-data action prepares one normalized view-model for two dedicated Blade templates; an export controller renders the templates through Spatie Browsershot/headless Chrome and streams the resulting file without saving it to application storage. The existing Inertia snapshot page only adds download actions.

**Tech Stack:** Laravel 13, Inertia React 3, React 19, Blade export templates, Spatie Browsershot, Puppeteer/Chrome, Pest 4, Tailwind/shadcn UI.

## Global Constraints

- Export data must come from `report_snapshots`; export must never recalculate from live Project, Issue, or Feature Request records.
- PDF is the complete multi-page report; PNG is one compact snapshot summary and must not contain long Issue/Feature Request tables.
- Files are generated on demand and downloaded immediately; `pdf_file_path` and `png_file_paths` remain unused in this MVP.
- Empty report copy must remain report-ready: `Tidak ada issue baru pada periode ini.` and `Tidak ada Feature Request baru pada periode ini.`.
- All export routes remain behind `auth` and use route model binding for `ReportSnapshot`.
- Export templates must be self-contained HTML/CSS so Browsershot does not depend on the authenticated app URL or Vite assets.
- Preserve unrelated dirty worktree changes; stage only files belonging to this feature when committing.
- Follow existing Laravel, Inertia, shadcn/ui, TypeScript, Pint, and Pest conventions.

---

### Task 1: Add Browsershot runtime dependencies

**Files:**
- Modify: `composer.json`
- Modify: `composer.lock`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces the `Spatie\\Browsershot\\Browsershot` PHP class and a Puppeteer runtime available to export requests.
- Does not change application routes or UI yet.

- [ ] **Step 1: Add the PHP package**

Run:

```bash
composer require spatie/browsershot --no-interaction
```

Expected: Composer adds `spatie/browsershot` and updates only Composer dependency files.

- [ ] **Step 2: Add Puppeteer to the frontend runtime dependencies**

Run:

```bash
npm install puppeteer
```

Expected: `package.json` and `package-lock.json` contain Puppeteer, and the local Puppeteer browser/runtime is available for Browsershot.

- [ ] **Step 3: Verify the package APIs before coding**

Run:

```bash
php -r "require 'vendor/autoload.php'; echo class_exists('Spatie\\Browsershot\\Browsershot') ? 'browsershot-ready' : 'missing';"
```

Expected: `browsershot-ready`.

- [ ] **Step 4: Commit the dependency-only change**

```bash
git add composer.json composer.lock package.json package-lock.json
git commit -m "chore: add report export rendering dependencies"
```

---

### Task 2: Write failing export endpoint tests

**Files:**
- Create: `tests/Feature/ReportSnapshotExportTest.php`

**Interfaces:**
- Tests the future routes `reports.export.pdf` and `reports.export.png`.
- Uses `ReportSnapshot::factory()` and does not depend on live operational records.
- The tests must fail because the routes do not exist yet.

- [ ] **Step 1: Scaffold the Pest feature test**

Run:

```bash
php artisan make:test --pest ReportSnapshotExportTest --no-interaction
```

- [ ] **Step 2: Replace the generated test with the export contract**

Use this test structure:

```php
<?php

use AppModelsReportSnapshot;
use AppModelsUser;

test('guests are redirected when exporting a report snapshot', function (): void {
    $snapshot = ReportSnapshot::factory()->create();

    $this->get("/reports/{$snapshot->id}/export/pdf")->assertRedirect('/login');
    $this->get("/reports/{$snapshot->id}/export/png")->assertRedirect('/login');
});

test('missing snapshots return not found for export endpoints', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/reports/999999/export/pdf')
        ->assertNotFound();

    $this->actingAs($user)
        ->get('/reports/999999/export/png')
        ->assertNotFound();
});

test('authenticated users can download a snapshot as pdf', function (): void {
    $user = User::factory()->create();
    $snapshot = ReportSnapshot::factory()->create([
        'period_start_date' => '2026-07-27',
        'period_end_date' => '2026-08-02',
    ]);

    $response = $this->actingAs($user)
        ->get("/reports/{$snapshot->id}/export/pdf");

    $response->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', fn (string $value): bool => str_contains($value, 'snapshot-okr-27-jul-2026-02-agu-2026.pdf'));
});

test('authenticated users can download a snapshot as png', function (): void {
    $user = User::factory()->create();
    $snapshot = ReportSnapshot::factory()->create([
        'period_start_date' => '2026-07-27',
        'period_end_date' => '2026-08-02',
    ]);

    $response = $this->actingAs($user)
        ->get("/reports/{$snapshot->id}/export/png");

    $response->assertOk()
        ->assertHeader('content-type', 'image/png')
        ->assertHeader('content-disposition', fn (string $value): bool => str_contains($value, 'snapshot-okr-27-jul-2026-02-agu-2026.png'));
});
```

- [ ] **Step 3: Run the new tests to confirm RED**

Run:

```bash
php artisan test --compact tests/Feature/ReportSnapshotExportTest.php
```

Expected: guest assertions pass, while the authenticated export tests fail with 404 because the routes and controller do not exist.

---

### Task 3: Build the snapshot export view-model

**Files:**
- Create: `app/Actions/Reports/BuildReportExportData.php`
- Test: `tests/Feature/ReportSnapshotExportTest.php`

**Interfaces:**
- Produces `BuildReportExportData::handle(ReportSnapshot $snapshot): array`.
- The returned array contains `snapshot`, `okr`, `stats`, `projects`, `issues`, `feature_requests`, and `breakdowns`.
- All values are derived from the snapshot's JSON columns and stored dates.

- [ ] **Step 1: Add a failing data-contract test**

Append this test:

```php
test('export data preserves snapshot values and empty report copy', function (): void {
    $snapshot = ReportSnapshot::factory()->create([
        'period_start_date' => '2026-07-27',
        'period_end_date' => '2026-08-02',
        'okr2_issue_percentage' => 100,
        'okr2_feature_request_percentage' => 100,
        'issue_breakdown_json' => [
            'empty_label' => 'Tidak ada issue baru pada periode ini.',
            'total' => 0,
            'on_time' => 0,
            'items' => [],
            'by_status' => [],
            'by_priority' => [],
            'by_root_cause' => [],
        ],
        'feature_request_breakdown_json' => [
            'empty_label' => 'Tidak ada Feature Request baru pada periode ini.',
            'total' => 0,
            'on_time' => 0,
            'items' => [],
            'by_status' => [],
            'by_priority' => [],
        ],
    ]);

    $data = app(\App\Actions\Reports\BuildReportExportData::class)->handle($snapshot);

    expect($data['snapshot']['period_label'])->toBe('27 Jul 2026 - 2 Agu 2026')
        ->and($data['okr']['issue_on_time']['actual'])->toBe(100.0)
        ->and($data['okr']['issue_on_time']['empty_label'])->toBe('Tidak ada issue baru')
        ->and($data['issues']['empty_label'])->toBe('Tidak ada issue baru pada periode ini.')
        ->and($data['feature_requests']['empty_label'])->toBe('Tidak ada Feature Request baru pada periode ini.');
});
```

- [ ] **Step 2: Run the contract test to confirm RED**

Run:

```bash
php artisan test --compact tests/Feature/ReportSnapshotExportTest.php --filter="preserves snapshot values"
```

Expected: FAIL because `BuildReportExportData` does not exist.

- [ ] **Step 3: Implement the view-model**

Create `BuildReportExportData` with these exact responsibilities:

```php
public function handle(ReportSnapshot $snapshot): array
{
    $issues = $snapshot->issue_breakdown_json;
    $featureRequests = $snapshot->feature_request_breakdown_json;
    $projects = $snapshot->project_breakdown_json;

    return [
        'snapshot' => [
            'id' => $snapshot->id,
            'period_label' => $this->formatDateRange($snapshot->period_start_date, $snapshot->period_end_date),
            'period_type_label' => $snapshot->period_type === ReportSnapshot::PeriodWeeklyDefault
                ? 'Minggu berjalan'
                : 'Rentang tanggal',
            'generated_at' => $snapshot->generated_at->format('d M Y, H:i'),
        ],
        'okr' => [
            'brief_realization' => $this->projectMetric($projects),
            'issue_on_time' => $this->itemMetric('Issue SLA', (float) $snapshot->okr2_issue_percentage, 80, $issues, 'issue'),
            'feature_request_on_time' => $this->itemMetric('Feature Request SLA', (float) $snapshot->okr2_feature_request_percentage, 90, $featureRequests, 'feature_request'),
        ],
        'stats' => [
            'total_projects' => (int) ($projects['total'] ?? count($projects['projects'] ?? [])),
            'active_projects' => (int) ($projects['active_total'] ?? 0),
            'issues' => (int) ($issues['total'] ?? 0),
            'feature_requests' => (int) ($featureRequests['total'] ?? 0),
        ],
        'projects' => $projects['projects'] ?? [],
        'issues' => $issues['items'] ?? [],
        'feature_requests' => $featureRequests['items'] ?? [],
        'breakdowns' => [
            'issues' => [
                'by_status' => $issues['by_status'] ?? [],
                'by_priority' => $issues['by_priority'] ?? [],
                'by_root_cause' => $issues['by_root_cause'] ?? [],
            ],
            'feature_requests' => [
                'by_status' => $featureRequests['by_status'] ?? [],
                'by_priority' => $featureRequests['by_priority'] ?? [],
            ],
        ],
    ];
}
```

Use typed private helpers for `projectMetric`, `itemMetric`, date formatting, and Indonesian month labels. Preserve null project achievement values and empty labels.

- [ ] **Step 4: Run the data-contract test**

Run:

```bash
php artisan test --compact tests/Feature/ReportSnapshotExportTest.php --filter="preserves snapshot values"
```

Expected: PASS.

- [ ] **Step 5: Format the PHP action**

Run:

```bash
vendor/bin/pint --dirty --format agent
```

Expected: PASS.

---

### Task 4: Add export controller and routes

**Files:**
- Create: `app/Http/Controllers/ReportSnapshotExportController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/ReportSnapshotExportTest.php`

**Interfaces:**
- Route names:
  - `reports.export.pdf`
  - `reports.export.png`
- Controller methods:
  - `pdf(ReportSnapshot $reportSnapshot, BuildReportExportData $buildReportExportData): Response`
  - `png(ReportSnapshot $reportSnapshot, BuildReportExportData $buildReportExportData): Response`
- Both methods use the same rendered export data and return attachments.

- [ ] **Step 1: Add authenticated routes**

Inside the existing `Route::middleware('auth')->group(...)`:

```php
Route::get('/reports/{reportSnapshot}/export/pdf', [ReportSnapshotExportController::class, 'pdf'])
    ->name('reports.export.pdf');
Route::get('/reports/{reportSnapshot}/export/png', [ReportSnapshotExportController::class, 'png'])
    ->name('reports.export.png');
```

Place these routes before `/reports/{reportSnapshot}` so the static `export` segment cannot be interpreted as a snapshot ID.

- [ ] **Step 2: Implement the PDF response**

The controller must:

1. call `BuildReportExportData::handle()`;
2. render `reports.export.pdf` with the returned data;
3. call `Browsershot::html($html)->format('A4')->showBackground()->margins(12, 12, 12, 12)->base64pdf()`;
4. decode the returned base64 string strictly;
5. return a stream download with `application/pdf` and the period-based filename;
6. log and abort with HTTP 503 if Browsershot fails.

- [ ] **Step 3: Implement the PNG response**

The controller must:

1. call `BuildReportExportData::handle()`;
2. render `reports.export.png`;
3. create a temporary `.png` path under `sys_get_temp_dir()`;
4. call `Browsershot::html($html)->windowSize(1600, 1200)->deviceScaleFactor(1)->fullPage()->save($temporaryPath)`;
5. return `response()->download(...)->deleteFileAfterSend(true)`;
6. log and abort with HTTP 503 if Browsershot fails.

- [ ] **Step 4: Run the endpoint tests**

Run:

```bash
php artisan test --compact tests/Feature/ReportSnapshotExportTest.php
```

Expected: guest, not-found, contract, PDF, and PNG tests pass.

- [ ] **Step 5: Format and inspect routes**

Run:

```bash
vendor/bin/pint --dirty --format agent
php artisan route:list --path=reports
```

Expected: both export routes appear under the auth middleware and have the expected names.

---

### Task 5: Create self-contained PDF and PNG templates

**Files:**
- Create: `resources/views/reports/export/pdf.blade.php`
- Create: `resources/views/reports/export/png.blade.php`
- Test: `tests/Feature/ReportSnapshotExportTest.php`

**Interfaces:**
- Both templates accept the exact array returned by `BuildReportExportData::handle()`.
- PDF and PNG use the same labels and empty-state copy.
- Templates contain inline CSS and no Vite, Inertia, remote font, or external image dependency.

- [ ] **Step 1: Add template rendering assertions**

Add a test that renders both views with the builder result and asserts the output contains:

```php
$html = view('reports.export.pdf', $data)->render();
$pngHtml = view('reports.export.png', $data)->render();

expect($html)
    ->toContain('Snapshot Laporan OKR')
    ->toContain('Tidak ada issue baru pada periode ini.')
    ->toContain('Tidak ada Feature Request baru pada periode ini.')
    ->toContain('Breakdown Root Cause');

expect($pngHtml)
    ->toContain('Snapshot Laporan OKR')
    ->toContain('Issue SLA')
    ->toContain('Feature Request SLA');
```

- [ ] **Step 2: Implement the PDF template**

Use inline `@page { size: A4; margin: 14mm; }`, a readable system sans-serif stack, print-safe colors, `page-break-inside: avoid` on cards/rows, and repeated table headers. Include the exact sections from the spec:

- report header;
- three OKR summary cards;
- statistics row;
- Project/OKR 1 table;
- Issue table;
- Feature Request table;
- status, priority, and root cause breakdown tables.

Use `@forelse` for empty lists and render the exact report-ready copy. Escape all values with Blade's normal `{{ }}` syntax.

- [ ] **Step 3: Implement the PNG template**

Use a self-contained fixed-width summary canvas:

```css
body { width: 1600px; margin: 0; background: #f7f4ef; }
.export-canvas { padding: 64px; }
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
```

Include the report header, three OKR cards, statistics, project progress rows, and compact Issue/Feature Request summaries. Do not render detail tables. Use full-page screenshot support so the canvas height grows with project rows.

- [ ] **Step 4: Run template assertions and export tests**

Run:

```bash
php artisan test --compact tests/Feature/ReportSnapshotExportTest.php
```

Expected: all export tests pass.

---

### Task 6: Add snapshot-page export actions

**Files:**
- Modify: `resources/js/pages/reports/show.tsx`
- Modify: `resources/js/types/report.ts` only if the page needs an export URL type
- Test: `tests/Feature/ReportSnapshotTest.php`

**Interfaces:**
- Existing snapshot detail behavior remains unchanged.
- Two download anchors point to `/reports/{report.id}/export/pdf` and
  `/reports/{report.id}/export/png`.

- [ ] **Step 1: Add the export controls**

In the snapshot header action group, add shadcn `Button` links with Lucide icons:

```tsx
<div className="flex flex-wrap items-center gap-2">
    <Button asChild variant="outline">
        <a href={`/reports/${report.id}/export/png`}>
            <ImageDown className="size-4" />
            Export PNG
        </a>
    </Button>
    <Button asChild>
        <a href={`/reports/${report.id}/export/pdf`}>
            <FileDown className="size-4" />
            Export PDF
        </a>
    </Button>
    <Button asChild variant="outline">
        <Link href="/reports">
            <ArrowLeft className="size-4" />
            Kembali ke Laporan
        </Link>
    </Button>
</div>
```

Keep the controls responsive and preserve the existing page hierarchy. Use accessible link text; no JavaScript state or Inertia form is required because both endpoints are direct downloads.

- [ ] **Step 2: Format and lint the page**

Run:

```bash
npx prettier --write resources/js/pages/reports/show.tsx
npx eslint resources/js/pages/reports/show.tsx
npm run types:check
```

Expected: all commands pass.

---

### Task 7: Align the PRD and run the complete verification suite

**Files:**
- Modify: `docs/PRD.md`
- Test: existing report and dashboard test suites

**Interfaces:**
- PRD Section 9.6 describes one PNG snapshot summary, not per-chart PNG exports.
- Existing snapshot and dashboard contracts remain valid.

- [ ] **Step 1: Update the PRD copy**

Change the report export requirement from PNG per-chart to:

```text
Export PNG satu gambar ringkasan snapshot untuk kebutuhan share cepat.
PDF tetap memuat seluruh detail laporan dalam format multi-halaman.
```

Update the related assumption and Definition of Done wording without changing the OKR formulas.

- [ ] **Step 2: Run PHP formatting and tests**

Run:

```bash
vendor/bin/pint --dirty --format agent
php artisan test --compact
```

Expected: all PHP tests pass with zero failures.

- [ ] **Step 3: Run frontend verification**

Run:

```bash
npx prettier --check resources/js/pages/reports/show.tsx
npx eslint resources/js/pages/reports/show.tsx
npm run types:check
npm run build
```

Expected: all commands exit with code 0.

- [ ] **Step 4: Check the final diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Only the intended export files and explicitly updated dependency/PRD files are reported as this feature's changes; unrelated dirty worktree changes remain untouched.

