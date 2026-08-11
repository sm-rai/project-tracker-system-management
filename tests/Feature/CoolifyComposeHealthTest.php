<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

test('coolify excludes the queue worker from aggregate health checks', function () {
    $source = File::get(base_path('docker-compose.coolify.yaml'));
    $worker = Str::between($source, "\n  worker:\n", "\n  database:\n");

    expect($worker)
        ->toContain('    exclude_from_hc: true')
        ->not->toContain('healthcheck:');
});
