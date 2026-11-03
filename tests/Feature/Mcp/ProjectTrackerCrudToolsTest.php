<?php

use App\Enums\Priority;
use App\Enums\ProjectStatus;
use App\Enums\RootCauseCategory;
use App\Mcp\Servers\ProjectTrackerServer;
use App\Mcp\Tools\CreateFeatureRequestRecordTool;
use App\Mcp\Tools\CreateIssueRecordTool;
use App\Mcp\Tools\CreateProjectTool;
use App\Mcp\Tools\DeleteBriefFeatureTool;
use App\Mcp\Tools\DeleteFeatureRequestTool;
use App\Mcp\Tools\DeleteIssueTool;
use App\Mcp\Tools\DeleteProjectTool;
use App\Mcp\Tools\GetBriefFeatureTool;
use App\Mcp\Tools\GetFeatureRequestTool;
use App\Mcp\Tools\GetIssueTool;
use App\Mcp\Tools\GetProjectTool;
use App\Mcp\Tools\ListAllProjectsTool;
use App\Mcp\Tools\ListBriefFeaturesTool;
use App\Mcp\Tools\ListFeatureRequestsTool;
use App\Mcp\Tools\ListIssuesTool;
use App\Mcp\Tools\UpdateBriefFeatureTool;
use App\Mcp\Tools\UpdateFeatureRequestTool;
use App\Mcp\Tools\UpdateIssueTool;
use App\Mcp\Tools\UpdateProjectTool;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\SlaConfig;
use App\Models\User;
use Carbon\Carbon;

afterEach(function (): void {
    Carbon::setTestNow();
});

beforeEach(function (): void {
    SlaConfig::updateOrCreate(['priority' => Priority::Urgent], ['target_resolution_hours' => 24]);
    SlaConfig::updateOrCreate(['priority' => Priority::Normal], ['target_resolution_hours' => 72]);
    SlaConfig::updateOrCreate(['priority' => Priority::Low], ['target_resolution_hours' => 168]);
});

test('the MCP lists every project lifecycle status with pagination metadata', function (): void {
    $projects = [
        Project::factory()->planning()->create(['name' => 'Alpha Planning']),
        Project::factory()->inProgress()->create(['name' => 'Bravo In Progress']),
        Project::factory()->onHold()->create(['name' => 'Charlie On Hold']),
        Project::factory()->completedPendingDeployment()->create(['name' => 'Delta Pending']),
        Project::factory()->deployedRunning()->create(['name' => 'Echo Running']),
        Project::factory()->deployedMaintenance()->create(['name' => 'Foxtrot Maintenance']),
    ];

    $response = ProjectTrackerServer::tool(ListAllProjectsTool::class, [
        'per_page' => 20,
        'page' => 1,
    ]);

    $response
        ->assertOk()
        ->assertSee('"environment": "testing"')
        ->assertSee('"total": 6')
        ->assertSee('Alpha Planning')
        ->assertSee('Bravo In Progress')
        ->assertSee('Charlie On Hold')
        ->assertSee('Delta Pending')
        ->assertSee('Echo Running')
        ->assertSee('Foxtrot Maintenance');

    expect($projects)->toHaveCount(6);
});

test('the MCP creates a project as the authenticated user and requires confirmation', function (): void {
    $user = User::factory()->admin()->create();

    ProjectTrackerServer::actingAs($user)->tool(CreateProjectTool::class, [
        'name' => 'New Inventory App',
        'description' => 'Stock visibility for the warehouse team.',
        'status' => ProjectStatus::Planning->value,
        'start_date' => '2026-11-01',
        'target_end_date' => '2027-02-01',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('New Inventory App')
        ->assertSee('"created_by": '.$user->id);

    expect(Project::query()->where('name', 'New Inventory App')->sole()->created_by)->toBe($user->id);

    ProjectTrackerServer::actingAs($user)->tool(CreateProjectTool::class, [
        'name' => 'Unconfirmed Project',
        'status' => ProjectStatus::Planning->value,
        'confirmed' => false,
    ])->assertHasErrors(['Minta persetujuan pengguna sebelum membuat project']);

    expect(Project::query()->where('name', 'Unconfirmed Project')->exists())->toBeFalse();
});

test('the MCP compares project dates as calendar dates when creating a project', function (): void {
    $user = User::factory()->admin()->create();

    ProjectTrackerServer::actingAs($user)->tool(CreateProjectTool::class, [
        'name' => 'Date Format Project',
        'status' => ProjectStatus::Planning->value,
        'start_date' => '2026-2-15',
        'target_end_date' => '2026-10-01',
        'confirmed' => true,
    ])->assertOk();

    $project = Project::query()->where('name', 'Date Format Project')->sole();

    expect($project->start_date?->toDateString())->toBe('2026-02-15')
        ->and($project->target_end_date?->toDateString())->toBe('2026-10-01');
});

test('the MCP updates project details and fills actual end date when deployed', function (): void {
    Carbon::setTestNow('2026-11-03 10:00:00');
    $project = Project::factory()->inProgress()->create([
        'actual_end_date' => null,
    ]);

    ProjectTrackerServer::tool(UpdateProjectTool::class, [
        'project_id' => $project->id,
        'name' => 'Unconfirmed Inventory Platform',
        'confirmed' => false,
    ])->assertHasErrors();

    expect($project->refresh()->name)->not->toBe('Unconfirmed Inventory Platform');

    $response = ProjectTrackerServer::tool(UpdateProjectTool::class, [
        'project_id' => $project->id,
        'name' => 'Inventory Platform',
        'status' => ProjectStatus::DeployedRunning->value,
        'confirmed' => true,
    ]);

    $response
        ->assertOk()
        ->assertSee('Inventory Platform')
        ->assertSee('"status": "deployed_running"')
        ->assertSee('2026-11-03');

    expect($project->refresh()->actual_end_date?->toDateString())->toBe('2026-11-03');
});

test('the MCP manages project assignments without exposing user management', function (): void {
    $creator = User::factory()->admin()->create();
    $firstAssignee = User::factory()->create();
    $secondAssignee = User::factory()->create();

    ProjectTrackerServer::actingAs($creator)->tool(CreateProjectTool::class, [
        'name' => 'Assigned Inventory App',
        'status' => ProjectStatus::Planning->value,
        'user_ids' => [$firstAssignee->id],
        'confirmed' => true,
    ])->assertOk();

    $project = Project::query()->where('name', 'Assigned Inventory App')->sole();

    expect($project->users()->pluck('users.id')->all())->toBe([$firstAssignee->id]);

    ProjectTrackerServer::tool(UpdateProjectTool::class, [
        'project_id' => $project->id,
        'user_ids' => [$secondAssignee->id],
        'confirmed' => true,
    ])->assertOk();

    expect($project->users()->pluck('users.id')->all())->toBe([$secondAssignee->id]);

    ProjectTrackerServer::tool(GetProjectTool::class, [
        'project_id' => $project->id,
    ])
        ->assertOk()
        ->assertSee('"assigned_user_ids"')
        ->assertSee((string) $secondAssignee->id);
});

test('the MCP requires confirmation before deleting a project and reports cascading effects', function (): void {
    $project = Project::factory()->deployedRunning()->create();
    $briefFeature = BriefFeature::factory()->for($project)->create();
    $featureRequest = FeatureRequest::factory()->create(['project_id' => $project->id]);
    $issue = Issue::factory()->create(['project_id' => $project->id]);

    ProjectTrackerServer::tool(DeleteProjectTool::class, [
        'project_id' => $project->id,
        'confirmed' => false,
    ])->assertHasErrors(['Tampilkan dampak penghapusan']);

    expect($project->exists)->toBeTrue();

    $response = ProjectTrackerServer::tool(DeleteProjectTool::class, [
        'project_id' => $project->id,
        'confirmed' => true,
    ]);

    $response
        ->assertOk()
        ->assertSee('"brief_features_deleted": 1')
        ->assertSee('"feature_requests_deleted": 1')
        ->assertSee('"issues_unlinked": 1');

    expect(Project::query()->whereKey($project->id)->exists())->toBeFalse()
        ->and(BriefFeature::query()->whereKey($briefFeature->id)->exists())->toBeFalse()
        ->and(FeatureRequest::query()->whereKey($featureRequest->id)->exists())->toBeFalse()
        ->and($issue->refresh()->project_id)->toBeNull();
});

test('the MCP project detail reports lifecycle, realization and related-record counts', function (): void {
    $project = Project::factory()->deployedRunning()->create([
        'name' => 'Inventory System',
    ]);

    BriefFeature::factory()->for($project)->done()->create(['name' => 'Stock intake']);
    BriefFeature::factory()->for($project)->todo()->create(['name' => 'Stock transfer']);
    Issue::factory()->create(['project_id' => $project->id]);
    FeatureRequest::factory()->create(['project_id' => $project->id]);

    $response = ProjectTrackerServer::tool(GetProjectTool::class, [
        'project_id' => $project->id,
    ]);

    $response
        ->assertOk()
        ->assertSee('"environment": "testing"')
        ->assertSee('"name": "Inventory System"')
        ->assertSee('"status": "deployed_running"')
        ->assertSee('"realization_percentage": 50')
        ->assertSee('"brief_features_count": 2')
        ->assertSee('"issues_count": 1')
        ->assertSee('"feature_requests_count": 1');
});

test('the MCP reports legacy deployed projects without brief features as fully realized', function (): void {
    $runningProject = Project::factory()->deployedRunning()->create([
        'name' => 'Legacy Running System',
    ]);
    $maintenanceProject = Project::factory()->deployedMaintenance()->create([
        'name' => 'Legacy Maintenance System',
    ]);

    foreach ([$runningProject, $maintenanceProject] as $project) {
        ProjectTrackerServer::tool(GetProjectTool::class, [
            'project_id' => $project->id,
        ])
            ->assertOk()
            ->assertSee('"realization_percentage": 100');
    }

    ProjectTrackerServer::tool(ListAllProjectsTool::class, [
        'per_page' => 20,
        'page' => 1,
    ])
        ->assertOk()
        ->assertSee('Legacy Running System')
        ->assertSee('Legacy Maintenance System')
        ->assertSee('"realization_percentage": 100');
});

test('the MCP lists and returns brief feature details with project context', function (): void {
    $project = Project::factory()->inProgress()->create(['name' => 'Warehouse App']);
    $otherProject = Project::factory()->planning()->create(['name' => 'Finance App']);
    $briefFeature = BriefFeature::factory()->for($project)->done()->create([
        'name' => 'Inventory reconciliation',
        'description' => 'Match stock counts against the ledger.',
    ]);
    BriefFeature::factory()->for($project)->todo()->create(['name' => 'Transfer workflow']);
    BriefFeature::factory()->for($otherProject)->create(['name' => 'Invoice review']);

    $listResponse = ProjectTrackerServer::tool(ListBriefFeaturesTool::class, [
        'project_id' => $project->id,
        'per_page' => 20,
    ]);

    $listResponse
        ->assertOk()
        ->assertSee('"total": 2')
        ->assertSee('Inventory reconciliation')
        ->assertSee('Transfer workflow')
        ->assertDontSee('Invoice review');

    ProjectTrackerServer::tool(GetBriefFeatureTool::class, [
        'brief_feature_id' => $briefFeature->id,
    ])
        ->assertOk()
        ->assertSee('"environment": "testing"')
        ->assertSee('Inventory reconciliation')
        ->assertSee('Warehouse App')
        ->assertSee('"completed_at"');
});

test('the MCP updates brief feature fields and completion lifecycle after confirmation', function (): void {
    $briefFeature = BriefFeature::factory()->todo()->create([
        'name' => 'Inventory reconciliation',
    ]);

    ProjectTrackerServer::tool(UpdateBriefFeatureTool::class, [
        'brief_feature_id' => $briefFeature->id,
        'name' => 'Unconfirmed stock reconciliation',
        'confirmed' => false,
    ])->assertHasErrors();

    expect($briefFeature->refresh()->name)->toBe('Inventory reconciliation');

    ProjectTrackerServer::tool(UpdateBriefFeatureTool::class, [
        'brief_feature_id' => $briefFeature->id,
        'name' => 'Stock reconciliation',
        'description' => 'Compare current stock with the ledger.',
        'status' => 'done',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('Stock reconciliation')
        ->assertSee('"status": "done"');

    expect($briefFeature->refresh()->completed_at)->not->toBeNull();

    ProjectTrackerServer::tool(UpdateBriefFeatureTool::class, [
        'brief_feature_id' => $briefFeature->id,
        'status' => 'in_progress',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"completed_at": null');

    expect($briefFeature->refresh()->completed_at)->toBeNull();
});

test('the MCP deletes a brief feature only after confirmation', function (): void {
    $briefFeature = BriefFeature::factory()->create();

    ProjectTrackerServer::tool(DeleteBriefFeatureTool::class, [
        'brief_feature_id' => $briefFeature->id,
        'confirmed' => false,
    ])->assertHasErrors();

    expect($briefFeature->exists)->toBeTrue();

    ProjectTrackerServer::tool(DeleteBriefFeatureTool::class, [
        'brief_feature_id' => $briefFeature->id,
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"result": "deleted"');

    expect(BriefFeature::query()->whereKey($briefFeature->id)->exists())->toBeFalse();
});

test('the MCP lists and returns issue details with project context', function (): void {
    $project = Project::factory()->deployedRunning()->create(['name' => 'Inventory App']);
    $issue = Issue::factory()->create([
        'project_id' => $project->id,
        'title' => 'Stock count mismatch',
        'description' => 'The daily count differs from the ledger.',
    ]);
    Issue::factory()->create(['title' => 'Unrelated stock issue']);

    ProjectTrackerServer::tool(ListIssuesTool::class, [
        'project_id' => $project->id,
        'status' => 'open',
        'per_page' => 20,
    ])
        ->assertOk()
        ->assertSee('"total": 1')
        ->assertSee('Stock count mismatch')
        ->assertDontSee('Unrelated stock issue');

    ProjectTrackerServer::tool(GetIssueTool::class, [
        'issue_id' => $issue->id,
    ])
        ->assertOk()
        ->assertSee('Stock count mismatch')
        ->assertSee('The daily count differs from the ledger.')
        ->assertSee('Inventory App');
});

test('the MCP creates manual issues and calculates their SLA deadline', function (): void {
    Carbon::setTestNow('2026-11-03 12:00:00+07:00');
    $project = Project::factory()->deployedMaintenance()->create();

    ProjectTrackerServer::tool(CreateIssueRecordTool::class, [
        'project_id' => $project->id,
        'title' => 'Supplier sync failed',
        'description' => 'The nightly integration returned an error.',
        'priority' => Priority::Urgent->value,
        'root_cause_category' => RootCauseCategory::SystemError->value,
        'reported_at' => '2026-11-02T10:00:00+07:00',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('Supplier sync failed')
        ->assertSee('"status": "open"');

    $issue = Issue::query()->where('title', 'Supplier sync failed')->sole();

    expect($issue->due_date->equalTo(Carbon::parse('2026-11-03T10:00:00+07:00')))->toBeTrue();
});

test('the MCP updates issue fields, recalculates SLA, resolves and reopens the issue', function (): void {
    Carbon::setTestNow('2026-11-03 12:00:00+07:00');
    $issue = Issue::factory()->create([
        'title' => 'Original title',
        'reported_at' => '2026-11-01T10:00:00+07:00',
    ]);

    ProjectTrackerServer::tool(UpdateIssueTool::class, [
        'issue_id' => $issue->id,
        'title' => 'Unconfirmed issue update',
        'confirmed' => false,
    ])->assertHasErrors();

    expect($issue->refresh()->title)->toBe('Original title');

    ProjectTrackerServer::tool(UpdateIssueTool::class, [
        'issue_id' => $issue->id,
        'title' => 'Resolved integration issue',
        'priority' => Priority::Urgent->value,
        'reported_at' => '2026-11-02T10:00:00+07:00',
        'status' => 'resolved',
        'resolved_at' => '2026-11-03T09:00:00+07:00',
        'resolution_note' => 'Restarted the integration service.',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"status": "resolved"')
        ->assertSee('"is_on_time": true');

    expect($issue->refresh()->due_date->equalTo(Carbon::parse('2026-11-03T10:00:00+07:00')))->toBeTrue();

    ProjectTrackerServer::tool(UpdateIssueTool::class, [
        'issue_id' => $issue->id,
        'status' => 'open',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"resolved_at": null')
        ->assertSee('"is_on_time": null');

    expect($issue->refresh()->status->value)->toBe('open')
        ->and($issue->resolved_at)->toBeNull()
        ->and($issue->is_on_time)->toBeNull();
});

test('clearing a resolved issue timestamp reopens it when status is omitted', function (): void {
    $issue = Issue::factory()->resolved()->create();

    ProjectTrackerServer::tool(UpdateIssueTool::class, [
        'issue_id' => $issue->id,
        'resolved_at' => null,
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"status": "open"')
        ->assertSee('"resolved_at": null');

    expect($issue->refresh()->status->value)->toBe('open')
        ->and($issue->resolved_at)->toBeNull()
        ->and($issue->is_on_time)->toBeNull();
});

test('the MCP deletes issues only after confirmation', function (): void {
    $issue = Issue::factory()->create();

    ProjectTrackerServer::tool(DeleteIssueTool::class, [
        'issue_id' => $issue->id,
        'confirmed' => false,
    ])->assertHasErrors();

    expect($issue->exists)->toBeTrue();

    ProjectTrackerServer::tool(DeleteIssueTool::class, [
        'issue_id' => $issue->id,
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"result": "deleted"');

    expect(Issue::query()->whereKey($issue->id)->exists())->toBeFalse();
});

test('the MCP lists and returns feature request details with project context', function (): void {
    $project = Project::factory()->deployedRunning()->create(['name' => 'Finance Portal']);
    $featureRequest = FeatureRequest::factory()->create([
        'project_id' => $project->id,
        'title' => 'Invoice export',
        'description' => 'Add CSV export for monthly invoices.',
    ]);
    FeatureRequest::factory()->create(['title' => 'Unrelated request']);

    ProjectTrackerServer::tool(ListFeatureRequestsTool::class, [
        'project_id' => $project->id,
        'status' => 'open',
        'per_page' => 20,
    ])
        ->assertOk()
        ->assertSee('"total": 1')
        ->assertSee('Invoice export')
        ->assertDontSee('Unrelated request');

    ProjectTrackerServer::tool(GetFeatureRequestTool::class, [
        'feature_request_id' => $featureRequest->id,
    ])
        ->assertOk()
        ->assertSee('Invoice export')
        ->assertSee('Add CSV export for monthly invoices.')
        ->assertSee('Finance Portal');
});

test('the MCP creates manual feature requests with their SLA deadline', function (): void {
    $project = Project::factory()->deployedRunning()->create();

    ProjectTrackerServer::tool(CreateFeatureRequestRecordTool::class, [
        'project_id' => $project->id,
        'title' => 'Invoice export',
        'description' => 'Add CSV export for monthly invoices.',
        'priority' => Priority::Normal->value,
        'requested_at' => '2026-11-01T10:00:00+07:00',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('Invoice export')
        ->assertSee('"status": "open"');

    $featureRequest = FeatureRequest::query()->where('title', 'Invoice export')->sole();

    expect($featureRequest->due_date->equalTo(Carbon::parse('2026-11-04T10:00:00+07:00')))->toBeTrue();
});

test('the MCP creates an already fulfilled feature request after calculating its SLA', function (): void {
    Carbon::setTestNow('2026-11-03 12:00:00+07:00');
    $project = Project::factory()->deployedRunning()->create();

    ProjectTrackerServer::tool(CreateFeatureRequestRecordTool::class, [
        'project_id' => $project->id,
        'title' => 'Completed export request',
        'description' => 'The CSV export is ready.',
        'priority' => Priority::Normal->value,
        'requested_at' => '2026-11-01T10:00:00+07:00',
        'status' => 'fulfilled',
        'fulfilled_at' => '2026-11-02T10:00:00+07:00',
        'fulfillment_note' => 'CSV export is now available.',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"status": "fulfilled"')
        ->assertSee('"is_on_time": true');

    $featureRequest = FeatureRequest::query()->where('title', 'Completed export request')->sole();

    expect($featureRequest->due_date->equalTo(Carbon::parse('2026-11-04T10:00:00+07:00')))->toBeTrue();
});

test('the MCP updates feature requests and completes or reopens them through status changes', function (): void {
    Carbon::setTestNow('2026-11-03 12:00:00+07:00');
    $featureRequest = FeatureRequest::factory()->create([
        'title' => 'Old invoice export',
        'requested_at' => '2026-11-01T10:00:00+07:00',
    ]);

    ProjectTrackerServer::tool(UpdateFeatureRequestTool::class, [
        'feature_request_id' => $featureRequest->id,
        'title' => 'Unconfirmed feature request update',
        'confirmed' => false,
    ])->assertHasErrors();

    expect($featureRequest->refresh()->title)->toBe('Old invoice export');

    ProjectTrackerServer::tool(UpdateFeatureRequestTool::class, [
        'feature_request_id' => $featureRequest->id,
        'title' => 'Invoice export',
        'priority' => Priority::Normal->value,
        'requested_at' => '2026-11-01T10:00:00+07:00',
        'status' => 'fulfilled',
        'fulfilled_at' => '2026-11-03T09:00:00+07:00',
        'fulfillment_note' => 'CSV export is now available.',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"status": "fulfilled"')
        ->assertSee('"is_on_time": true');

    ProjectTrackerServer::tool(UpdateFeatureRequestTool::class, [
        'feature_request_id' => $featureRequest->id,
        'status' => 'in_progress',
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"fulfilled_at": null')
        ->assertSee('"is_on_time": null');

    expect($featureRequest->refresh()->status->value)->toBe('in_progress')
        ->and($featureRequest->fulfilled_at)->toBeNull()
        ->and($featureRequest->is_on_time)->toBeNull();
});

test('clearing a feature request fulfillment timestamp reopens it when status is omitted', function (): void {
    $featureRequest = FeatureRequest::factory()->create();
    $featureRequest->fulfill('Request completed.', now()->toDateTimeString());
    $featureRequest->refresh();

    ProjectTrackerServer::tool(UpdateFeatureRequestTool::class, [
        'feature_request_id' => $featureRequest->id,
        'fulfilled_at' => null,
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"status": "in_progress"')
        ->assertSee('"fulfilled_at": null');

    expect($featureRequest->refresh()->status->value)->toBe('in_progress')
        ->and($featureRequest->fulfilled_at)->toBeNull()
        ->and($featureRequest->is_on_time)->toBeNull();
});

test('the MCP deletes feature requests only after confirmation', function (): void {
    $featureRequest = FeatureRequest::factory()->create();

    ProjectTrackerServer::tool(DeleteFeatureRequestTool::class, [
        'feature_request_id' => $featureRequest->id,
        'confirmed' => false,
    ])->assertHasErrors();

    expect($featureRequest->exists)->toBeTrue();

    ProjectTrackerServer::tool(DeleteFeatureRequestTool::class, [
        'feature_request_id' => $featureRequest->id,
        'confirmed' => true,
    ])
        ->assertOk()
        ->assertSee('"result": "deleted"');

    expect(FeatureRequest::query()->whereKey($featureRequest->id)->exists())->toBeFalse();
});
