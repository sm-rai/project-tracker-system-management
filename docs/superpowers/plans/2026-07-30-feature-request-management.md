# Feature Request Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete PRD-aligned Feature Request workflow and expose its current-week OKR 2 KPI against the 90% target.

**Architecture:** A dedicated Laravel resource controller and shared Form Request own CRUD, SLA calculation, filtering, status transitions, and KPI props. Inertia React pages mirror the established Issue surface, use shadcn/ui and Wayfinder, and Project detail consumes compact operational-history props.

**Tech Stack:** PHP 8.3, Laravel 13, Pest 4, Inertia 3, React 19, TypeScript, Tailwind 4, shadcn/ui, Laravel Wayfinder.

## Global Constraints

- Only deployed running or deployed maintenance projects may be selected.
- `fulfillment_note` is nullable.
- Status transitions are `open -> in_progress -> fulfilled` and `fulfilled -> in_progress`.
- Current-week KPI uses Monday-Sunday, all requests in the denominator, and 100% for an empty period.
- Target is 90%.
- No new dependencies.
- New UI uses existing shadcn/ui components and Wayfinder route objects.

---

### Task 1: Persistence and Domain Transitions

**Files:**
- Create: `database/migrations/2026_07_30_000001_add_fulfillment_note_to_feature_requests_table.php`
- Modify: `app/Models/FeatureRequest.php`
- Modify: `app/Policies/FeatureRequestPolicy.php`
- Test: `tests/Feature/FeatureRequestBackendTest.php`

**Interfaces:**
- Produces: nullable `fulfillment_note`, `markInProgress(): void`, `fulfill(?string $note): void`, `reopen(): void`, and stable due-date/on-time behavior.

- [ ] Write Pest tests proving note persistence, valid transitions, on-time/late calculation, and reopen behavior.
- [ ] Run `php artisan test --compact tests/Feature/FeatureRequestBackendTest.php` and confirm failures caused by missing implementation.
- [ ] Add the migration and model methods; include `due_date`, `is_on_time`, and `fulfillment_note` in the writable domain contract.
- [ ] Run the focused tests and confirm they pass.

### Task 2: CRUD, Validation, Filters, KPI, and Authorization

**Files:**
- Create: `app/Http/Requests/SaveFeatureRequestRequest.php`
- Create: `app/Http/Controllers/FeatureRequestController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/FeatureRequestControllerTest.php`

**Interfaces:**
- Consumes: Task 1 model transitions.
- Produces: resource routes plus `start`, `fulfill`, and `reopen`; Inertia props `featureRequests`, `metrics`, `okr`, `filters`, `deployedProjects`, and enum option arrays.

- [ ] Write failing feature tests for authentication, pages, deployed-project validation, CRUD, search/filter/overdue, status actions, admin-only delete, and KPI formula.
- [ ] Run the controller test file and confirm route/controller failures.
- [ ] Implement `SaveFeatureRequestRequest` with `Rule::exists(...)->whereIn(...)`, Indonesian messages, and policy-aware authorization.
- [ ] Implement the controller with policy checks, SLA recalculation, pagination, current-week KPI, and explicit transition validation.
- [ ] Register resource and action routes.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Project Operational History

**Files:**
- Modify: `app/Http/Controllers/ProjectController.php`
- Modify: `resources/js/pages/projects/show.tsx`
- Modify: `tests/Feature/ProjectControllerTest.php`

**Interfaces:**
- Produces: loaded `project.issues` and `project.feature_requests` ordered newest first.

- [ ] Add a failing Project show test for related Issue and Feature Request props.
- [ ] Load both relations only for the existing detail response.
- [ ] Replace the deployed placeholder with compact Issue and Feature Request tables and typed detail links.
- [ ] Run the focused Project tests.

### Task 4: Inertia Feature Request Surface

**Files:**
- Create: `resources/js/components/feature-requests/feature-request-form.tsx`
- Create: `resources/js/pages/feature-requests/index.tsx`
- Create: `resources/js/pages/feature-requests/create.tsx`
- Create: `resources/js/pages/feature-requests/edit.tsx`
- Create: `resources/js/pages/feature-requests/show.tsx`
- Modify: `resources/js/components/app-sidebar.tsx`
- Generated: `resources/js/actions/App/Http/Controllers/FeatureRequestController.ts`
- Generated: `resources/js/routes/feature-requests/index.ts`

**Interfaces:**
- Consumes: Task 2 Inertia props and Wayfinder functions.
- Produces: complete Operate-mode UI for list, form, detail, status dialogs, filters, pagination, and OKR presentation.

- [ ] Run Impeccable context and load the new-work and craft-floor references.
- [ ] Generate Wayfinder routes after backend routes exist.
- [ ] Build a shared accessible create/edit form with SLA preview and unsaved-change protection.
- [ ] Build the index with the 90% OKR comparison, metrics, filters, overdue state, table, and valid pagination.
- [ ] Build detail actions for start, fulfill with optional note, reopen, edit, and admin-only delete.
- [ ] Add the sidebar entry and preserve sibling-surface visual conventions.
- [ ] Run TypeScript and file-scoped ESLint, then resolve new errors.

### Task 5: Quality Gate

**Files:**
- Modify only files required to fix regressions introduced by Tasks 1-4.

- [ ] Run `vendor/bin/pint --dirty --format agent`.
- [ ] Run focused Feature Request and Project tests.
- [ ] Run `php artisan test --compact`.
- [ ] Run `npm run types:check`.
- [ ] Run ESLint on every changed frontend file.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` and `git diff --name-only`.
- [ ] Confirm each approved design requirement has implementation and test evidence.
