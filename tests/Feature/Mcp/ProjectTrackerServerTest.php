<?php

use App\Enums\BriefFeatureStatus;
use App\Enums\FeatureRequestStatus;
use App\Enums\IssueStatus;
use App\Enums\ProjectStatus;
use App\Mcp\Servers\ProjectTrackerServer;
use App\Mcp\Tools\CreateBriefFeaturesTool;
use App\Mcp\Tools\CreateFeatureRequestTool;
use App\Mcp\Tools\CreateIssueTool;
use App\Mcp\Tools\ListBriefFeatureProjectsTool;
use App\Mcp\Tools\ListProjectsTool;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\SlaConfig;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

beforeEach(function (): void {
    SlaConfig::updateOrCreate(['priority' => 'urgent'], ['target_resolution_hours' => 24]);
    SlaConfig::updateOrCreate(['priority' => 'normal'], ['target_resolution_hours' => 72]);
    SlaConfig::updateOrCreate(['priority' => 'low'], ['target_resolution_hours' => 168]);
});

afterEach(function (): void {
    Carbon::setTestNow();
});

test('the project tracker MCP only lists deployed projects', function (): void {
    $running = Project::factory()->deployedRunning()->create(['name' => 'Aplikasi Running']);
    $maintenance = Project::factory()->deployedMaintenance()->create(['name' => 'Aplikasi Maintenance']);
    Project::factory()->inProgress()->create(['name' => 'Aplikasi Development']);

    $response = ProjectTrackerServer::tool(ListProjectsTool::class);

    $response
        ->assertOk()
        ->assertSee('"environment": "testing"')
        ->assertSee('Aplikasi Running')
        ->assertSee('Aplikasi Maintenance')
        ->assertDontSee('Aplikasi Development');

    expect($running->exists)->toBeTrue()
        ->and($maintenance->exists)->toBeTrue();
});

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
        ])->assertHasErrors(['Project harus aktif']);
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

    $response->assertHasErrors(['nama Brief Feature duplikat']);
    expect(BriefFeature::count())->toBe(0);
});

test('brief feature MCP writes require confirmation and a valid bounded payload', function (): void {
    $project = Project::factory()->inProgress()->create();

    ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => [['name' => 'Authentication']],
        'confirmed' => false,
    ])->assertHasErrors(['Minta persetujuan pengguna']);

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

    ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => [
            ['name' => 'Authentication'],
            ['name' => '   '],
        ],
        'confirmed' => true,
    ])->assertHasErrors(['features']);

    ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'features' => [
            ['name' => 'Authentication'],
            ['name' => 'Audit Trail', 'status' => 'unknown'],
        ],
        'confirmed' => true,
    ])->assertHasErrors(['features.1.status']);

    expect(BriefFeature::count())->toBe(0);
});

test('a concurrent brief feature import for the same project is rejected', function (): void {
    $project = Project::factory()->inProgress()->create();
    $lock = Cache::lock("project-tracker:brief-features:project:{$project->id}", 10);
    $lock->get();

    try {
        $response = ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
            'project_id' => $project->id,
            'features' => [['name' => 'Authentication']],
            'confirmed' => true,
        ]);
    } finally {
        $lock->release();
    }

    $response->assertHasErrors(['sedang diproses']);
    expect(BriefFeature::count())->toBe(0);
});

test('a failed brief feature insert rolls back the entire batch', function (): void {
    $project = Project::factory()->inProgress()->create();
    $failureState = new class
    {
        public bool $enabled = true;

        public int $createdCount = 0;
    };

    BriefFeature::creating(function () use ($failureState): void {
        if (! $failureState->enabled) {
            return;
        }

        $failureState->createdCount++;

        if ($failureState->createdCount === 2) {
            throw new RuntimeException('Simulated brief feature failure.');
        }
    });

    try {
        $response = ProjectTrackerServer::tool(CreateBriefFeaturesTool::class, [
            'project_id' => $project->id,
            'features' => [
                ['name' => 'Authentication'],
                ['name' => 'Audit Trail'],
            ],
            'confirmed' => true,
        ]);
    } finally {
        $failureState->enabled = false;
    }

    $response->assertHasErrors(['Simulated brief feature failure.']);
    expect(BriefFeature::count())->toBe(0);
});

test('the project tracker MCP creates a resolved issue from a merged GitHub change', function (): void {
    Carbon::setTestNow('2026-08-31 12:00:00');
    $project = Project::factory()->deployedRunning()->create();

    $response = ProjectTrackerServer::tool(CreateIssueTool::class, [
        'project_id' => $project->id,
        'title' => 'Perbaiki kegagalan sinkronisasi stok',
        'description' => 'Sinkronisasi stok gagal ketika respons upstream kosong.',
        'priority' => 'urgent',
        'root_cause_category' => 'system_error',
        'reported_at' => '2026-08-28T09:00:00+07:00',
        'resolved_at' => '2026-08-28T15:00:00+07:00',
        'resolution_note' => 'Guard respons kosong ditambahkan dan sudah di-merge.',
        'source_url' => 'https://github.com/acme/inventory/pull/42',
        'confirmed' => true,
    ]);

    $response
        ->assertOk()
        ->assertSee('created')
        ->assertSee('"environment": "testing"');

    $issue = Issue::sole();

    expect($issue->status)->toBe(IssueStatus::Resolved)
        ->and($issue->project_id)->toBe($project->id)
        ->and($issue->due_date->toIso8601String())->toBe('2026-08-29T02:00:00+00:00')
        ->and($issue->resolved_at->toIso8601String())->toBe('2026-08-28T08:00:00+00:00')
        ->and($issue->is_on_time)->toBeTrue()
        ->and($issue->description)->toContain('https://github.com/acme/inventory/pull/42');
});

test('the project tracker MCP creates a fulfilled feature request from a merged GitHub change', function (): void {
    Carbon::setTestNow('2026-08-31 12:00:00');
    $project = Project::factory()->deployedMaintenance()->create();

    $response = ProjectTrackerServer::tool(CreateFeatureRequestTool::class, [
        'project_id' => $project->id,
        'title' => 'Tambahkan ekspor CSV',
        'description' => 'Pengguna sekarang dapat mengekspor daftar transaksi.',
        'priority' => 'normal',
        'requested_at' => '2026-08-20T08:00:00+07:00',
        'fulfilled_at' => '2026-08-22T10:00:00+07:00',
        'fulfillment_note' => 'Fitur telah dirilis melalui PR terkait.',
        'source_url' => 'https://github.com/acme/backoffice/pull/75',
        'confirmed' => true,
    ]);

    $response
        ->assertOk()
        ->assertSee('created')
        ->assertSee('"environment": "testing"');

    $featureRequest = FeatureRequest::sole();

    expect($featureRequest->status)->toBe(FeatureRequestStatus::Fulfilled)
        ->and($featureRequest->due_date->toIso8601String())->toBe('2026-08-23T01:00:00+00:00')
        ->and($featureRequest->fulfilled_at->toIso8601String())->toBe('2026-08-22T03:00:00+00:00')
        ->and($featureRequest->is_on_time)->toBeTrue()
        ->and($featureRequest->description)->toContain('https://github.com/acme/backoffice/pull/75');
});

test('repeating an MCP import with the same GitHub URL does not create a duplicate', function (): void {
    $project = Project::factory()->deployedRunning()->create();
    $arguments = [
        'project_id' => $project->id,
        'title' => 'Perbaiki halaman login',
        'description' => 'Perbaikan validasi login.',
        'priority' => 'normal',
        'root_cause_category' => 'system_error',
        'reported_at' => '2026-08-28T09:00:00+07:00',
        'source_url' => 'https://github.com/acme/app/issues/99',
        'confirmed' => true,
    ];

    ProjectTrackerServer::tool(CreateIssueTool::class, $arguments)->assertOk()->assertSee('created');
    ProjectTrackerServer::tool(CreateIssueTool::class, $arguments)->assertOk()->assertSee('existing');

    expect(Issue::count())->toBe(1);
});

test('GitHub URL variants resolve to the same imported record', function (): void {
    $project = Project::factory()->deployedRunning()->create();
    $arguments = [
        'project_id' => $project->id,
        'title' => 'Perbaiki halaman login',
        'description' => 'Perbaikan validasi login.',
        'priority' => 'normal',
        'root_cause_category' => 'system_error',
        'reported_at' => '2026-08-28T09:00:00+07:00',
        'source_url' => 'https://github.com/ACME/App/issues/99',
        'confirmed' => true,
    ];

    ProjectTrackerServer::tool(CreateIssueTool::class, $arguments)->assertOk()->assertSee('created');
    ProjectTrackerServer::tool(CreateIssueTool::class, [
        ...$arguments,
        'source_url' => 'https://github.com/acme/app/issues/99/?utm_source=tracker#details',
    ])->assertOk()->assertSee('existing');

    expect(Issue::count())->toBe(1)
        ->and(Issue::sole()->description)->toContain('Sumber GitHub: https://github.com/acme/app/issues/99');
});

test('source URL must identify a GitHub issue pull request or commit', function (): void {
    $project = Project::factory()->deployedRunning()->create();

    $response = ProjectTrackerServer::tool(CreateIssueTool::class, [
        'project_id' => $project->id,
        'title' => 'Sumber tidak spesifik',
        'description' => 'URL repository tidak cukup untuk idempotensi.',
        'priority' => 'normal',
        'root_cause_category' => 'other',
        'reported_at' => '2026-08-28T09:00:00+07:00',
        'source_url' => 'https://github.com/acme/app',
        'confirmed' => true,
    ]);

    $response->assertHasErrors(['source_url']);
    expect(Issue::count())->toBe(0);
});

test('the same GitHub URL cannot be imported as both an issue and a feature request', function (): void {
    $project = Project::factory()->deployedRunning()->create();
    Issue::factory()->create([
        'project_id' => $project->id,
        'description' => "Perbaikan login.\n\nSumber GitHub: https://github.com/acme/app/pull/99",
    ]);

    $response = ProjectTrackerServer::tool(CreateFeatureRequestTool::class, [
        'project_id' => $project->id,
        'title' => 'Tambahkan validasi login',
        'description' => 'Perubahan yang sama tidak boleh dicatat ulang.',
        'priority' => 'normal',
        'requested_at' => '2026-08-28T09:00:00+07:00',
        'source_url' => 'https://github.com/acme/app/pull/99',
        'confirmed' => true,
    ]);

    $response->assertHasErrors(['sudah tercatat sebagai issue']);
    expect(FeatureRequest::count())->toBe(0);
});

test('the same GitHub URL cannot be imported as an issue after a feature request', function (): void {
    $project = Project::factory()->deployedRunning()->create();
    FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'description' => "Validasi baru.\n\nSumber GitHub: https://github.com/acme/app/pull/100",
    ]);

    $response = ProjectTrackerServer::tool(CreateIssueTool::class, [
        'project_id' => $project->id,
        'title' => 'Perbaiki validasi login',
        'description' => 'Perubahan yang sama tidak boleh dicatat ulang.',
        'priority' => 'normal',
        'root_cause_category' => 'system_error',
        'reported_at' => '2026-08-28T09:00:00+07:00',
        'source_url' => 'https://github.com/acme/app/pull/100',
        'confirmed' => true,
    ]);

    $response->assertHasErrors(['sudah tercatat sebagai feature request']);
    expect(Issue::count())->toBe(0);
});

test('completed GitHub imports require a completion note', function (): void {
    $project = Project::factory()->deployedRunning()->create();

    $issueResponse = ProjectTrackerServer::tool(CreateIssueTool::class, [
        'project_id' => $project->id,
        'title' => 'Perbaiki validasi login',
        'description' => 'Perbaikan sudah di-merge.',
        'priority' => 'normal',
        'root_cause_category' => 'system_error',
        'reported_at' => '2026-08-28T09:00:00+07:00',
        'resolved_at' => '2026-08-28T10:00:00+07:00',
        'source_url' => 'https://github.com/acme/app/pull/101',
        'confirmed' => true,
    ]);

    $featureResponse = ProjectTrackerServer::tool(CreateFeatureRequestTool::class, [
        'project_id' => $project->id,
        'title' => 'Tambahkan filter baru',
        'description' => 'Fitur sudah di-merge.',
        'priority' => 'normal',
        'requested_at' => '2026-08-28T09:00:00+07:00',
        'fulfilled_at' => '2026-08-28T10:00:00+07:00',
        'source_url' => 'https://github.com/acme/app/pull/102',
        'confirmed' => true,
    ]);

    $issueResponse->assertHasErrors(['resolution_note']);
    $featureResponse->assertHasErrors(['fulfillment_note']);
    expect(Issue::count())->toBe(0)
        ->and(FeatureRequest::count())->toBe(0);
});

test('a failed issue completion does not leave a partial open import', function (): void {
    $project = Project::factory()->deployedRunning()->create();
    $failureState = new class
    {
        public bool $enabled = true;
    };

    Issue::updating(function () use ($failureState): void {
        if ($failureState->enabled) {
            throw new RuntimeException('Simulated issue completion failure.');
        }
    });

    try {
        $response = ProjectTrackerServer::tool(CreateIssueTool::class, [
            'project_id' => $project->id,
            'title' => 'Perbaiki sinkronisasi',
            'description' => 'Perbaikan merged harus atomik.',
            'priority' => 'normal',
            'root_cause_category' => 'system_error',
            'reported_at' => '2026-08-28T09:00:00+07:00',
            'resolved_at' => '2026-08-28T10:00:00+07:00',
            'resolution_note' => 'Perbaikan telah di-merge.',
            'source_url' => 'https://github.com/acme/app/pull/103',
            'confirmed' => true,
        ]);
    } finally {
        $failureState->enabled = false;
    }

    $response->assertHasErrors(['Simulated issue completion failure.']);
    expect(Issue::count())->toBe(0);
});

test('a failed feature completion does not leave a partial open import', function (): void {
    $project = Project::factory()->deployedRunning()->create();
    $failureState = new class
    {
        public bool $enabled = true;
    };

    FeatureRequest::updating(function () use ($failureState): void {
        if ($failureState->enabled) {
            throw new RuntimeException('Simulated feature completion failure.');
        }
    });

    try {
        $response = ProjectTrackerServer::tool(CreateFeatureRequestTool::class, [
            'project_id' => $project->id,
            'title' => 'Tambahkan ekspor',
            'description' => 'Feature merged harus atomik.',
            'priority' => 'normal',
            'requested_at' => '2026-08-28T09:00:00+07:00',
            'fulfilled_at' => '2026-08-28T10:00:00+07:00',
            'fulfillment_note' => 'Feature telah di-merge.',
            'source_url' => 'https://github.com/acme/app/pull/104',
            'confirmed' => true,
        ]);
    } finally {
        $failureState->enabled = false;
    }

    $response->assertHasErrors(['Simulated feature completion failure.']);
    expect(FeatureRequest::count())->toBe(0);
});

test('MCP writes require explicit confirmation', function (): void {
    $project = Project::factory()->deployedRunning()->create();

    $response = ProjectTrackerServer::tool(CreateFeatureRequestTool::class, [
        'project_id' => $project->id,
        'title' => 'Tambahkan filter baru',
        'description' => 'Filter baru dari GitHub.',
        'priority' => 'low',
        'requested_at' => '2026-08-28T09:00:00+07:00',
        'source_url' => 'https://github.com/acme/app/pull/100',
        'confirmed' => false,
    ]);

    $response->assertHasErrors();
    expect(FeatureRequest::count())->toBe(0);
});

test('feature requests cannot be imported into a project that is not deployed', function (): void {
    $project = Project::factory()->inProgress()->create();

    $response = ProjectTrackerServer::tool(CreateFeatureRequestTool::class, [
        'project_id' => $project->id,
        'title' => 'Tambahkan filter baru',
        'description' => 'Filter baru dari GitHub.',
        'priority' => 'low',
        'requested_at' => '2026-08-28T09:00:00+07:00',
        'source_url' => 'https://github.com/acme/app/pull/101',
        'confirmed' => true,
    ]);

    $response->assertHasErrors();
    expect(FeatureRequest::count())->toBe(0);
});
