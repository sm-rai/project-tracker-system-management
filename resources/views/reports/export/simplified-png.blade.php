@php
    $logoDataUri = 'data:image/png;base64,'.base64_encode(file_get_contents(public_path('images/Logo RAI Full.png')));
    $formatPercentage = static function (?float $value): string {
        if ($value === null) {
            return 'Belum ada Brief Feature';
        }

        $formatted = rtrim(rtrim(number_format($value, 1, ',', '.'), '0'), ',');

        return $formatted.'%';
    };
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Aktivitas - {{ $report['snapshot']['period_label'] }}</title>
    <style>{!! $styles !!}</style>
</head>
<body>
    <div class="export-document export-png simplified-document">
        <header class="report-header">
            <div class="report-brand">
                <img class="report-brand-logo" src="{{ $logoDataUri }}" alt="Rumah Atsiri Indonesia">
                <div class="report-brand-copy">
                    <p class="report-product-name">Project Tracker</p>
                    <p class="report-product-area">System Management</p>
                </div>
            </div>
            <div class="report-meta">
                <strong>{{ $report['snapshot']['period_label'] }}</strong>
                <span>{{ $report['snapshot']['period_type_label'] }}</span><br>
                <span>Dibuat {{ $report['snapshot']['generated_at'] }} WIB</span>
            </div>
        </header>

        <section class="export-section">
            <h1 class="export-section-title">Laporan Aktivitas</h1>
            <p class="export-section-description">Ringkasan project aktif dan penyelesaian pada periode ini.</p>
        </section>

        <section class="export-section">
            <h2 class="export-section-title">Project aktif</h2>
            @if (count($report['active_projects']) === 0)
                <div class="export-empty">Tidak ada project aktif saat laporan ini dibuat.</div>
            @else
                <div class="export-project-list">
                    @foreach ($report['active_projects'] as $project)
                        <article class="export-project-row">
                            <div class="export-project-header">
                                <p class="export-project-name">{{ $project['name'] }}</p>
                                @if ($project['progress_percentage'] === null)
                                    <p class="export-project-status">Belum ada Brief Feature</p>
                                @endif
                            </div>
                            @if ($project['progress_percentage'] !== null)
                                @php($progress = min(100, max(0, (float) $project['progress_percentage'])))
                                <div class="export-project-progress">
                                    <div class="export-progress"><span style="width: {{ $progress }}%"></span></div>
                                    <span class="export-project-value">{{ $formatPercentage((float) $project['progress_percentage']) }}</span>
                                </div>
                            @endif
                        </article>
                    @endforeach
                </div>
            @endif
        </section>

        <section class="export-section">
            <h2 class="export-section-title">Penyelesaian</h2>
            <div class="export-mini-grid">
                <article class="export-mini-card">
                    <h3>Issue solved</h3>
                    <p>{{ $report['summary']['resolved_issue_count'] }} Issue solved dalam periode ini.</p>
                </article>
                <article class="export-mini-card">
                    <h3>Feature Request delivered</h3>
                    <p>{{ $report['summary']['fulfilled_feature_request_count'] }} Feature Request delivered dalam periode ini.</p>
                </article>
            </div>
        </section>

        <footer class="export-footer">Rincian deskripsi, project, dan waktu penyelesaian tersedia pada laporan dan PDF.</footer>
    </div>
</body>
</html>
