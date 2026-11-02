@php
    $logoDataUri = 'data:image/png;base64,'.base64_encode(file_get_contents(public_path('images/Logo RAI Full.png')));
    $summary = $report['activity_summary'];
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Aktivitas - {{ $report['snapshot']['period_label'] }}</title>
    <style>{!! $styles !!}</style>
    <style>
        .activity-document .export-table { table-layout: fixed; }
        .activity-document .export-table td, .activity-document .export-project-name { overflow-wrap: anywhere; white-space: normal; }
        .activity-document .activity-details { page-break-inside: auto; break-inside: auto; }
        .activity-document .activity-note { white-space: pre-wrap; overflow-wrap: anywhere; margin: 6px 0 0; }
        .activity-document .activity-summary { margin: 0 0 16px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="export-document export-pdf activity-document">
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
            <p class="activity-summary"><strong>{{ $summary['total_activities'] }} aktivitas</strong> dari {{ $summary['unique_items'] }} item unik</p>
            <p class="export-section-description">Satu item dapat memiliki aktivitas baru dan penyelesaian pada periode yang sama.</p>
            <table class="export-table">
                <thead><tr><th>Jenis item</th><th class="numeric">Baru</th><th class="numeric">Selesai</th><th class="numeric">Aktivitas</th><th class="numeric">Item unik</th></tr></thead>
                <tbody>
                    @foreach ($summary['groups'] as $group)
                        <tr><td class="strong">{{ $group['label'] }}</td><td class="numeric">{{ $group['new_items'] }}</td><td class="numeric">{{ $group['completed_items'] }}</td><td class="numeric">{{ $group['total_activities'] }}</td><td class="numeric">{{ $group['unique_items'] }}</td></tr>
                    @endforeach
                </tbody>
            </table>
        </section>

        @php
            $formatActivityDate = static function (?string $value): string {
                if ($value === null) {
                    return '—';
                }
                $dateOnly = preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1;
                $date = $dateOnly
                    ? \Carbon\CarbonImmutable::parse($value, \App\Support\AppDateTime::businessTimezone())
                    : \App\Support\AppDateTime::inBusinessTimezone($value);

                return $date->locale('id')->translatedFormat($dateOnly ? 'j M Y' : 'j M Y, H:i');
            };
            $entityLabels = ['project' => 'Project', 'brief_feature' => 'Brief Feature', 'issue' => 'Issue', 'feature_request' => 'Feature Request'];
            $priorityLabels = ['urgent' => 'Urgent', 'normal' => 'Normal', 'low' => 'Low'];
        @endphp
        <section class="export-section activity-details">
            <h2 class="export-section-title">Rincian aktivitas</h2>
            <p class="export-section-description">Waktu ditampilkan dalam WIB. Penyelesaian development project dicatat sebagai tanggal tanpa jam.</p>
            @if (count($report['activities']) === 0)
                <div class="export-empty">Tidak ada aktivitas pada periode ini.</div>
            @else
                <table class="export-table">
                    <thead><tr><th style="width: 21%">Aktivitas / waktu</th><th style="width: 36%">Item / catatan</th><th style="width: 22%">Project terkait</th><th style="width: 21%">Status / konteks</th></tr></thead>
                    <tbody>
                        @foreach ($report['activities'] as $activity)
                            <tr>
                                <td><strong>{{ $activity['activity_label'] }}</strong><br>{{ $formatActivityDate($activity['occurred_at']) }}</td>
                                <td><strong>{{ $activity['title'] }}</strong><br><span class="muted">{{ $entityLabels[$activity['entity_type']] }}</span>@if ($activity['note'])<p class="activity-note">{{ $activity['note'] }}</p>@endif</td>
                                <td>{{ $activity['project_name'] ?? 'Tanpa project terkait' }}</td>
                                <td>{{ $activity['status_label'] }}@if ($activity['priority'])<br>Prioritas: {{ $priorityLabels[$activity['priority']] ?? $activity['priority'] }}@endif @if ($activity['due_date'])<br>Batas waktu: {{ $formatActivityDate($activity['due_date']) }}@endif</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>

        <footer class="export-footer">Aktivitas tersimpan untuk {{ $report['snapshot']['period_label'] }}. Perubahan data operasional setelah laporan dibuat tidak mengubah snapshot ini.</footer>
    </div>
</body>
</html>
