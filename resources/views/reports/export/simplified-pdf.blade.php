@php
    $logoDataUri = 'data:image/png;base64,'.base64_encode(file_get_contents(public_path('images/Logo RAI Full.png')));
    $formatDateTime = static function (string $value): string {
        return \App\Support\AppDateTime::inBusinessTimezone(\Carbon\CarbonImmutable::parse($value))
            ->locale('id')
            ->translatedFormat('j M Y, H.i').' WIB';
    };
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
    <div class="export-document export-pdf simplified-document">
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

        @foreach ([
            [
                'title' => 'Issue solved',
                'items' => $report['resolved_issues'],
                'completion_label' => 'Solved',
                'empty_copy' => 'Belum ada Issue yang solved pada periode ini.',
            ],
            [
                'title' => 'Feature Request delivered',
                'items' => $report['fulfilled_feature_requests'],
                'completion_label' => 'Delivered',
                'empty_copy' => 'Belum ada Feature Request yang delivered pada periode ini.',
            ],
        ] as $section)
            <section class="export-section simplified-details">
                <h2 class="export-section-title">{{ $section['title'] }}</h2>
                @if (count($section['items']) === 0)
                    <div class="export-empty">{{ $section['empty_copy'] }}</div>
                @else
                    <div class="simplified-item-list">
                        @foreach ($section['items'] as $item)
                            <article class="simplified-item">
                                <h3 class="simplified-item-title">{{ $item['title'] }}</h3>
                                <p class="simplified-item-description">{{ $item['description'] ?: 'Belum ada deskripsi.' }}</p>
                                <div class="simplified-item-meta">
                                    <span>Project: {{ $item['project_name'] ?? 'Tanpa project terkait' }}</span>
                                    <span>{{ $section['completion_label'] }} {{ $formatDateTime($item['solved_at']) }}</span>
                                </div>
                            </article>
                        @endforeach
                    </div>
                @endif
            </section>
        @endforeach

        <footer class="export-footer">Snapshot ini memuat data sebagaimana tersimpan saat laporan dibuat.</footer>
    </div>
</body>
</html>
