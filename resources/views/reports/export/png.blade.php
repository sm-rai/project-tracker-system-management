@php
    $briefMetric = $report['okr']['brief_realization'];
    $itemMetrics = [
        $report['okr']['issue_on_time'],
        $report['okr']['feature_request_on_time'],
    ];
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Ringkasan Snapshot OKR - {{ $report['snapshot']['period_label'] }}</title>
    <style>{!! $styles !!}</style>
</head>
<body>
    <div class="export-document export-png">
        <header class="report-header">
            <div class="report-brand">
                <div class="report-brand-mark">RAI</div>
                <div>
                    <p class="report-eyebrow">Project Tracker · Rumah Atsiri Indonesia</p>
                    <h1 class="report-title">Snapshot Laporan OKR</h1>
                    <p class="report-subtitle">Divisi System Management · {{ $report['snapshot']['period_type_label'] }}</p>
                </div>
            </div>
            <div class="report-meta">
                <strong>{{ $report['snapshot']['period_label'] }}</strong>
                <span>Dibuat {{ $report['snapshot']['generated_at'] }}</span>
            </div>
        </header>

        <section class="export-section">
            <div class="export-summary-grid">
                <article class="export-metric-card">
                    <p class="export-metric-label">{{ $briefMetric['label'] }}</p>
                    <p class="export-metric-value">
                        {{ $briefMetric['achieved_projects'] }}/{{ $briefMetric['evaluable_projects'] }}
                    </p>
                    <span class="export-status {{ $briefMetric['evaluable_projects'] === 0 ? 'export-status-neutral' : ($briefMetric['achieved_projects'] === $briefMetric['evaluable_projects'] ? 'export-status-success' : 'export-status-warning') }}">
                        {{ $briefMetric['evaluable_projects'] === 0 ? 'Belum dapat dinilai' : ($briefMetric['achieved_projects'] . ' project tercapai') }}
                    </span>
                    <p class="export-metric-target">Target {{ $briefMetric['target'] }}% per project</p>
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
                    <p class="export-stat-label">Issue Baru</p>
                    <p class="export-stat-value">{{ $report['stats']['issues'] }}</p>
                </article>
                <article class="export-stat-card">
                    <p class="export-stat-label">Feature Request Baru</p>
                    <p class="export-stat-value">{{ $report['stats']['feature_requests'] }}</p>
                </article>
            </div>
        </section>

        <section class="export-section">
            <h2 class="export-section-title">Realisasi Project</h2>
            <p class="export-section-description">
                Progress project development yang menjadi dasar OKR 1.
            </p>
            @if (count($report['projects']) === 0)
                <div class="export-empty">Tidak ada data project saat snapshot ini dibuat.</div>
            @else
                <div class="export-project-list">
                    @foreach ($report['projects'] as $project)
                        <article class="export-project-row">
                            <div class="export-project-header">
                                <div>
                                    <p class="export-project-name">{{ $project['name'] }}</p>
                                    <p class="export-project-status">{{ $project['status_label'] }}</p>
                                </div>
                                @if ($project['is_active_development'] && $project['is_evaluable'])
                                    <span class="export-status {{ $project['achieved'] ? 'export-status-success' : 'export-status-warning' }}">
                                        {{ $project['achieved'] ? 'Tercapai' : 'Belum tercapai' }}
                                    </span>
                                @elseif ($project['is_active_development'])
                                    <span class="export-status export-status-neutral">Belum ada brief</span>
                                @else
                                    <span class="export-status export-status-neutral">Selesai / deployed</span>
                                @endif
                            </div>
                            <div class="export-project-progress">
                                @if ($project['is_active_development'] && $project['is_evaluable'])
                                    <div class="export-progress {{ $project['achieved'] ? 'export-progress-success' : 'export-progress-warning' }}">
                                        <span style="width: {{ min(max((float) $project['realization_percentage'], 0), 100) }}%"></span>
                                    </div>
                                    <span class="export-project-value">
                                        {{ number_format($project['realization_percentage'], 0) }}% ·
                                        {{ $project['brief_features_done'] }}/{{ $project['brief_features_total'] }} fitur
                                    </span>
                                @elseif ($project['is_active_development'])
                                    <div class="export-progress export-progress-neutral">
                                        <span style="width: 0%"></span>
                                    </div>
                                    <span class="export-project-value">Belum dapat dinilai</span>
                                @else
                                    <div class="export-progress export-progress-success">
                                        <span style="width: 100%"></span>
                                    </div>
                                    <span class="export-project-value">100% selesai</span>
                                @endif
                            </div>
                        </article>
                    @endforeach
                </div>
            @endif
        </section>

        <section class="export-section">
            <div class="export-mini-grid">
                <article class="export-mini-card">
                    <h3>Issue</h3>
                    <p>
                        {{ $report['issues']['total'] === 0 ? ($report['issues']['empty_label'] ?? 'Tidak ada issue baru pada periode ini.') : $report['issues']['on_time'] . ' dari ' . $report['issues']['total'] . ' issue selesai tepat waktu.' }}
                    </p>
                </article>
                <article class="export-mini-card">
                    <h3>Feature Request</h3>
                    <p>
                        {{ $report['feature_requests']['total'] === 0 ? ($report['feature_requests']['empty_label'] ?? 'Tidak ada Feature Request baru pada periode ini.') : $report['feature_requests']['on_time'] . ' dari ' . $report['feature_requests']['total'] . ' request terpenuhi tepat waktu.' }}
                    </p>
                </article>
            </div>
        </section>

        <footer class="export-footer">
            Snapshot ini merekam kondisi OKR pada {{ $report['snapshot']['period_label'] }}.
        </footer>
    </div>
</body>
</html>
