<?php

use App\Actions\Reports\BuildActivityReportData;
use App\Actions\Reports\GenerateReportSnapshot;
use App\Enums\BriefFeatureStatus;
use App\Enums\IssueStatus;
use App\Enums\ProjectStatus;
use App\Models\BriefFeature;
use App\Models\FeatureRequest;
use App\Models\Issue;
use App\Models\Project;
use App\Models\ReportSnapshot;
use App\Models\User;
use App\Support\AppDateTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    Carbon::setTestNow('2026-07-30 12:00:00');
});

afterEach(function (): void {
    Carbon::setTestNow();
});

function activitySnapshot(string $start = '2026-07-26', string $end = '2026-08-01'): ReportSnapshot
{
    return app(GenerateReportSnapshot::class)->handle(
        AppDateTime::startOfBusinessDate($start),
        AppDateTime::endOfBusinessDate($end),
        ReportSnapshot::PeriodCustomRange,
    );
}

function activityData(ReportSnapshot $snapshot): array
{
    return app(BuildActivityReportData::class)->handle($snapshot);
}

test('activity snapshots count both events and entity qualified distinct items including a projectless issue', function (): void {
    $project = Project::factory()->create(['created_at' => '2026-07-01 00:00:00']);
    $issue = Issue::factory()->resolved()->create([
        'project_id' => null, 'reported_at' => '2026-07-27 01:00:00', 'resolved_at' => '2026-07-28 01:00:00',
        'resolution_note' => 'Restored service',
    ]);
    $request = FeatureRequest::factory()->fulfilled()->create([
        'due_date' => '2026-08-01 00:00:00',
        'project_id' => $project->id, 'requested_at' => '2026-07-27 01:00:00', 'fulfilled_at' => '2026-07-28 01:00:00',
    ]);

    $data = activityData(activitySnapshot());
    expect($data['activity_summary']['total_activities'])->toBe(4)
        ->and($data['activity_summary']['unique_items'])->toBe(2)
        ->and($data['activity_summary']['groups'])->toHaveCount(4)
        ->and($data['activity_summary']['groups'][0]['total_activities'])->toBe(0);
    $issues = collect($data['activities'])->where('entity_type', 'issue')->values();
    expect($issues)->toHaveCount(2)
        ->and($issues[0]['project_id'])->toBeNull()
        ->and($issues[0]['project_name'])->toBeNull()
        ->and($issues[0]['note'])->toBe('Restored service')
        ->and($issues[0]['activity_type'])->toBe('completed')
        ->and($issues[0]['occurred_at'])->toBe('2026-07-28T01:00:00+00:00');
    expect($data['activities'])->toEqual(activityData(activitySnapshot())['activities']);
});

test('activity collection includes old item completions and excludes inactive context and ordinary edits', function (): void {
    $project = Project::factory()->create(['name' => 'Context only', 'created_at' => '2026-06-01 00:00:00']);
    Issue::factory()->resolved()->create([
        'project_id' => $project->id, 'reported_at' => '2026-06-01 00:00:00', 'resolved_at' => '2026-07-27 00:00:00',
    ]);
    FeatureRequest::factory()->fulfilled()->create([
        'due_date' => '2026-08-01 00:00:00',
        'project_id' => $project->id, 'requested_at' => '2026-06-01 00:00:00', 'fulfilled_at' => '2026-07-28 00:00:00',
    ]);
    BriefFeature::factory()->done()->createQuietly([
        'project_id' => $project->id, 'created_at' => '2026-06-01 00:00:00', 'completed_at' => '2026-07-29 00:00:00',
    ]);
    BriefFeature::factory()->done()->createQuietly(['project_id' => $project->id, 'created_at' => '2026-06-01 00:00:00']);
    Issue::factory()->create(['project_id' => $project->id, 'reported_at' => '2026-06-01 00:00:00']);

    $data = activityData(activitySnapshot());
    expect($data['activity_summary']['total_activities'])->toBe(3)
        ->and(array_unique(array_column($data['activities'], 'activity_type')))->toBe(['completed'])
        ->and(array_unique(array_column($data['activities'], 'project_name')))->toBe(['Context only']);
});

test('project and brief creation and completion use their documented event dates', function (): void {
    $project = Project::factory()->completedPendingDeployment()->create([
        'created_at' => '2026-07-27 00:00:00', 'actual_end_date' => '2026-07-29',
    ]);
    BriefFeature::factory()->done()->createQuietly([
        'project_id' => $project->id, 'created_at' => '2026-07-27 00:00:00', 'completed_at' => '2026-07-28 00:00:00',
    ]);
    $data = activityData(activitySnapshot());
    expect($data['activity_summary']['total_activities'])->toBe(4)
        ->and($data['activity_summary']['unique_items'])->toBe(2)
        ->and($data['activities'][0]['occurred_at'])->toBe('2026-07-29')
        ->and($data['activities'][0]['activity_label'])->toBe('Development selesai')
        ->and($data['activity_summary']['groups'][0]['new_items'])->toBe(1)
        ->and($data['activity_summary']['groups'][0]['completed_items'])->toBe(1);
});

test('project completion accepts pending deployment and both deployed statuses only', function (ProjectStatus $status, int $expected): void {
    Project::factory()->create(['status' => $status, 'created_at' => '2026-06-01 00:00:00', 'actual_end_date' => '2026-07-29']);
    expect(activityData(activitySnapshot())['activity_summary']['total_activities'])->toBe($expected);
})->with([
    [ProjectStatus::CompletedPendingDeployment, 1], [ProjectStatus::DeployedRunning, 1],
    [ProjectStatus::DeployedMaintenance, 1], [ProjectStatus::InProgress, 0],
]);

test('timestamp events respect local Sunday boundary and captured generation cutoff', function (): void {
    $project = Project::factory()->create(['created_at' => '2026-06-01 00:00:00']);
    foreach (['2026-07-25 16:59:59', '2026-07-25 17:00:00', '2026-07-30 12:00:00', '2026-07-30 12:00:01', '2026-08-01 17:00:00'] as $date) {
        Issue::factory()->create(['project_id' => $project->id, 'reported_at' => $date]);
    }
    expect(activityData(activitySnapshot())['activity_summary']['total_activities'])->toBe(2)
        ->and(activityData(activitySnapshot('2026-07-31', '2026-08-01'))['activities'])->toBe([]);
});

test('future completion timestamps and future business dates are excluded even for complete statuses', function (): void {
    $project = Project::factory()->completedPendingDeployment()->create([
        'created_at' => '2026-06-01 00:00:00', 'actual_end_date' => '2026-07-31',
    ]);
    BriefFeature::factory()->done()->createQuietly(['project_id' => $project->id, 'created_at' => '2026-06-01 00:00:00', 'completed_at' => '2026-07-30 12:00:01']);
    Issue::factory()->resolved()->create(['project_id' => $project->id, 'reported_at' => '2026-06-01 00:00:00', 'resolved_at' => '2026-07-30 12:00:01']);
    FeatureRequest::factory()->fulfilled()->create([
        'due_date' => '2026-08-01 00:00:00', 'project_id' => $project->id, 'requested_at' => '2026-06-01 00:00:00', 'fulfilled_at' => '2026-07-30 12:00:01']);
    expect(activityData(activitySnapshot())['activities'])->toBe([]);
});

test('date only project completion uses business calendar date at UTC midnight crossover', function (): void {
    Carbon::setTestNow('2026-07-25 17:00:00');
    Project::factory()->deployedRunning()->create(['created_at' => '2026-06-01 00:00:00', 'actual_end_date' => '2026-07-26']);
    Project::factory()->deployedRunning()->create(['created_at' => '2026-06-01 00:00:00', 'actual_end_date' => '2026-07-25']);
    expect(activityData(activitySnapshot())['activity_summary']['total_activities'])->toBe(1);
});

test('reopened items and mismatched statuses do not reconstruct completion history', function (): void {
    $project = Project::factory()->create(['created_at' => '2026-06-01 00:00:00']);
    $issue = Issue::factory()->resolved()->create(['project_id' => $project->id, 'reported_at' => '2026-06-01 00:00:00']);
    $issue->update(['status' => IssueStatus::Open]);
    $request = FeatureRequest::factory()->fulfilled()->create([
        'due_date' => '2026-08-01 00:00:00', 'project_id' => $project->id, 'requested_at' => '2026-06-01 00:00:00']);
    $request->reopen();
    BriefFeature::factory()->create(['project_id' => $project->id, 'created_at' => '2026-06-01 00:00:00', 'status' => BriefFeatureStatus::Todo, 'completed_at' => '2026-07-27 00:00:00']);
    expect(activityData(activitySnapshot())['activities'])->toBe([]);
});

test('custom range activity snapshot remains unchanged after live source edits and deletions', function (): void {
    $project = Project::factory()->create(['created_at' => '2026-06-01 00:00:00', 'name' => 'Saved context']);
    $issue = Issue::factory()->resolved()->create(['project_id' => $project->id, 'title' => 'Saved title', 'reported_at' => '2026-06-01 00:00:00', 'resolved_at' => '2026-07-10 00:00:00']);
    $snapshot = activitySnapshot('2026-07-01', '2026-07-15');
    $saved = activityData($snapshot);
    $project->update(['name' => 'Changed context']);
    $issue->delete();
    expect(activityData($snapshot->fresh()))->toBe($saved)
        ->and($saved['activities'][0]['title'])->toBe('Saved title')
        ->and($saved['activities'][0]['project_name'])->toBe('Saved context');
});

test('new snapshots expose activity only summary and detail while legacy metadata stays version one', function (): void {
    $user = User::factory()->create();
    $legacy = ReportSnapshot::factory()->create(['okr2_issue_percentage' => 80]);
    $snapshot = activitySnapshot();
    $this->actingAs($user)->get('/reports')->assertInertia(fn ($page) => $page
        ->where('reports.0.format_version', 2)->where('reports.0.activity_summary.total_activities', 0)
        ->missing('reports.0.okr')->where('reports.1.format_version', 1)->where('reports.1.okr.issue_on_time', 80)
    );
    $this->get("/reports/{$snapshot->id}")->assertInertia(fn ($page) => $page
        ->where('report.format_version', 2)->where('report.activities', [])->has('report.activity_summary.groups', 4)
        ->missing('report.okr')->missing('report.breakdowns')
    );
    expect($legacy->format_version)->toBe(1);
});

test('manual report validation and guest access prevent snapshot writes', function (): void {
    $this->post('/reports', ['period_type' => 'weekly_default'])->assertRedirect('/login');
    $this->get('/reports/123')->assertRedirect('/login');
    $this->actingAs(User::factory()->create())->post('/reports', [
        'period_type' => 'custom_range', 'period_start_date' => '2026-07-15', 'period_end_date' => '2026-07-01',
    ])->assertSessionHasErrors('period_end_date');
    $this->post('/reports', ['period_type' => 'custom_range'])->assertSessionHasErrors(['period_start_date', 'period_end_date']);
    $this->get('/reports/123')->assertNotFound();
    expect(ReportSnapshot::query()->count())->toBe(0);
});

test('historical custom ranges include the final business second and exclude the next day', function (): void {
    $project = Project::factory()->create(['created_at' => '2026-06-01 00:00:00']);
    foreach (['2026-07-10 16:59:59', '2026-07-10 17:00:00'] as $date) {
        FeatureRequest::factory()->create(['project_id' => $project->id, 'requested_at' => $date]);
    }
    $activities = activityData(activitySnapshot('2026-07-01', '2026-07-10'))['activities'];
    expect($activities)->toHaveCount(1)
        ->and($activities[0]['occurred_at'])->toBe('2026-07-10T16:59:59+00:00')
        ->and(array_keys($activities[0]))->toBe([
            'entity_type', 'entity_id', 'title', 'project_id', 'project_name', 'activity_type',
            'activity_label', 'occurred_at', 'status', 'status_label', 'priority', 'due_date', 'note',
        ]);
});

test('activity snapshot schema uses nullable percentage defaults while legacy factories remain unchanged', function (): void {
    $columns = collect(Schema::getColumns('report_snapshots'))->keyBy('name');
    foreach (['okr1_avg_percentage', 'okr1_project_achievement_percentage', 'okr2_issue_percentage', 'okr2_feature_request_percentage'] as $name) {
        expect($columns[$name]['nullable'])->toBeTrue()
            ->and($columns[$name]['default'])->toBeNull();
    }
    $legacy = ReportSnapshot::factory()->create();
    expect($legacy->format_version)->toBe(1)
        ->and($legacy->okr1_avg_percentage)->toBe('0.00')
        ->and($legacy->okr2_issue_percentage)->toBe('100.00')
        ->and($legacy->okr2_feature_request_percentage)->toBe('100.00');
    $raw = $legacy->getRawOriginal();
    unset($raw['id'], $raw['format_version']);
    $id = DB::table('report_snapshots')->insertGetId($raw);
    expect((int) DB::table('report_snapshots')->where('id', $id)->value('format_version'))->toBe(1);
});

test('activity format migration preserves legacy data and blocks unsafe rollback', function (): void {
    $snapshot = activitySnapshot();
    $migration = require collect(glob(database_path('migrations/*version*report_snapshots*')))->sole();
    expect(fn () => $migration->down())->toThrow(RuntimeException::class, 'activity');
    expect(Schema::hasColumn('report_snapshots', 'format_version'))->toBeTrue();
    $snapshot->delete();
    $legacy = ReportSnapshot::factory()->create(['okr1_avg_percentage' => 24, 'okr2_issue_percentage' => 81]);
    $migration->down();
    expect(Schema::hasColumn('report_snapshots', 'format_version'))->toBeFalse();
    $migration->up();
    $row = DB::table('report_snapshots')->find($legacy->id);
    expect((int) $row->format_version)->toBe(1)
        ->and((float) $row->okr1_avg_percentage)->toBe(24.0)
        ->and((float) $row->okr2_issue_percentage)->toBe(81.0);
});
