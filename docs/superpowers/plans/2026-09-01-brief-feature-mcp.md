# Brief Feature MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe MCP tools that list active projects and atomically create confirmed batches of Brief Features without duplicates.

**Architecture:** Keep the existing deployed-project lookup unchanged and add a dedicated read-only lookup for Brief Feature targets. A separate bulk-write tool validates and normalizes the full payload, serializes imports per project with a cache lock, rechecks project eligibility inside a database transaction, skips existing project/name pairs, and returns an environment-labelled result.

**Tech Stack:** PHP 8.3, Laravel 13, Laravel MCP 0.9, Eloquent, Laravel Cache locks, Pest 4.

## Global Constraints

- Eligible project statuses are exactly `planning`, `in_progress`, `deployed_running`, and `deployed_maintenance`.
- `on_hold` and `completed_pending_deployment` projects must be rejected.
- A request contains 1 to 100 Brief Features and writes atomically.
- Brief Feature names are compared per project after trimming, collapsing whitespace, and case-folding.
- Existing project/name pairs return `existing`; duplicates inside one payload reject the request.
- Status accepts `todo`, `in_progress`, or `done` and defaults to `todo`.
- Every write requires `confirmed=true` and reports the Laravel environment.
- Existing Issue and Feature Request MCP behavior must not change.
- Do not add a migration or dependency.

---

### Task 1: List active Brief Feature projects

**Files:**
- Create: `app/Mcp/Tools/ListBriefFeatureProjectsTool.php`
- Modify: `tests/Feature/Mcp/ProjectTrackerServerTest.php`

**Interfaces:**
- Consumes: `App\Enums\ProjectStatus`, `App\Models\Project`, and Laravel MCP `Request` / `Response`.
- Produces: `ListBriefFeatureProjectsTool::handle(Request): Response`, exposed as `list-brief-feature-projects`.

- [ ] **Step 1: Write the failing eligibility test**

Add the import and test below to `tests/Feature/Mcp/ProjectTrackerServerTest.php`:

```php
use App\Mcp\Tools\ListBriefFeatureProjectsTool;

test('the MCP lists only projects eligible for brief features', function (): void {
    Project::factory()->planning()->create(['name' => 'Alpha Planning']);
    Project::factory()->inProgress()->create(['name' => 'Bravo Development']);
    Project::factory()->deployedRunning()->create(['name' => 'Charlie Running']);
    Project::factory()->deployedMaintenance()->create(['name' => 'Delta Maintenance']);
    Project::factory()->onHold()->create(['name' => 'Echo On Hold']);
    Project::factory()->completedPendingDeployment()->create(['name' => 'Foxtrot Pending Deploy']);

    $response = ProjectTrackerServer::tool(ListBriefFeatureProjectsTool::class);

    $response
        ->assertOk()
        ->assertSee('"environment": "testing"')
        ->assertSee('Alpha Planning')
        ->assertSee('Bravo Development')
        ->assertSee('Charlie Running')
        ->assertSee('Delta Maintenance')
        ->assertDontSee('Echo On Hold')
        ->assertDontSee('Foxtrot Pending Deploy');
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
php artisan test --compact tests/Feature/Mcp/ProjectTrackerServerTest.php --filter="lists only projects eligible"
```

Expected: FAIL because `ListBriefFeatureProjectsTool` does not exist.

- [ ] **Step 3: Implement the read-only tool**

Create `app/Mcp/Tools/ListBriefFeatureProjectsTool.php` with:

```php
<?php

namespace App\Mcp\Tools;

use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Name('list-brief-feature-projects')]
#[Description('Lists active projects that may receive Brief Features.')]
#[IsReadOnly]
class ListBriefFeatureProjectsTool extends Tool
{
    public function handle(Request $request): Response
    {
        $projects = Project::query()
            ->whereIn('status', [
                ProjectStatus::Planning->value,
                ProjectStatus::InProgress->value,
                ProjectStatus::DeployedRunning->value,
                ProjectStatus::DeployedMaintenance->value,
            ])
            ->withCount('briefFeatures')
            ->orderBy('name')
            ->get(['id', 'name', 'status'])
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status->value,
                'brief_features_count' => $project->brief_features_count,
            ])
            ->all();

        return Response::text(json_encode([
            'environment' => app()->environment(),
            'projects' => $projects,
        ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }

    /** @return array<string, Type> */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run the Step 2 command.

Expected: PASS with 1 test.

### Task 2: Atomically create a Brief Feature batch

**Files:**
- Create: `app/Mcp/Tools/CreateBriefFeaturesTool.php`
- Modify: `tests/Feature/Mcp/ProjectTrackerServerTest.php`

**Interfaces:**
- Consumes: `Project`, `BriefFeature`, `BriefFeatureStatus`, Cache locks, and a validated MCP payload.
- Produces: `CreateBriefFeaturesTool::handle(Request): Response`, exposed as `create-tracker-brief-features`.

- [ ] **Step 1: Add failing tests for success, eligibility, idempotency, validation, confirmation, and rollback**

Add these imports:

```php
use App\Enums\BriefFeatureStatus;
use App\Enums\ProjectStatus;
use App\Mcp\Tools\CreateBriefFeaturesTool;
use App\Models\BriefFeature;
```

Add the following tests to `tests/Feature/Mcp/ProjectTrackerServerTest.php`:

```php
test('the MCP atomically creates a brief feature batch with supported statuses', function (): void {
    $project = Project::factory()->inProgress()->create();

    $response = ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => [
            ['name' => 'Authentication', 'description' => 'Login dan reset password.'],
            ['name' => 'Role Management', 'status' => 'in_progress'],
            ['name' => 'Audit Trail', 'status' => 'done'],
        ],
        'confirmed' => true,
    ]);

    $response
        ->assertOk()
        ->assertSee('"environment": "testing"')
        ->assertSee('"created_count": 3')
        ->assertSee('"existing_count": 0');

    expect(BriefFeature::where('name', 'Authentication')->sole()->status)->toBe(BriefFeatureStatus::Todo)
        ->and(BriefFeature::where('name', 'Role Management')->sole()->status)->toBe(BriefFeatureStatus::InProgress)
        ->and(BriefFeature::where('name', 'Audit Trail')->sole()->status)->toBe(BriefFeatureStatus::Done)
        ->and(BriefFeature::where('name', 'Audit Trail')->sole()->completed_at)->not->toBeNull();
});

test('the MCP only creates brief features for active project statuses', function (): void {
    $eligibleStatuses = [
        ProjectStatus::Planning,
        ProjectStatus::InProgress,
        ProjectStatus::DeployedRunning,
        ProjectStatus::DeployedMaintenance,
    ];

    foreach ($eligibleStatuses as $index => $status) {
        $project = Project::factory()->create(['status' => $status]);

        ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
            'project_id' => $project->id,
            'features' => [['name' => "Eligible Feature {$index}"]],
            'confirmed' => true,
        ])->assertOk();
    }

    expect(BriefFeature::count())->toBe(4);

    foreach ([ProjectStatus::OnHold, ProjectStatus::CompletedPendingDeployment] as $index => $status) {
        $project = Project::factory()->create(['status' => $status]);

        ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
            'project_id' => $project->id,
            'features' => [['name' => "Rejected Feature {$index}"]],
            'confirmed' => true,
        ])->assertHasErrors(['project_id']);
    }

    expect(BriefFeature::count())->toBe(4);
});

test('existing brief feature names are skipped after case and whitespace normalization', function (): void {
    $project = Project::factory()->planning()->create();
    BriefFeature::factory()->create([
        'project_id' => $project->id,
        'name' => 'Role Management',
    ]);

    $response = ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => [
            ['name' => '  role   management  '],
            ['name' => 'Authentication'],
        ],
        'confirmed' => true,
    ]);

    $response
        ->assertOk()
        ->assertSee('"created_count": 1')
        ->assertSee('"existing_count": 1');

    expect(BriefFeature::where('project_id', $project->id)->count())->toBe(2);
});

test('the same normalized brief feature name is allowed in different projects', function (): void {
    $firstProject = Project::factory()->planning()->create();
    $secondProject = Project::factory()->inProgress()->create();

    foreach ([$firstProject, $secondProject] as $project) {
        ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
            'project_id' => $project->id,
            'features' => [['name' => 'Authentication']],
            'confirmed' => true,
        ])->assertOk();
    }

    expect(BriefFeature::where('name', 'Authentication')->count())->toBe(2);
});

test('duplicate names inside one brief feature payload reject the entire batch', function (): void {
    $project = Project::factory()->inProgress()->create();

    $response = ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => [
            ['name' => 'Audit Trail'],
            ['name' => ' audit   trail '],
        ],
        'confirmed' => true,
    ]);

    $response->assertHasErrors(['features']);
    expect(BriefFeature::count())->toBe(0);
});

test('brief feature MCP writes require confirmation and a valid bounded payload', function (): void {
    $project = Project::factory()->inProgress()->create();

    ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => [['name' => 'Authentication']],
        'confirmed' => false,
    ])->assertHasErrors(['confirmed']);

    ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => [],
        'confirmed' => true,
    ])->assertHasErrors(['features']);

    ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => array_fill(0, 101, ['name' => 'Repeated Input']),
        'confirmed' => true,
    ])->assertHasErrors(['features']);

    expect(BriefFeature::count())->toBe(0);
});

test('a failed brief feature insert rolls back the entire batch', function (): void {
    $project = Project::factory()->inProgress()->create();
    $createdCount = 0;

    BriefFeature::creating(function () use (&$createdCount): void {
        $createdCount++;

        if ($createdCount === 2) {
            throw new RuntimeException('Simulated brief feature failure.');
        }
    });

    $response = ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => [
            ['name' => 'Authentication'],
            ['name' => 'Audit Trail'],
        ],
        'confirmed' => true,
    ]);

    $response->assertHasErrors(['Simulated brief feature failure.']);
    expect(BriefFeature::count())->toBe(0);
});
```

- [ ] **Step 2: Run the new tests and confirm RED**

Run:

```bash
php artisan test --compact tests/Feature/Mcp/ProjectTrackerServerTest.php --filter="brief feature"
```

Expected: FAIL because `CreateBriefFeaturesTool` does not exist.

- [ ] **Step 3: Implement validation, normalization, locking, and transaction semantics**

Create `app/Mcp/Tools/CreateBriefFeaturesTool.php`. The implementation must:

```php
$validated = $request->validate([
    'project_id' => ['required', 'integer'],
    'features' => ['required', 'array', 'min:1', 'max:100'],
    'features.*.name' => ['required', 'string', 'max:255'],
    'features.*.description' => ['nullable', 'string'],
    'features.*.status' => ['nullable', Rule::enum(BriefFeatureStatus::class)],
    'confirmed' => ['required', 'accepted'],
]);
```

Normalize each name using `Str::squish`, build its comparison key with `Str::lower`, reject blank normalized names, and group keys to reject duplicates within the payload. Acquire a 10-second cache lock named `project-tracker:brief-features:project:{project_id}`.

Inside `DB::transaction`, reload the project using `lockForUpdate()` and constrain its status to the four eligible values. Throw a `ValidationException` on `project_id` when no eligible project is found. Load existing Brief Features once, key them by normalized name, and process input order:

```php
if ($existing !== null) {
    $records[] = $this->record('existing', $existing);
    continue;
}

$briefFeature = $project->briefFeatures()->create([
    'name' => $feature['name'],
    'description' => $feature['description'] ?? null,
    'status' => $feature['status'] ?? BriefFeatureStatus::Todo->value,
]);

$records[] = $this->record('created', $briefFeature);
```

Return JSON with `environment`, `project_id`, `created_count`, `existing_count`, and `records`. Release the cache lock in `finally`. When the lock cannot be acquired, return `Response::error` asking the caller to retry.

Define the MCP schema exactly as:

```php
return [
    'project_id' => $schema->integer()->description('Active tracker project ID.')->required(),
    'features' => $schema->array()
        ->items($schema->object([
            'name' => $schema->string()->description('Brief Feature name.')->required(),
            'description' => $schema->string()->description('Optional implementation scope.'),
            'status' => $schema->string()
                ->enum(array_column(BriefFeatureStatus::cases(), 'value'))
                ->default(BriefFeatureStatus::Todo->value),
        ])->withoutAdditionalProperties())
        ->min(1)
        ->max(100)
        ->required(),
    'confirmed' => $schema->boolean()
        ->description('Must be true only after the user approves the preview.')
        ->required(),
];
```

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run the Step 2 command.

Expected: all Brief Feature MCP tests pass.

### Task 3: Register tools, publish workflow instructions, and verify transports

**Files:**
- Modify: `app/Mcp/Servers/ProjectTrackerServer.php`
- Modify: `tests/Feature/Mcp/ProjectTrackerServerTest.php`
- Modify: `tests/Feature/Mcp/ProjectTrackerRemoteServerTest.php`

**Interfaces:**
- Consumes: `ListBriefFeatureProjectsTool` and `CreateBriefFeaturesTool` from Tasks 1 and 2.
- Produces: both tools through the existing local `project-tracker-local` server and HTTPS `/mcp/project-tracker` endpoint.

- [ ] **Step 1: Write failing registration and remote-discovery tests**

Add this local registration test to `ProjectTrackerServerTest.php`:

```php
test('the project tracker MCP registers brief feature tools', function (): void {
    ProjectTrackerServer::post('tools/list')
        ->assertOk()
        ->assertSee('list-brief-feature-projects')
        ->assertSee('create-tracker-brief-features');
});
```

Add this payload helper and authenticated discovery test to `ProjectTrackerRemoteServerTest.php`:

```php
function mcpToolsListPayload(): array
{
    return [
        'jsonrpc' => '2.0',
        'id' => 2,
        'method' => 'tools/list',
        'params' => (object) [],
    ];
}

test('an authorized remote client can discover brief feature tools', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('Codex MCP', ['mcp:use'])->plainTextToken;

    $this->withToken($token)
        ->postJson('/mcp/project-tracker', mcpToolsListPayload())
        ->assertSuccessful()
        ->assertJsonFragment(['name' => 'list-brief-feature-projects'])
        ->assertJsonFragment(['name' => 'create-tracker-brief-features']);
});
```

- [ ] **Step 2: Run registration tests and confirm RED**

Run:

```bash
php artisan test --compact tests/Feature/Mcp/ProjectTrackerServerTest.php tests/Feature/Mcp/ProjectTrackerRemoteServerTest.php --filter="tools"
```

Expected: FAIL because the server has not registered the new tools.

- [ ] **Step 3: Register both tools and update server instructions**

Import both classes in `ProjectTrackerServer.php`, append them to `$tools`, and replace the instructions with guidance that preserves the existing GitHub workflow while adding:

```text
Use list-brief-feature-projects before creating Brief Features. Verify the
environment, show a preview, and call create-tracker-brief-features only after
explicit user confirmation.
```

- [ ] **Step 4: Run focused MCP tests and confirm GREEN**

Run:

```bash
php artisan test --compact tests/Feature/Mcp
```

Expected: all MCP tests pass.

- [ ] **Step 5: Format and statically analyze changed PHP files**

Run:

```bash
vendor/bin/pint --dirty --format agent
vendor/bin/phpstan analyse app/Mcp tests/Feature/Mcp --no-progress --debug
```

Expected: Pint exits 0 and PHPStan reports zero errors.

- [ ] **Step 6: Run regression verification**

Run:

```bash
php artisan test --compact
composer validate --strict
composer audit --no-interaction
git diff --check
```

Expected: full test suite passes, Composer configuration is valid, no security advisories are reported, and Git reports no whitespace errors.
