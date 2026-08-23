<?php

use App\Actions\Reports\BuildReportExportData;
use App\Actions\Reports\RenderReportSnapshotExport;
use App\Models\ReportSnapshot;
use App\Models\User;

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

    $this->mock(RenderReportSnapshotExport::class, function ($mock): void {
        $mock->shouldReceive('pdf')
            ->once()
            ->andReturn(base64_encode('%PDF-test'));
    });

    $response = $this->actingAs($user)
        ->get("/reports/{$snapshot->id}/export/pdf");

    $response->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeaderContains(
            'content-disposition',
            'snapshot-okr-27-jul-2026-02-agu-2026.pdf',
        );
});

test('authenticated users can download a snapshot as png', function (): void {
    $user = User::factory()->create();
    $snapshot = ReportSnapshot::factory()->create([
        'period_start_date' => '2026-07-27',
        'period_end_date' => '2026-08-02',
    ]);

    $this->mock(RenderReportSnapshotExport::class, function ($mock): void {
        $mock->shouldReceive('png')
            ->once()
            ->andReturnUsing(function (string $html, string $path): void {
                file_put_contents($path, 'png-test');
            });
    });

    $response = $this->actingAs($user)
        ->get("/reports/{$snapshot->id}/export/png");

    $response->assertOk()
        ->assertHeader('content-type', 'image/png')
        ->assertHeaderContains(
            'content-disposition',
            'snapshot-okr-27-jul-2026-02-agu-2026.png',
        );
});

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

    $data = app(BuildReportExportData::class)->handle($snapshot);

    expect($data['snapshot']['period_label'])->toBe('27 Jul 2026 - 2 Agu 2026')
        ->and($data['okr']['issue_on_time']['actual'])->toBe(100.0)
        ->and($data['okr']['issue_on_time']['empty_label'])->toBe('Tidak ada issue baru')
        ->and($data['issues']['empty_label'])->toBe('Tidak ada issue baru pada periode ini.')
        ->and($data['feature_requests']['empty_label'])->toBe('Tidak ada Feature Request baru pada periode ini.');
});

test('export templates contain the report summary and empty state copy', function (): void {
    $snapshot = ReportSnapshot::factory()->create([
        'period_start_date' => '2026-08-09',
        'period_end_date' => '2026-08-15',
        'period_type' => ReportSnapshot::PeriodCustomRange,
        'generated_at' => '2026-08-17 23:51:00',
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

    $data = app(BuildReportExportData::class)->handle($snapshot);
    $styles = file_get_contents(resource_path('css/report-export.css'));
    $viewData = ['report' => $data, 'styles' => $styles];
    $pdfHtml = view('reports.export.pdf', $viewData)->render();
    $pngHtml = view('reports.export.png', $viewData)->render();

    expect($pdfHtml)
        ->toContain('Snapshot Laporan OKR')
        ->toContain('class="report-brand-logo"')
        ->toContain('src="data:image/png;base64,')
        ->toContain('<p class="report-product-name">Project Tracker</p>')
        ->toContain('<p class="report-product-area">System Management</p>')
        ->toContain('<strong>9 Agu 2026 - 15 Agu 2026</strong>')
        ->not->toContain('class="report-brand-mark"')
        ->not->toContain('Rentang tanggal')
        ->not->toContain('<span>Dibuat ')
        ->toContain('<p class="export-stat-label">Issue</p>')
        ->toContain('<p class="export-stat-label">Feature Request</p>')
        ->not->toContain('Issue pada Periode')
        ->not->toContain('Feature Request pada Periode')
        ->toContain('Tidak ada issue baru pada periode ini.')
        ->toContain('Tidak ada Feature Request baru pada periode ini.')
        ->toContain('Breakdown Root Cause')
        ->and($pngHtml)
        ->toContain('Snapshot Laporan OKR')
        ->toContain('class="report-brand-logo"')
        ->toContain('src="data:image/png;base64,')
        ->toContain('<p class="report-product-name">Project Tracker</p>')
        ->toContain('<p class="report-product-area">System Management</p>')
        ->toContain('<strong>9 Agu 2026 - 15 Agu 2026</strong>')
        ->not->toContain('class="report-brand-mark"')
        ->not->toContain('<span>Dibuat ')
        ->toContain('<p class="export-stat-label">Issue</p>')
        ->toContain('<p class="export-stat-label">Feature Request</p>')
        ->not->toContain('Issue Baru')
        ->not->toContain('Feature Request Baru')
        ->toContain('Target minimal 75% realisasi per project')
        ->toContain('Issue SLA')
        ->toContain('Feature Request SLA');

    expect($styles)
        ->toMatch('/\.export-pdf \.export-summary-grid\s*\{[^}]*padding-right: 2px;/s')
        ->toMatch('/\.export-pdf \.export-breakdown-grid\s*\{[^}]*padding-right: 2px;/s')
        ->toContain('.export-pdf .export-stats-grid')
        ->toContain('display: flex;')
        ->toContain('padding-right: 2px;')
        ->toContain('flex: 0 0 calc(25% - 9px);');
});

test('export pdf renders populated issue and feature request rows', function (): void {
    $snapshot = ReportSnapshot::factory()->make([
        'issue_breakdown_json' => [
            'empty_label' => null,
            'total' => 1,
            'on_time' => 0,
            'items' => [[
                'id' => 1,
                'title' => 'Gagal menyimpan transaksi',
                'project_name' => 'Sistem POS',
                'priority' => 'urgent',
                'root_cause_category' => 'system_error',
                'status' => 'open',
                'reported_at' => '2026-08-01 09:00:00',
                'due_date' => '2026-08-02',
                'resolved_at' => null,
                'is_on_time' => null,
            ]],
            'by_status' => [['value' => 'open', 'count' => 1]],
            'by_priority' => [['value' => 'urgent', 'count' => 1]],
            'by_root_cause' => [['value' => 'system_error', 'count' => 1]],
        ],
        'feature_request_breakdown_json' => [
            'empty_label' => null,
            'total' => 1,
            'on_time' => 1,
            'items' => [[
                'id' => 2,
                'title' => 'Tambah filter laporan',
                'project_name' => 'Sistem POS',
                'priority' => 'normal',
                'status' => 'fulfilled',
                'requested_at' => '2026-08-01 10:00:00',
                'due_date' => '2026-08-04',
                'fulfilled_at' => '2026-08-02 10:00:00',
                'is_on_time' => true,
            ]],
            'by_status' => [['value' => 'fulfilled', 'count' => 1]],
            'by_priority' => [['value' => 'normal', 'count' => 1]],
        ],
    ]);

    $data = app(BuildReportExportData::class)->handle($snapshot);
    $html = view('reports.export.pdf', ['report' => $data, 'styles' => ''])->render();

    expect($html)
        ->toContain('Gagal menyimpan transaksi')
        ->toContain('Tambah filter laporan')
        ->toContain('1 Agu 2026');
});

test('export templates use a dash for deployed project brief realization', function (): void {
    $snapshot = ReportSnapshot::factory()->make([
        'project_breakdown_json' => [
            'target_percentage' => 75,
            'active_total' => 0,
            'evaluable_total' => 0,
            'achieved_total' => 0,
            'total' => 1,
            'projects' => [[
                'id' => 1,
                'name' => 'Project Tracker',
                'status' => 'deployed_running',
                'status_label' => 'Running',
                'is_active_development' => false,
                'brief_features_total' => 0,
                'brief_features_done' => 0,
                'realization_percentage' => 100,
                'target_percentage' => 75,
                'is_evaluable' => false,
                'achieved' => false,
            ]],
            'status_distribution' => [],
        ],
    ]);

    $data = app(BuildReportExportData::class)->handle($snapshot);
    $pdfHtml = view('reports.export.pdf', ['report' => $data, 'styles' => ''])->render();
    $pngHtml = view('reports.export.png', ['report' => $data, 'styles' => ''])->render();

    expect($pdfHtml)
        ->toContain('&mdash;')
        ->not->toContain('Di luar radar')
        ->toContain('Selesai / deployed')
        ->and($pngHtml)
        ->toContain('&mdash;')
        ->not->toContain('100% selesai')
        ->toContain('Selesai / deployed');
});
