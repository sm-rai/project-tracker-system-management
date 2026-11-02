# Quarterly OKR and Weekly Activities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Calculate dashboard OKRs for the current calendar quarter and generate manual, activity-only weekly/custom snapshots while preserving legacy reports.

**Architecture:** Keep dashboard metrics separate from report activity collection. Store versioned immutable snapshots in the existing table; branch presentation/export by version. Share one activity presenter across the controller and export builder.

**Tech Stack:** Existing Laravel 13, PHP, Pest 4, Inertia 3, React 19, shadcn/ui, Tailwind 4, Wayfinder, Browsershot. No dependency changes.

## Global Constraints

- Approved specification: `docs/superpowers/specs/2026-11-02-quarterly-okr-weekly-activities-design.md`.
- Q1: Januari–Maret; Q2: April–Juni; Q3: Juli–September; Q4: Oktober–Desember.
- Target minimal tetap **75% untuk setiap project**; target tetap **80% untuk Issue** dan **90% untuk Feature Request**.
- Project development progress remains cumulative across quarters; deployed projects leave current development assessment.
- Snapshot mingguan tetap dibuat manual untuk periode Minggu–Sabtu.
- Snapshot baru hanya berisi rincian aktivitas periode terpilih; persentase OKR tidak ditampilkan atau dihitung sebagai metrik mingguan.
- Preview, PDF, dan PNG mengikuti pemisahan ini. Snapshot lama dipertahankan.
- Business dates use `AppDateTime`/Asia/Jakarta; stored timestamps use UTC; exclude future events with one captured generation time.
- New and completed events can describe the same item; report both event count and distinct item count accurately.
- Reopening clears completion facts; do not fabricate event history from `updated_at`.
- All PHP changes require `vendor/bin/pint --dirty --format agent`; frontend uses existing shadcn components, semantic tokens and Wayfinder routes.
- Use tests before production changes, capture the expected failure, implement, then rerun the affected tests. Never delete existing tests; update old expectations where requirements changed.
- Work on `codex/quarterly-okr-weekly-activities`; stage only owned paths. No push or deployment.

## Task 1: Quarterly dashboard

**Files:**

- Modify `app/Actions/Dashboard/BuildDashboardData.php`.
- Modify `resources/js/pages/dashboard.tsx`, `resources/js/types/dashboard.ts`.
- Test `tests/Feature/DashboardTest.php`.

**Interfaces:** Preserve dashboard shape, adding `period.quarter: number` and `period.year: number`. `period.start/end` describe the full quarter, `period.label` is `Q3 2026 · 1 Jul 2026 - 30 Sep 2026`; queries end at captured now, not quarter end. Operational totals remain unbounded.

- [ ] Update existing weekly metadata/cohort tests to the quarter contract. Add quarter/year rollover datasets (local midnight), same-quarter older items, previous-quarter items, future reported/requested/completion dates, empty cohort and cumulative project cases. Example expected observable contract:

```php
$this->actingAs(User::factory()->create())->get('/dashboard')
    ->assertInertia(fn ($page) => $page
        ->where('dashboard.period.start', '2026-07-01')
        ->where('dashboard.period.end', '2026-09-30')
        ->where('dashboard.period.quarter', 3)
        ->where('dashboard.period.year', 2026)
    );
```

- [ ] Run `php artisan test --compact tests/Feature/DashboardTest.php` and confirm failures specifically reflect the missing quarterly behavior.
- [ ] Capture business now once. Set boundaries using `startOfQuarter`/`endOfQuarter`, with the query upper bound equal to now. Count on-time items only when status is complete, `is_on_time` true and completion time is no later than now. Retain per-project cumulative feature progress and current active lifecycle membership. Exclude source records/features with creation or completion timestamps after now if they affect assessment.
- [ ] Update dashboard copy from week to quarter, metadata type, and labels. Preserve layout/design and existing thresholds.
- [ ] Run focused tests, TypeScript check, touched-file frontend formatting/lint and Pint. Self-review and commit only Task 1 files with `feat: calculate dashboard OKRs by quarter`.

## Task 2: Versioned activity snapshots and backend API

**Files:**

- Create via Artisan `app/Actions/Reports/CollectReportActivities.php` and `app/Actions/Reports/BuildActivityReportData.php`.
- Create via Artisan a migration adding `format_version` to `report_snapshots` and making legacy percentage columns nullable.
- Modify `app/Actions/Reports/GenerateReportSnapshot.php`, `app/Models/ReportSnapshot.php`, `database/factories/ReportSnapshotFactory.php`, `app/Http/Controllers/ReportSnapshotController.php`.
- Update `tests/Feature/ReportSnapshotTest.php`; create `tests/Feature/ReportActivityTest.php` via `php artisan make:test --pest ReportActivityTest --no-interaction`.

**Interfaces:**

```text
CollectReportActivities::handle(CarbonImmutable start, CarbonImmutable end, CarbonImmutable generatedAt): array
    projects: {activities: Activity[]}
    issues: {activities: Activity[]}
    feature_requests: {activities: Activity[]}

Activity:
    entity_type: 'project' | 'brief_feature' | 'issue' | 'feature_request'
    entity_id: int
    title: string
    project_id: int | null
    project_name: string | null
    activity_type: 'created' | 'completed'
    activity_label: string (Indonesian label specific to entity/action)
    occurred_at: string (ISO timestamp; YYYY-MM-DD for date-only project completion)
    status: string
    status_label: string
    priority: string | null
    due_date: string | null
    note: string | null

BuildActivityReportData::handle(ReportSnapshot snapshot): array
    activity_summary:
        total_activities: int
        unique_items: int (distinct entity_type + entity_id)
        groups: Array<{
            entity_type: Activity.entity_type
            label: string
            new_items: int
            completed_items: int
            total_activities: int
            unique_items: int
        }> (all four entity groups, including zero groups)
    activities: Activity[] (descending event time, deterministic tie order)
```

V1 summary/detail keep existing fields and add `format_version: 1`.
V2 summary includes existing identity/period labels/generated_at/href, `format_version: 2`, `activity_summary`, and no `okr`.
V2 detail includes existing `id`, `period`, `generated_at`, `format_version: 2`, `activity_summary`, `activities`, and no `okr` or legacy metric breakdowns.

- [ ] Write integration tests for new snapshot version/null percentage storage, current-week boundaries, custom range, no future events, old-item completion, project/brief creation and completion, Issue without a project, correct distinct counts, reopened items, immutable saved data, empty snapshots, and old snapshot metadata compatibility. Rewrite existing generation assertions for the new contract without discarding their validation/authorization coverage.
- [ ] Run the two report test files and capture expected red failures.
- [ ] Verify actual application schema through Boost (already confirmed report table exists). Migration: existing/default format 1, new writes explicitly 2, retain all legacy values. Change all four legacy percentages to nullable/default null. Rollback must refuse when activity-format rows exist rather than reinterpret their missing percentages as legacy OKRs; when no V2 rows exist, restore prior defaults/nullability and drop version.
- [ ] Implement the collector using bounded eager-loaded queries per entity. Events: project `created_at` / `actual_end_date`; brief `created_at` / `completed_at`; Issue `reported_at` / `resolved_at`; request `requested_at` / `fulfilled_at`. Completion requires matching completed status. Project completion means development finished (pending deployment or deployed), not actual deployment. Clamp the upper timestamp to generation time; date-only comparison uses local dates. Empty future ranges yield no activities. Never infer completion from last edit time.
- [ ] Implement presenter from stored JSON only. Keep distinct count keys entity-qualified; include context project names without counting context as activity. Generation captures now once, stores all three JSON groups, four null percentage values and explicit version 2 atomically.
- [ ] Branch report controller summary/detail using version; keep old presentation behavior for old rows. Keep manual weekly/default and custom validation flows, never schedule generation. Legacy factory remains version 1 by default; optionally add a clear activity-format factory state for new export tests.
- [ ] Run both report test files plus existing export tests (legacy export remains valid), Pint and PHP syntax checks; self-review and commit owned backend files with `feat: store manual activity report snapshots`.

## Task 3: Activity report UI and exports, preserving legacy presentation

**Files:**

- Modify `resources/js/types/report.ts`, `resources/js/pages/reports/index.tsx`, `resources/js/pages/reports/show.tsx`, `resources/js/components/app-sidebar.tsx`.
- Create focused report activity presentation components under existing `resources/js/components` if separating the new detail surface improves clarity.
- Modify `app/Actions/Reports/BuildReportExportData.php`, `app/Http/Controllers/ReportSnapshotExportController.php`.
- Create `resources/views/reports/export/activities-pdf.blade.php`, `resources/views/reports/export/activities-png.blade.php` using existing `resources/css/report-export.css` and legacy template visual conventions.
- Test `tests/Feature/ReportSnapshotExportTest.php`; add endpoint presentation coverage to `tests/Feature/ReportActivityTest.php` if needed.

**Interfaces:** Consume Task 2's exact versioned API. Preserve existing legacy TS interfaces as the V1 branch of discriminated unions. `BuildReportExportData` V2 returns the same `activity_summary` and `activities` from `BuildActivityReportData`, existing snapshot metadata, unique context project names, and no `okr`. V2 filename prefix is `snapshot-aktivitas`; V1 stays `snapshot-okr`.

- [ ] Add failing tests proving V2 preview payload and both HTML export templates contain saved activity values, no OKR percentage UI, version-specific filenames, empty output, long titles/multiple rows, and independence from later source edits. Maintain existing V1 export tests and errors/temporary-file cleanup coverage.
- [ ] Run the focused export/activity tests and capture expected failures for missing V2 export support.
- [ ] Use Impeccable (Operate mode, preserve existing Terracotta/Warm Stone/Plus Jakarta identity), shadcn, Tailwind and Wayfinder skills. Read existing UI components before editing. Reuse Card/Table/Badge/Field/Select composition. Update navigation and creation copy to `Laporan Aktivitas`; history clearly identifies old OKR snapshots without relabeling their saved contents. Preserve all existing manual date controls and errors.
- [ ] Add discriminated unions and version-safe rendering: old reports use their current OKR detail; new detail displays new/completed counts per entity, distinct item/event totals, timestamps, context project, status and optional notes. Date-only completion must display without a fabricated time or UTC date shift. Mobile tables scroll horizontally, long titles wrap, empty states remain clear. Use Wayfinder report store/show/export functions rather than introducing hardcoded routes.
- [ ] Branch export builder/controller by version; do not change existing V1 views. New PDF contains detailed saved activities; PNG contains activity counts and context project names. Use existing stylesheet for consistent layout and escape all user content. Both use versioned saved data only.
- [ ] Run focused tests, touched-file ESLint/Prettier, `npm run types:check`, `npm run build`, Pint and diff checks. Self-review and commit owned files with `feat: present and export weekly activities`.

## Task 4: Integration verification and delivery

**Files:** Mark this plan's checklist and the approved specification's status accurately. Update relevant existing PRD passages only to reflect the approved quarterly/activity separation; do not create unrelated documents.

- [ ] Review the whole branch against each specification acceptance criterion, resolving all material findings with focused regression tests.
- [ ] Verify local DB identity read-only, inspect pending migration SQL, then run only the new migration on the local application database. Do not migrate production or reset databases. Verify version/nullability and preservation of existing snapshot rows afterward.
- [ ] Run affected Dashboard/ReportSnapshot/ReportActivity/ReportSnapshotExport tests once on integrated code. Run full suite only when wider shared schema/presentation changes justify it. Run frontend types, touched-file lint/format, build, Pint and `git diff --check`.
- [ ] Inspect dashboard and manual report screens at desktop/mobile widths and render representative legacy and activity export layouts with the available browser/Chromium tooling. Use synthetic temporary data only when clearly isolated from the user's normal database.
- [ ] Commit documentation completion updates. Confirm branch and clean working tree. Report observable behavior, tests and any real verification limits in Indonesian; no push/deployment.
