<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

test('coolify excludes the queue worker from aggregate health checks', function (): void {
    $source = File::get(base_path('docker-compose.coolify.yaml'));
    $worker = Str::between($source, "\n  worker:\n", "\n  database:\n");

    expect($worker)
        ->toContain('    exclude_from_hc: true')
        ->not->toContain('healthcheck:');
});

test('production image gives chromium writable runtime directories', function (): void {
    $source = File::get(base_path('Dockerfile'));

    expect($source)
        ->toContain('    HOME=/tmp/.chromium \\')
        ->toContain('    XDG_CONFIG_HOME=/tmp/.chromium/config \\')
        ->toContain('    XDG_CACHE_HOME=/tmp/.chromium/cache \\')
        ->toContain('    && install -d -o www-data -g www-data -m 0700 /tmp/.chromium');
});
