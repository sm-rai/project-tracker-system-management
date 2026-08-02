<?php

use App\Enums\Priority;
use App\Models\Issue;
use App\Models\SlaConfig;

test('sla target is stored in hours and exposes the configured value', function () {
    $config = SlaConfig::create([
        'priority' => Priority::Urgent,
        'target_resolution_hours' => 24,
    ]);

    expect($config->target_resolution_hours)->toBe(24)
        ->and(SlaConfig::hoursForPriority(Priority::Urgent))->toBe(24);
});

test('issue deadline is exactly the configured hours after the report time', function () {
    SlaConfig::create([
        'priority' => Priority::Urgent,
        'target_resolution_hours' => 24,
    ]);

    $issue = Issue::factory()->create([
        'priority' => Priority::Urgent,
        'reported_at' => '2026-08-01 17:00:00',
    ]);

    expect($issue->due_date->format('Y-m-d H:i:s'))->toBe('2026-08-02 17:00:00');
});
