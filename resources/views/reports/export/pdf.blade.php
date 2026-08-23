@php
    $labels = [
        'open' => 'Open',
        'resolved' => 'Resolved',
        'in_progress' => 'Sedang Dikerjakan',
        'fulfilled' => 'Terpenuhi',
        'urgent' => 'Urgent',
        'normal' => 'Normal',
        'low' => 'Low',
        'system_error' => 'Kesalahan sistem atau aplikasi',
        'non_system' => 'Proses operasional atau penggunaan',
        'other' => 'Infrastruktur atau belum diketahui',
    ];

    $briefMetric = $report['okr']['brief_realization'];
    $itemMetrics = [
        $report['okr']['issue_on_time'],
        $report['okr']['feature_request_on_time'],
    ];

    $logoDataUri = 'data:image/png;base64,'.base64_encode(
        file_get_contents(public_path('images/Logo RAI Full.png')),
    );

    $breakdownCards = [
        [
            'title' => 'Status Issue',
            'items' => $report['breakdowns']['issues']['by_status'],
        ],
        [
            'title' => 'Prioritas Issue',
            'items' => $report['breakdowns']['issues']['by_priority'],
        ],
        [
            'title' => 'Breakdown Root Cause',
            'items' => $report['breakdowns']['issues']['by_root_cause'],
        ],
        [
            'title' => 'Status Feature Request',
            'items' => $report['breakdowns']['feature_requests']['by_status'],
        ],
        [
            'title' => 'Prioritas Feature Request',
            'items' => $report['breakdowns']['feature_requests']['by_priority'],
        ],
    ];
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Snapshot Laporan OKR - {{ $report['snapshot']['period_label'] }}</title>
    <style>{!! $styles !!}</style>
</head>
<body>
    <div class="export-document export-pdf">
        <header class="report-header">
            <div class="report-brand">
                <img
                    class="report-brand-logo"
                    src="{{ $logoDataUri }}"
                    alt="Rumah Atsiri Indonesia"
                >
                <div class="report-brand-copy">
                    <p class="report-product-name">Project Tracker</p>
                    <p class="report-product-area">System Management</p>
                </div>
            </div>
            <div class="report-meta">
                <strong>{{ $report['snapshot']['period_label'] }}</strong>
            </div>
        </header>

        <section class="export-section">
            <h2 class="export-section-title">Ringkasan OKR</h2>
            <div class="export-summary-grid">
                <article class="export-metric-card">
                    <p class="export-metric-label">{{ $briefMetric['label'] }}</p>
                    <p class="export-metric-value">
                        {{ $briefMetric['achieved_projects'] }}/{{ $briefMetric['evaluable_projects'] }}
                    </p>
                    <span class="export-status {{ $briefMetric['evaluable_projects'] === 0 ? 'export-status-neutral' : ($briefMetric['achieved_projects'] === $briefMetric['evaluable_projects'] ? 'export-status-success' : 'export-status-warning') }}">
                        {{ $briefMetric['evaluable_projects'] === 0 ? 'Belum dapat dinilai' : ($briefMetric['achieved_projects'] . ' project tercapai') }}
                    </span>
                    <p class="export-metric-target">Target minimal {{ $briefMetric['target'] }}% realisasi per project</p>
                </article>

                @foreach ($itemMetrics as $metric)
                    <article class="export-metric-card">
                        <p class="export-metric-label">{{ $metric['label'] }}</p>
                        <p class="export-metric-value">{{ number_format($metric['actual'], 0) }}%</p>
                        <span class="export-status {{ $metric['empty_label'] !== null ? 'export-status-neutral' : ($metric['achieved'] ? 'export-status-success' : 'export-status-warning') }}">
                            {{ $metric['empty_label'] ?? ($metric['achieved'] ? 'Mencapai target' : 'Perlu perhatian') }}
                        </span>
                        <p class="export-metric-target">Target {{ $metric['target'] }}%</p>
                    </article>
                @endforeach
            </div>
        </section>

        <section class="export-section">
            <div class="export-stats-grid">
                <article class="export-stat-card">
                    <p class="export-stat-label">Total Project</p>
                    <p class="export-stat-value">{{ $report['stats']['total_projects'] }}</p>
                </article>
                <article class="export-stat-card">
                    <p class="export-stat-label">Project Aktif</p>
                    <p class="export-stat-value">{{ $report['stats']['active_projects'] }}</p>
                </article>
                <article class="export-stat-card">
                    <p class="export-stat-label">Issue</p>
                    <p class="export-stat-value">{{ $report['stats']['issues'] }}</p>
                </article>
                <article class="export-stat-card">
                    <p class="export-stat-label">Feature Request</p>
                    <p class="export-stat-value">{{ $report['stats']['feature_requests'] }}</p>
                </article>
            </div>
        </section>

        <section class="export-section">
            <h2 class="export-section-title">Realisasi OKR 1 per Project</h2>
            <p class="export-section-description">
                Project development dinilai secara individual dengan target {{ $briefMetric['target'] }}%. Project deployed ditampilkan sebagai konteks histori.
            </p>
            @if (count($report['projects']) === 0)
                <div class="export-empty">Tidak ada data project saat snapshot ini dibuat.</div>
            @else
                <table class="export-table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Status</th>
                            <th>Realisasi Brief</th>
                            <th>Hasil OKR 1</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($report['projects'] as $project)
                            <tr>
                                <td class="strong">{{ $project['name'] }}</td>
                                <td>{{ $project['status_label'] }}</td>
                                <td class="numeric">
                                    @if ($project['is_active_development'])
                                        @if ($project['is_evaluable'])
                                            {{ $project['brief_features_done'] }}/{{ $project['brief_features_total'] }}
                                            ({{ number_format($project['realization_percentage'], 0) }}%)
                                        @else
                                            <span class="muted">Belum ada brief</span>
                                        @endif
                                    @else
                                        <span class="muted">&mdash;</span>
                                    @endif
                                </td>
                                <td>
                                    @if ($project['is_active_development'])
                                        @if ($project['is_evaluable'])
                                            <span class="export-status {{ $project['achieved'] ? 'export-status-success' : 'export-status-warning' }}">
                                                {{ $project['achieved'] ? 'Tercapai' : 'Belum tercapai' }}
                                            </span>
                                        @else
                                            <span class="export-status export-status-neutral">Belum dapat dinilai</span>
                                        @endif
                                    @else
                                        <span class="export-status export-status-neutral">Selesai / deployed</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>

        <section class="export-section">
            <h2 class="export-section-title">Detail Issue</h2>
            <p class="export-section-description">
                {{ $report['issues']['total'] === 0 ? ($report['issues']['empty_label'] ?? 'Tidak ada issue baru pada periode ini.') : $report['issues']['on_time'] . ' dari ' . $report['issues']['total'] . ' issue selesai tepat waktu.' }}
            </p>
            @if ($report['issues']['total'] === 0)
                <div class="export-empty">{{ $report['issues']['empty_label'] ?? 'Tidak ada issue baru pada periode ini.' }}</div>
            @else
                <table class="export-table">
                    <thead>
                        <tr>
                            <th>Issue</th>
                            <th>Project</th>
                            <th>Prioritas</th>
                            <th>Status</th>
                            <th>Dilaporkan</th>
                            <th>Batas Waktu</th>
                            <th>SLA</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($report['issues']['items'] as $issue)
                            <tr>
                                <td class="strong">{{ $issue['title'] }}</td>
                                <td>{{ $issue['project_name'] }}</td>
                                <td>{{ $labels[$issue['priority']] ?? $issue['priority'] }}</td>
                                <td>{{ $labels[$issue['status']] ?? $issue['status'] }}</td>
                                <td>{{ $issue['reported_at_label'] }}</td>
                                <td>{{ $issue['due_date_label'] }}</td>
                                <td>
                                    <span class="export-status {{ $issue['is_on_time'] === true ? 'export-status-success' : 'export-status-neutral' }}">
                                        {{ $issue['is_on_time'] === true ? 'Tepat waktu' : 'Open / terlambat' }}
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>

        <section class="export-section">
            <h2 class="export-section-title">Detail Feature Request</h2>
            <p class="export-section-description">
                {{ $report['feature_requests']['total'] === 0 ? ($report['feature_requests']['empty_label'] ?? 'Tidak ada Feature Request baru pada periode ini.') : $report['feature_requests']['on_time'] . ' dari ' . $report['feature_requests']['total'] . ' Feature Request terpenuhi tepat waktu.' }}
            </p>
            @if ($report['feature_requests']['total'] === 0)
                <div class="export-empty">{{ $report['feature_requests']['empty_label'] ?? 'Tidak ada Feature Request baru pada periode ini.' }}</div>
            @else
                <table class="export-table">
                    <thead>
                        <tr>
                            <th>Request</th>
                            <th>Project</th>
                            <th>Prioritas</th>
                            <th>Status</th>
                            <th>Diminta</th>
                            <th>Batas Waktu</th>
                            <th>SLA</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($report['feature_requests']['items'] as $request)
                            <tr>
                                <td class="strong">{{ $request['title'] }}</td>
                                <td>{{ $request['project_name'] }}</td>
                                <td>{{ $labels[$request['priority']] ?? $request['priority'] }}</td>
                                <td>{{ $labels[$request['status']] ?? $request['status'] }}</td>
                                <td>{{ $request['requested_at_label'] }}</td>
                                <td>{{ $request['due_date_label'] }}</td>
                                <td>
                                    <span class="export-status {{ $request['is_on_time'] === true ? 'export-status-success' : 'export-status-neutral' }}">
                                        {{ $request['is_on_time'] === true ? 'Tepat waktu' : 'Open / terlambat' }}
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>

        <section class="export-section">
            <h2 class="export-section-title">Breakdown Pendukung</h2>
            <div class="export-breakdown-grid">
                @foreach ($breakdownCards as $breakdown)
                    <article class="export-breakdown-card">
                        <h3>{{ $breakdown['title'] }}</h3>
                        @if (count($breakdown['items']) === 0)
                            <p class="export-summary-copy">Tidak ada data pada periode ini.</p>
                        @else
                            <ul class="export-breakdown-list">
                                @foreach ($breakdown['items'] as $item)
                                    <li>
                                        <span>{{ $labels[$item['value']] ?? $item['value'] }}</span>
                                        <strong>{{ $item['count'] }}</strong>
                                    </li>
                                @endforeach
                            </ul>
                        @endif
                    </article>
                @endforeach
            </div>
        </section>

        <footer class="export-footer">
            Snapshot ini merekam kondisi OKR pada {{ $report['snapshot']['period_label'] }} dan tidak berubah ketika data operasional setelahnya diperbarui.
        </footer>
    </div>
</body>
</html>
