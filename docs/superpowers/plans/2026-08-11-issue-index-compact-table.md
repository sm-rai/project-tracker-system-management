# Compact Issue Index Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Remove descriptions from Issue index rows and constrain the table layout so long content cannot create unnecessary horizontal overflow.

**Architecture:** Keep Issue descriptions in the backend payload, search behavior, and detail page. Change only the Issue index presentation and add a source-based Pest presentation test matching the existing Project and Feature Request layout-test convention.

**Tech Stack:** Inertia React 3, React 19, TypeScript, Tailwind CSS v4, shadcn/ui Table, Pest 4.

## Global Constraints

- Only the Issue index presentation and its dedicated presentation test may change during implementation.
- Do not change the Issue model, controller, API payload, search query, detail page, or shared Table component.
- Keep the full description available on the Issue detail page and searchable through the existing search field.
- Use the existing shadcn/ui Table and project semantic tokens.
- Keep internal table scrolling as a fallback for narrow viewports, but prevent intrinsic content from widening the table on desktop.
- Run the focused Pest test with temporary SQLite CLI extensions because the current PHP CLI does not load pdo_sqlite by default.

---

### Task 1: Add a failing Issue index presentation test

**Files:**
- Create: \`tests/Feature/IssueIndexLayoutTest.php\`
- Test: \`tests/Feature/IssueIndexLayoutTest.php\`

**Interfaces:**
- Consumes: Source file \`resources/js/pages/issues/index.tsx\`.
- Produces: Assertions that lock the compact table contract without changing runtime data behavior.

- [ ] **Step 1: Write the failing test**

Create this Pest test:

~~~php
<?php

use Illuminate\Support\Facades\File;

test('issue index keeps rows compact without rendering descriptions', function () {
    $source = File::get(resource_path('js/pages/issues/index.tsx'));

    expect($source)
        ->toContain('<Table className="min-w-[980px] table-fixed">')
        ->toContain('className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"')
        ->toContain('Issue')
        ->not->toContain('issue.description');
});
~~~

- [ ] **Step 2: Run the new test and confirm it fails**

Run:

~~~text
php -d extension=pdo_sqlite -d extension=sqlite3 vendor/bin/pest --compact tests/Feature/IssueIndexLayoutTest.php
~~~

Expected: FAIL because the current table is \`min-w-[1040px]\` without \`table-fixed\`, and the row still renders \`issue.description\`.

- [ ] **Step 3: Commit the red presentation test**

~~~text
git add tests/Feature/IssueIndexLayoutTest.php
git commit -m "test: lock compact issue index presentation"
~~~

### Task 2: Make the Issue index table compact

**Files:**
- Modify: \`resources/js/pages/issues/index.tsx\`
- Test: \`tests/Feature/IssueIndexLayoutTest.php\`

**Interfaces:**
- Consumes: The failing source assertions from Task 1.
- Produces: A bounded \`table-fixed\` Issue table whose Issue cell contains only a truncated detail link.

- [ ] **Step 1: Change the table contract**

Replace:

~~~tsx
<Table className="min-w-[1040px]">
~~~

with:

~~~tsx
<Table className="min-w-[980px] table-fixed">
~~~

Add controlled width classes to the six header cells so the fixed table has a predictable scan order:

~~~tsx
<TableHead className="h-10 w-[23%] text-xs font-medium text-muted-foreground">
    Sistem
</TableHead>
<TableHead className="h-10 w-[29%] text-xs font-medium text-muted-foreground">
    Issue
</TableHead>
<TableHead className="h-10 w-[12%] text-xs font-medium text-muted-foreground">
    Prioritas
</TableHead>
<TableHead className="h-10 w-[16%] text-xs font-medium text-muted-foreground">
    Waktu Lapor
</TableHead>
<TableHead className="h-10 w-[12%] text-xs font-medium text-muted-foreground">
    Status
</TableHead>
<TableHead className="h-10 w-[8%] text-right text-xs font-medium text-muted-foreground">
    Aksi
</TableHead>
~~~

- [ ] **Step 2: Remove description rendering and preserve the detail link**

Replace the Issue cell with:

~~~tsx
<TableCell className="min-w-0 whitespace-normal">
    <div className="min-w-0">
        <Link
            href={'/issues/' + issue.id}
            className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
        >
            {issue.title}
        </Link>
    </div>
</TableCell>
~~~

Do not remove \`description\` from the \`Issue\` TypeScript interface or alter the search input copy; the backend still searches the hidden description field and the detail page remains the full-reading surface.

- [ ] **Step 3: Run the focused presentation test**

~~~text
php -d extension=pdo_sqlite -d extension=sqlite3 vendor/bin/pest --compact tests/Feature/IssueIndexLayoutTest.php
~~~

Expected: PASS with the compact table and no description render.

- [ ] **Step 4: Format and commit the UI change**

~~~text
npx prettier --write resources/js/pages/issues/index.tsx
npx prettier --check resources/js/pages/issues/index.tsx
git diff --check
git add resources/js/pages/issues/index.tsx
git commit -m "fix: compact issue index table"
~~~

### Task 3: Verify frontend behavior and scope

**Files:**
- Verify: \`resources/js/pages/issues/index.tsx\`
- Verify: \`tests/Feature/IssueIndexLayoutTest.php\`

**Interfaces:**
- Consumes: The compact Issue table from Task 2.
- Produces: Fresh evidence that the page compiles and only the approved surface changed.

- [ ] **Step 1: Run the presentation and responsive-related tests**

~~~text
php -d extension=pdo_sqlite -d extension=sqlite3 vendor/bin/pest --compact tests/Feature/IssueIndexLayoutTest.php tests/Feature/ResponsiveLayoutTest.php
~~~

Expected: all selected tests pass.

- [ ] **Step 2: Run TypeScript and production build checks**

~~~text
npm run types:check
npm run build
~~~

Expected: TypeScript completes with no errors and Vite finishes with a successful production build.

- [ ] **Step 3: Verify the final diff is scoped**

~~~text
git diff --check
git status --short
git diff --name-only HEAD~2..HEAD
~~~

Expected: the worktree is clean and the implementation commits contain only \`resources/js/pages/issues/index.tsx\` and \`tests/Feature/IssueIndexLayoutTest.php\`; the approved spec and plan remain separate documentation commits.

- [ ] **Step 4: Review the contract before reporting completion**

Confirm:

~~~text
The row no longer renders issue.description.
The full Issue type still contains description for search/detail contracts.
The table uses table-fixed and min-w-[980px].
Long titles are block-level truncated links.
No backend or shared Table component changed.
~~~

